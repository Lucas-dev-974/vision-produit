import { For, Show, createEffect, createSignal, onCleanup, onMount } from 'solid-js';
import { A, useParams } from '@solidjs/router';
import { authStore } from '../stores/auth.store';
import { conversationsService } from '../services/conversations.service';
import type { ApiError } from '../services/http-client';
import type { ChatMessage } from '../entities';
import { createMessagingConnection, type MessagingServerEvent } from '../lib/messaging-ws';
import { inboxStore } from '../stores/inbox.store';
import { Button } from '../components/ui/button';
import { formatIsoDate } from '../lib/formatters/date';

export function ConversationPage() {
  const params = useParams<{ id: string }>();
  const [messages, setMessages] = createSignal<ChatMessage[]>([]);
  const [loadError, setLoadError] = createSignal<string | null>(null);
  const [sendError, setSendError] = createSignal<string | null>(null);
  const [loading, setLoading] = createSignal(true);
  const [draft, setDraft] = createSignal('');
  const [sending, setSending] = createSignal(false);
  const [wsState, setWsState] = createSignal<'connecting' | 'open' | 'closed'>('closed');
  let scrollRoot: HTMLDivElement | undefined;

  function appendIfNew(m: ChatMessage): void {
    setMessages((prev) => {
      if (prev.some((x) => x.id === m.id)) return prev;
      return [...prev, m];
    });
  }

  function handleWsEvent(ev: MessagingServerEvent): void {
    if (ev.type === 'new_message' && ev.conversationId === params.id) {
      appendIfNew(ev.message);
      const uid = authStore.currentUser()?.id;
      if (uid && ev.message.senderId !== uid) {
        void conversationsService.markRead(params.id).then(() => inboxStore.refresh());
      } else {
        void inboxStore.refresh();
      }
    }
    if (ev.type === 'ack') {
      appendIfNew(ev.message);
    }
    if (ev.type === 'error') {
      setSendError(ev.message);
    }
  }

  let conn: ReturnType<typeof createMessagingConnection> | undefined;

  onMount(async () => {
    if (!authStore.currentUser()) {
      await authStore.loadCurrentUser();
    }
    setLoading(true);
    setLoadError(null);
    try {
      const rows = await conversationsService.listMessages(params.id, { limit: 100 });
      setMessages(rows);
      try {
        await conversationsService.markRead(params.id);
        await inboxStore.refresh();
      } catch {
        /* ignore */
      }
    } catch (err) {
      const api = err as ApiError;
      setLoadError(api.message ?? 'Conversation introuvable ou accès refusé.');
    } finally {
      setLoading(false);
    }

    conn = createMessagingConnection({
      onEvent: handleWsEvent,
      onState: setWsState,
    });
  });

  onCleanup(() => {
    conn?.stop();
  });

  createEffect(() => {
    messages();
    queueMicrotask(() => {
      if (scrollRoot) {
        scrollRoot.scrollTop = scrollRoot.scrollHeight;
      }
    });
  });

  async function onSend(e: Event) {
    e.preventDefault();
    const text = draft().trim();
    if (!text || sending()) return;
    setSendError(null);
    setSending(true);
    try {
      const sent = conn?.send(params.id, text);
      if (!sent) {
        const msg = await conversationsService.postMessage(params.id, text);
        appendIfNew(msg);
      }
      setDraft('');
    } catch (err) {
      const api = err as ApiError;
      setSendError(api.message ?? 'Envoi impossible.');
    } finally {
      setSending(false);
    }
  }

  const me = () => authStore.currentUser()?.id;

  return (
    <div class="flex h-[min(70vh,640px)] flex-col gap-4">
      <div class="flex flex-wrap items-center justify-between gap-3">
        <A
          href="/app/messages"
          class="text-sm font-semibold text-moss underline underline-offset-2 hover:text-moss-light"
        >
          ← Conversations
        </A>
        <p class="font-mono text-xs text-ink/60">
          Temps réel :{' '}
          <span
            class={
              wsState() === 'open'
                ? 'text-moss'
                : wsState() === 'connecting'
                  ? 'text-ochre'
                  : 'text-rust'
            }
          >
            {wsState() === 'open'
              ? 'connecté'
              : wsState() === 'connecting'
                ? 'connexion…'
                : 'hors ligne (reconnexion auto)'}
          </span>
        </p>
      </div>

      <Show when={loadError()}>
        {(msg) => (
          <div
            class="rounded-xl border border-rust/40 bg-rust/10 px-4 py-3 text-sm text-rust"
            role="alert"
          >
            {msg()}
          </div>
        )}
      </Show>

      <Show when={loading()}>
        <p class="text-ink/70">Chargement des messages…</p>
      </Show>

      <Show when={!loading() && !loadError()}>
        <div
          ref={(el) => {
            scrollRoot = el;
          }}
          class="flex flex-1 flex-col gap-3 overflow-y-auto rounded-2xl border border-cream-dark bg-cream/80 p-4 shadow-inner"
        >
          <For each={messages()}>
            {(m) => {
              const mine = () => m.senderId === me();
              return (
                <div class={`flex ${mine() ? 'justify-end' : 'justify-start'}`}>
                  <div
                    class={`max-w-[85%] rounded-2xl px-4 py-2 text-sm ${
                      mine()
                        ? 'bg-moss text-cream'
                        : 'border border-cream-dark bg-cream text-ink'
                    }`}
                  >
                    <p class="whitespace-pre-wrap break-words">{m.content}</p>
                    <p
                      class={`mt-1 font-mono text-[10px] uppercase tracking-wide ${
                        mine() ? 'text-cream/80' : 'text-ink/50'
                      }`}
                    >
                      {formatIsoDate(m.createdAt)}
                    </p>
                  </div>
                </div>
              );
            }}
          </For>
        </div>

        <form onSubmit={onSend} class="flex flex-col gap-2 sm:flex-row sm:items-end">
          <textarea
            class="min-h-[88px] flex-1 resize-y rounded-xl border border-cream-dark bg-cream px-3 py-2 text-sm text-ink placeholder:text-ink/40 focus:border-moss focus:outline-none focus:ring-1 focus:ring-moss"
            placeholder="Votre message…"
            maxlength={2000}
            value={draft()}
            onInput={(e) => setDraft(e.currentTarget.value)}
            disabled={sending()}
          />
          <Button type="submit" class="shrink-0" disabled={sending() || !draft().trim()}>
            Envoyer
          </Button>
        </form>
        <Show when={sendError()}>
          {(msg) => (
            <p class="text-sm text-rust" role="alert">
              {msg()}
            </p>
          )}
        </Show>
      </Show>
    </div>
  );
}
