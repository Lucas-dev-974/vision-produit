import { For, Show, createSignal, onMount } from 'solid-js';
import { A } from '@solidjs/router';
import { authStore } from '../stores/auth.store';
import { orderService } from '../services/order.service';
import type { ApiError } from '../services/http-client';
import {
  ORDER_STATUS_LABEL,
  formatOrderRetrievalDate,
  orderStatusBadgeClass,
} from '../lib/order-ui';
import type { OrderListRow } from '../entities';

export function OrdersPage() {
  const [rows, setRows] = createSignal<OrderListRow[]>([]);
  const [page, setPage] = createSignal(1);
  const [pageSize] = createSignal(15);
  const [total, setTotal] = createSignal(0);
  const [loading, setLoading] = createSignal(true);
  const [error, setError] = createSignal<string | null>(null);

  async function load(p: number) {
    if (authStore.currentUser()?.role !== 'buyer' && authStore.currentUser()?.role !== 'producer') {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await orderService.listMine(p, pageSize());
      setRows(res.items);
      setTotal(res.pagination.total);
      setPage(res.pagination.page);
    } catch (err) {
      const api = err as ApiError;
      setError(api.message ?? 'Impossible de charger les commandes.');
    } finally {
      setLoading(false);
    }
  }

  onMount(async () => {
    if (!authStore.currentUser()) {
      await authStore.loadCurrentUser();
    }
    await load(1);
  });

  const totalPages = () => Math.max(1, Math.ceil(total() / pageSize()));

  return (
    <div class="space-y-8">
      <header>
        <h1 class="font-display text-3xl font-semibold text-ink">Commandes</h1>
        <p class="mt-2 max-w-2xl text-ink/75">
          Précommandes en cours avec les producteurs ou les commerçants. Ouvrez une ligne pour voir le
          détail et agir selon votre rôle.
        </p>
      </header>

      <Show when={!authStore.isLoading()} fallback={<p class="text-ink/70">Chargement…</p>}>
        <Show
          when={authStore.currentUser()?.role === 'buyer' || authStore.currentUser()?.role === 'producer'}
          fallback={
            <div class="rounded-2xl border border-cream-dark bg-cream p-8 text-center shadow-sm">
              <p class="text-ink/80">Connectez-vous avec un compte commerçant ou producteur.</p>
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

          <Show when={!loading()} fallback={<p class="text-ink/70">Chargement des commandes…</p>}>
            <Show
              when={rows().length > 0}
              fallback={
                <div class="rounded-2xl border border-dashed border-cream-dark bg-cream/50 px-6 py-14 text-center text-ink/70">
                  Aucune commande pour l’instant.
                </div>
              }
            >
              <div class="overflow-hidden rounded-2xl border border-cream-dark bg-cream shadow-sm">
                <table class="w-full text-left text-sm">
                  <thead class="border-b border-cream-dark bg-cream-dark/40 font-mono text-xs uppercase tracking-wide text-ink/55">
                    <tr>
                      <th class="px-4 py-3 font-semibold">Retrait</th>
                      <th class="px-4 py-3 font-semibold">
                        {authStore.currentUser()?.role === 'producer' ? 'Commerçant' : 'Producteur'}
                      </th>
                      <th class="px-4 py-3 font-semibold">Statut</th>
                      <th class="px-4 py-3 font-semibold text-right">Lignes</th>
                      <th class="px-4 py-3 font-semibold text-right"> </th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-cream-dark bg-white/40">
                    <For each={rows()}>
                      {(row) => (
                        <tr
                          class={`text-ink/90 ${row.unread ? 'bg-moss/5' : ''}`}
                        >
                          <td class="px-4 py-3 tabular-nums">
                            {formatOrderRetrievalDate(row.retrievalDate)}
                            <Show when={row.retrievalTimeSlot}>
                              {(slot) => (
                                <span class="mt-0.5 block text-xs text-ink/55">{slot()}</span>
                              )}
                            </Show>
                          </td>
                          <td class="px-4 py-3">{row.counterpartyCompanyName ?? '—'}</td>
                          <td class="px-4 py-3">
                            <span class={orderStatusBadgeClass(row.status)}>
                              {ORDER_STATUS_LABEL[row.status]}
                            </span>
                          </td>
                          <td class="px-4 py-3 text-right tabular-nums text-ink/70">
                            {row.itemsCount}
                          </td>
                          <td class="px-4 py-3 text-right">
                            <A
                              href={`/app/orders/${row.id}`}
                              class="inline-flex items-center gap-2 font-semibold text-moss hover:underline underline-offset-2"
                            >
                              Détail
                              <Show when={row.unread}>
                                <span
                                  class="inline-block h-2 w-2 rounded-full bg-rust"
                                  aria-label="Non lu"
                                />
                              </Show>
                            </A>
                          </td>
                        </tr>
                      )}
                    </For>
                  </tbody>
                </table>
              </div>

              <Show when={totalPages() > 1}>
                <div class="flex flex-wrap items-center justify-between gap-3 text-sm">
                  <p class="text-ink/65">
                    Page {page()} / {totalPages()} · {total()} commande(s)
                  </p>
                  <div class="flex gap-2">
                    <button
                      type="button"
                      class="rounded-lg border border-cream-dark bg-cream px-3 py-2 font-medium text-ink hover:bg-cream-dark/50 disabled:opacity-40"
                      disabled={page() <= 1}
                      onClick={() => void load(page() - 1)}
                    >
                      Précédent
                    </button>
                    <button
                      type="button"
                      class="rounded-lg border border-cream-dark bg-cream px-3 py-2 font-medium text-ink hover:bg-cream-dark/50 disabled:opacity-40"
                      disabled={page() >= totalPages()}
                      onClick={() => void load(page() + 1)}
                    >
                      Suivant
                    </button>
                  </div>
                </div>
              </Show>
            </Show>
          </Show>
        </Show>
      </Show>
    </div>
  );
}
