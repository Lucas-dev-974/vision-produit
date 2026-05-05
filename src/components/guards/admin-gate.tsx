import { Navigate } from '@solidjs/router';
import { Show, createSignal, onMount, type JSX } from 'solid-js';
import { authStore } from '../../stores/auth.store';

/**
 * Wrap les pages `/admin/*` :
 * 1. Charge l'utilisateur courant.
 * 2. Si non connecté → redirection vers `/login`.
 * 3. Si connecté mais rôle ≠ admin → redirection vers `/`.
 */
export function AdminGate(props: { children: JSX.Element }) {
  const [ready, setReady] = createSignal(false);

  onMount(() => {
    void authStore.loadCurrentUser().finally(() => setReady(true));
  });

  return (
    <Show
      when={ready()}
      fallback={
        <div class="flex min-h-screen items-center justify-center bg-ink text-cream/70">
          <p class="text-sm">Chargement…</p>
        </div>
      }
    >
      <Show when={authStore.currentUser()} fallback={<Navigate href="/login" />}>
        {(user) => (
          <Show when={user().role === 'admin'} fallback={<Navigate href="/" />}>
            {props.children}
          </Show>
        )}
      </Show>
    </Show>
  );
}
