import { env } from '../config/env';
import { httpClient } from '../services/http-client';
import type { ChatMessage } from '../entities';

export type MessagingServerEvent =
  | { type: 'ready'; userId: string }
  | { type: 'pong' }
  | { type: 'ack'; message: ChatMessage }
  | { type: 'new_message'; conversationId: string; message: ChatMessage }
  | { type: 'error'; code: string; message: string };

export interface MessagingConnection {
  stop: () => void;
  send: (conversationId: string, content: string) => boolean;
  ping: () => void;
}

export function createMessagingConnection(handlers: {
  onEvent: (ev: MessagingServerEvent) => void;
  onState: (state: 'connecting' | 'open' | 'closed') => void;
}): MessagingConnection {
  let ws: WebSocket | null = null;
  let stopped = false;
  let reconnectTimer: ReturnType<typeof setTimeout> | undefined;

  function clearTimer(): void {
    if (reconnectTimer !== undefined) {
      clearTimeout(reconnectTimer);
      reconnectTimer = undefined;
    }
  }

  async function connect(): Promise<void> {
    if (stopped) return;
    handlers.onState('connecting');
    try {
      const t = await httpClient.get<{ ticket: string; expiresInSeconds: number }>(
        '/messaging/ws-ticket',
      );
      if (stopped) return;
      const url = `${env.MESSAGING_WS_URL}?ticket=${encodeURIComponent(t.ticket)}`;
      const socket = new WebSocket(url);
      ws = socket;

      socket.onopen = () => {
        handlers.onState('open');
      };

      socket.onmessage = (ev) => {
        try {
          const data = JSON.parse(ev.data as string) as MessagingServerEvent;
          handlers.onEvent(data);
        } catch {
          /* ignore */
        }
      };

      socket.onclose = () => {
        handlers.onState('closed');
        ws = null;
        if (!stopped) {
          clearTimer();
          reconnectTimer = setTimeout(() => void connect(), 4000);
        }
      };

      socket.onerror = () => {
        socket.close();
      };
    } catch {
      handlers.onState('closed');
      ws = null;
      if (!stopped) {
        clearTimer();
        reconnectTimer = setTimeout(() => void connect(), 6000);
      }
    }
  }

  void connect();

  return {
    stop: () => {
      stopped = true;
      clearTimer();
      ws?.close();
      ws = null;
    },
    send: (conversationId: string, content: string) => {
      if (ws?.readyState !== WebSocket.OPEN) return false;
      ws.send(JSON.stringify({ type: 'send', conversationId, content }));
      return true;
    },
    ping: () => {
      if (ws?.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'ping' }));
      }
    },
  };
}
