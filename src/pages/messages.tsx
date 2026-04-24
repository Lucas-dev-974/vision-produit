import { For, Show, createSignal, onMount } from 'solid-js';
import { A } from '@solidjs/router';
import { authStore } from '../stores/auth.store';
import { conversationsService } from '../services/conversations.service';
import type { ApiError } from '../services/http-client';
import type { ConversationListItem } from '../entities';
import { formatIsoDate } from '../lib/formatters/date';

export function MessagesPage() {
  const [rows, setRows] = createSignal<ConversationListItem[]>([]);
  const [loading, setLoading] = createSignal(true);
  const [error, setError] = createSignal<string | null>(null);

  async function load() {
    if (
      authStore.currentUser()?.role !== 'buyer' &&
      authStore.currentUser()?.role !== 'producer'
    ) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const list = await conversationsService.listMine();
      setRows(list);
    } catch (err) {
      const api = err as ApiError;
      setError(api.message ?? 'Impossible de charger les conversations.');
    } finally {
      setLoading(false);
    }
  }

  onMount(async () => {
    if (!authStore.currentUser()) {
      await authStore.loadCurrentUser();
    }
    await load();
  });

  return (
    <div class="space-y-8">
      <header>
        <h1 class="font-display text-3xl font-semibold text-ink">Messagerie</h1>
        <p class="mt-2 max-w-2xl text-ink/75">
          Échanges 1-to-1 avec vos partenaires. Les nouveaux messages sont poussés en temps réel via une
          connexion sécurisée (ticket WebSocket à courte durée de vie).
        </p>
      </header>

      <Show when={!authStore.isLoading()} fallback={<p class="text-ink/70">Chargement…</p>}>
        <Show
          when={
            authStore.currentUser()?.role === 'buyer' ||
            authStore.currentUser()?.role === 'producer'
          }
          fallback={
            <div class="rounded-2xl border border-cream-dark bg-cream p-8 text-center shadow-sm">
              <p class="text-ink/80">La messagerie est réservée aux comptes commerçant et producteur.</p>
              <p class="mt-4">
                <A href="/app/dashboard" class="font-semibold text-moss underline underline-offset-2">
                  Tableau de bord
                </A>
              </p>
            </div>
          }
        >
          <Show when={error()}>
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
            <p class="rounded-xl border border-cream-dark bg-cream px-4 py-8 text-center text-ink/70">
              Chargement des conversations…
            </p>
          </Show>

          <Show when={!loading() && !error() && rows().length === 0}>
            <div class="rounded-2xl border border-cream-dark bg-cream p-10 text-center shadow-sm">
              <p class="text-ink/80">Aucune conversation pour le moment.</p>
              <p class="mt-2 text-sm text-ink/65">
                Ouvrez une discussion depuis une commande ou en contactant un partenaire (évolution à
                brancher sur le flux métier).
              </p>
            </div>
          </Show>

          <Show when={!loading() && rows().length > 0}>
            <ul class="divide-y divide-cream-dark rounded-2xl border border-cream-dark bg-cream shadow-sm">
              <For each={rows()}>
                {(c) => (
                  <li>
                    <A
                      href={`/app/messages/${c.id}`}
                      class="flex flex-col gap-1 px-5 py-4 transition hover:bg-cream-dark/40 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div>
                        <p class="flex flex-wrap items-center gap-2 font-display text-lg font-semibold text-ink">
                          <span>{c.peer.companyName ?? c.peer.email}</span>
                          <Show when={c.unreadCount > 0}>
                            <span class="rounded-full bg-rust px-2 py-0.5 text-xs font-bold text-cream">
                              {c.unreadCount > 99 ? '99+' : c.unreadCount}
                            </span>
                          </Show>
                        </p>
                        <p class="text-xs text-ink/55">{c.peer.email}</p>
                      </div>
                      <div class="text-right text-sm text-ink/65">
                        <p class="font-mono text-xs">{formatIsoDate(c.lastMessageAt)}</p>
                        <Show when={c.lastMessagePreview}>
                          {(prev) => (
                            <p class="mt-1 max-w-md truncate text-ink/80">{prev()}</p>
                          )}
                        </Show>
                      </div>
                    </A>
                  </li>
                )}
              </For>
            </ul>
          </Show>
        </Show>
      </Show>
    </div>
  );
}
