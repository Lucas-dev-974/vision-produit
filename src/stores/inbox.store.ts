import { createSignal } from 'solid-js';
import { httpClient } from '../services/http-client';
import { authStore } from './auth.store';
import { notifyInboxActivity } from '../lib/system-notifications';

const [unreadMessages, setUnreadMessages] = createSignal(0);
const [unreadOrders, setUnreadOrders] = createSignal(0);

let pollTimer: ReturnType<typeof setInterval> | undefined;
let prevM = 0;
let prevO = 0;
let primed = false;

function onVisibility() {
  if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
    void inboxStore.refresh();
  }
}

async function syncAppBadge(total: number): Promise<void> {
  if (typeof navigator === 'undefined') return;
  try {
    if (total > 0 && 'setAppBadge' in navigator && typeof navigator.setAppBadge === 'function') {
      await navigator.setAppBadge(total);
    } else if ('clearAppBadge' in navigator && typeof navigator.clearAppBadge === 'function') {
      await navigator.clearAppBadge();
    }
  } catch {
    /* API expérimentale */
  }
}

export const inboxStore = {
  unreadMessages,
  unreadOrders,
  totalUnread: () => unreadMessages() + unreadOrders(),

  async refresh() {
    const u = authStore.currentUser();
    if (!u || (u.role !== 'buyer' && u.role !== 'producer')) {
      setUnreadMessages(0);
      setUnreadOrders(0);
      await syncAppBadge(0);
      return;
    }
    try {
      const s = await httpClient.get<{ unreadMessages: number; unreadOrders: number }>(
        '/notifications/summary',
      );
      const m = s.unreadMessages;
      const o = s.unreadOrders;

      if (primed && typeof document !== 'undefined' && document.hidden) {
        if (m > prevM) notifyInboxActivity('message');
        if (o > prevO) notifyInboxActivity('order');
      }
      prevM = m;
      prevO = o;
      primed = true;

      setUnreadMessages(m);
      setUnreadOrders(o);
      await syncAppBadge(m + o);
    } catch (err) {
      if (import.meta.env.DEV) {
        console.warn('[inboxStore] refresh failed', err);
      }
    }
  },

  start() {
    inboxStore.stop();
    void inboxStore.refresh();
    pollTimer = setInterval(() => void inboxStore.refresh(), 35_000);
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', onVisibility);
    }
  },

  stop() {
    if (pollTimer !== undefined) {
      clearInterval(pollTimer);
      pollTimer = undefined;
    }
    if (typeof document !== 'undefined') {
      document.removeEventListener('visibilitychange', onVisibility);
    }
    primed = false;
    prevM = 0;
    prevO = 0;
    setUnreadMessages(0);
    setUnreadOrders(0);
    void syncAppBadge(0);
  },
};
