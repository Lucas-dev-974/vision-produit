import { For, Show, createMemo, createSignal, onMount } from 'solid-js';
import { A } from '@solidjs/router';
import { authStore } from '../stores/auth.store';
import { productService } from '../services/product.service';
import { stockService } from '../services/stock.service';
import { orderService } from '../services/order.service';
import { isApiErrorShape } from '../lib/errors';
import {
  ORDER_STATUS_LABEL,
  formatOrderRetrievalDate,
  orderStatusBadgeClass,
} from '../lib/order-ui';
import type { OrderListRow } from '../entities';

function mapApiError(err: unknown): string {
  if (isApiErrorShape(err)) return err.message;
  return 'Impossible de charger les données.';
}

export function Dashboard() {
  const [loadError, setLoadError] = createSignal<string | null>(null);
  const [statsLoading, setStatsLoading] = createSignal(true);
  const [productCount, setProductCount] = createSignal<number | null>(null);
  const [stockCount, setStockCount] = createSignal<number | null>(null);
  const [recentOrders, setRecentOrders] = createSignal<OrderListRow[]>([]);
  const [ordersTotal, setOrdersTotal] = createSignal(0);

  const pendingCount = createMemo(
    () => recentOrders().filter((o) => o.status === 'pending').length,
  );

  onMount(async () => {
    if (!authStore.currentUser()) {
      await authStore.loadCurrentUser();
    }
    const u = authStore.currentUser();
    if (!u) {
      setStatsLoading(false);
      return;
    }

    setStatsLoading(true);
    setLoadError(null);
    try {
      if (u.role === 'producer') {
        const [products, stocks, ordersPage] = await Promise.all([
          productService.listMine(),
          stockService.listMine(),
          orderService.listMine(1, 50),
        ]);
        setProductCount(products.length);
        setStockCount(stocks.length);
        setRecentOrders(ordersPage.items.slice(0, 8));
        setOrdersTotal(ordersPage.pagination.total);
      } else if (u.role === 'buyer') {
        const ordersPage = await orderService.listMine(1, 50);
        setRecentOrders(ordersPage.items.slice(0, 8));
        setOrdersTotal(ordersPage.pagination.total);
      }
    } catch (err) {
      setLoadError(mapApiError(err));
    } finally {
      setStatsLoading(false);
    }
  });

  return (
    <div class="space-y-10">
      <header class="space-y-2">
        <h1 class="font-display text-3xl font-semibold text-ink">Tableau de bord</h1>
        <Show when={!authStore.isLoading() && authStore.currentUser()}>
          {(u) => (
            <p class="max-w-2xl text-ink/75">
              Bienvenue,{' '}
              <span class="font-medium text-ink">{u().companyName ?? u().email}</span>.
              {u().role === 'producer'
                ? ' Gérez votre catalogue, vos stocks et suivez les précommandes.'
                : u().role === 'buyer'
                  ? ' Recherchez des producteurs et suivez vos commandes.'
                  : ' Accès application.'}
            </p>
          )}
        </Show>
      </header>

      <Show
        when={!authStore.isLoading()}
        fallback={<p class="text-ink/70">Chargement du profil…</p>}
      >
        <Show
          when={authStore.currentUser()}
          fallback={
            <div class="rounded-2xl border border-cream-dark bg-cream p-6 shadow-sm">
              <p class="text-ink/80">Session non disponible.</p>
              <p class="mt-2 text-sm text-ink/60">
                <A href="/login" class="font-medium text-moss underline underline-offset-2">
                  Se connecter
                </A>
              </p>
            </div>
          }
        >
          {(u) => (
            <>
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

              <section aria-labelledby="quick-actions-heading" class="space-y-4">
                <h2 id="quick-actions-heading" class="font-display text-xl font-semibold text-ink">
                  Accès rapides
                </h2>
                <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  <Show when={u().role === 'producer'}>
                    <A
                      href="/app/catalog"
                      class="group rounded-2xl border border-cream-dark bg-cream p-5 shadow-sm transition hover:border-moss/40 hover:shadow-md"
                    >
                      <p class="font-mono text-xs uppercase tracking-wide text-moss">Catalogue</p>
                      <p class="mt-2 font-display text-lg text-ink group-hover:text-moss">
                        Produits &amp; stocks
                      </p>
                      <p class="mt-1 text-sm text-ink/65">
                        Fiches produit, quantités (+/−), prix et dates de vente.
                      </p>
                    </A>
                  </Show>
                  <Show when={u().role === 'buyer'}>
                    <A
                      href="/app/search"
                      class="group rounded-2xl border border-cream-dark bg-cream p-5 shadow-sm transition hover:border-moss/40 hover:shadow-md"
                    >
                      <p class="font-mono text-xs uppercase tracking-wide text-moss">Découverte</p>
                      <p class="mt-2 font-display text-lg text-ink group-hover:text-moss">Recherche</p>
                      <p class="mt-1 text-sm text-ink/65">
                        Producteurs et produits près de vous.
                      </p>
                    </A>
                  </Show>
                  <A
                    href="/app/orders"
                    class="group rounded-2xl border border-cream-dark bg-cream p-5 shadow-sm transition hover:border-moss/40 hover:shadow-md"
                  >
                    <p class="font-mono text-xs uppercase tracking-wide text-moss">Activité</p>
                    <p class="mt-2 font-display text-lg text-ink group-hover:text-moss">Commandes</p>
                    <p class="mt-1 text-sm text-ink/65">
                      Précommandes, statuts et retraits.
                    </p>
                  </A>
                  <A
                    href="/app/compte"
                    class="group rounded-2xl border border-cream-dark bg-cream p-5 shadow-sm transition hover:border-moss/40 hover:shadow-md"
                  >
                    <p class="font-mono text-xs uppercase tracking-wide text-moss">Identité</p>
                    <p class="mt-2 font-display text-lg text-ink group-hover:text-moss">Compte</p>
                    <p class="mt-1 text-sm text-ink/65">Profil, coordonnées et export RGPD.</p>
                  </A>
                </div>
              </section>

              <Show when={u().role === 'producer' || u().role === 'buyer'}>
                <section aria-labelledby="stats-heading" class="space-y-4">
                  <h2 id="stats-heading" class="font-display text-xl font-semibold text-ink">
                    En bref
                  </h2>
                  <Show
                    when={!statsLoading()}
                    fallback={
                      <p class="text-sm text-ink/60">Chargement des indicateurs…</p>
                    }
                  >
                    <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                      <Show when={u().role === 'producer'}>
                        <>
                          <div class="rounded-2xl border border-cream-dark bg-white/60 p-5 shadow-sm">
                            <p class="font-mono text-xs uppercase text-ink/50">Produits</p>
                            <p class="mt-2 font-display text-3xl tabular-nums text-ink">
                              {productCount() ?? '—'}
                            </p>
                            <p class="mt-1 text-sm text-ink/60">Référencés dans votre catalogue</p>
                          </div>
                          <div class="rounded-2xl border border-cream-dark bg-white/60 p-5 shadow-sm">
                            <p class="font-mono text-xs uppercase text-ink/50">Lignes de stock</p>
                            <p class="mt-2 font-display text-3xl tabular-nums text-ink">
                              {stockCount() ?? '—'}
                            </p>
                            <p class="mt-1 text-sm text-ink/60">Lots actifs ou à venir</p>
                          </div>
                        </>
                      </Show>
                      <div class="rounded-2xl border border-cream-dark bg-white/60 p-5 shadow-sm">
                        <p class="font-mono text-xs uppercase text-ink/50">Commandes (total)</p>
                        <p class="mt-2 font-display text-3xl tabular-nums text-ink">
                          {ordersTotal()}
                        </p>
                        <p class="mt-1 text-sm text-ink/60">Toutes périodes confondues</p>
                      </div>
                      <div class="rounded-2xl border border-cream-dark bg-white/60 p-5 shadow-sm">
                        <p class="font-mono text-xs uppercase text-ink/50">À traiter</p>
                        <p class="mt-2 font-display text-3xl tabular-nums text-ochre">
                          {u().role === 'producer' || u().role === 'buyer' ? pendingCount() : '—'}
                        </p>
                        <p class="mt-1 text-sm text-ink/60">
                          {u().role === 'producer'
                            ? 'Précommandes en attente (aperçu 50 dernières)'
                            : 'En attente côté producteur (aperçu 50 dernières)'}
                        </p>
                      </div>
                    </div>
                  </Show>
                </section>
              </Show>

              <Show when={u().role === 'admin'}>
                <div class="rounded-2xl border border-cream-dark bg-cream p-6 shadow-sm">
                  <p class="font-mono text-xs uppercase text-moss">Administration</p>
                  <p class="mt-2 text-ink/80">
                    Ce compte est un compte administrateur. Les statistiques commerçant / producteur
                    ne s’appliquent pas ici.
                  </p>
                  <p class="mt-4">
                    <A
                      href="/admin"
                      class="font-semibold text-moss underline underline-offset-2 hover:text-moss-light"
                    >
                      Ouvrir le panneau admin
                    </A>
                  </p>
                </div>
              </Show>

              <Show when={u().role === 'producer' || u().role === 'buyer'}>
              <section aria-labelledby="recent-orders-heading" class="space-y-4">
                <div class="flex flex-wrap items-end justify-between gap-3">
                  <h2 id="recent-orders-heading" class="font-display text-xl font-semibold text-ink">
                    Commandes récentes
                  </h2>
                  <A
                    href="/app/orders"
                    class="text-sm font-semibold text-moss hover:underline underline-offset-2"
                  >
                    Voir tout
                  </A>
                </div>

                <Show
                  when={!statsLoading()}
                  fallback={<p class="text-sm text-ink/60">Chargement…</p>}
                >
                  <Show
                    when={recentOrders().length > 0}
                    fallback={
                      <div class="rounded-2xl border border-dashed border-cream-dark bg-cream/50 px-6 py-10 text-center text-ink/65">
                        <p>Aucune commande pour l’instant.</p>
                        <Show when={u().role === 'buyer'}>
                          <p class="mt-2 text-sm">
                            <A href="/app/search" class="font-medium text-moss underline underline-offset-2">
                              Parcourir les producteurs
                            </A>
                          </p>
                        </Show>
                        <Show when={u().role === 'producer'}>
                          <p class="mt-2 text-sm">
                            Les précommandes apparaîtront ici dès qu’un commerçant commandera.
                          </p>
                        </Show>
                      </div>
                    }
                  >
                    <div class="overflow-hidden rounded-2xl border border-cream-dark bg-cream shadow-sm">
                      <table class="w-full text-left text-sm">
                        <thead class="border-b border-cream-dark bg-cream-dark/40 font-mono text-xs uppercase tracking-wide text-ink/55">
                          <tr>
                            <th class="px-4 py-3 font-semibold">Retrait</th>
                            <th class="px-4 py-3 font-semibold">
                              {u().role === 'producer' ? 'Commerçant' : 'Producteur'}
                            </th>
                            <th class="px-4 py-3 font-semibold">Statut</th>
                            <th class="px-4 py-3 font-semibold text-right">Lignes</th>
                            <th class="px-4 py-3 font-semibold text-right"> </th>
                          </tr>
                        </thead>
                        <tbody class="divide-y divide-cream-dark bg-white/40">
                          <For each={recentOrders()}>
                            {(row) => (
                              <tr class="text-ink/90">
                                <td class="px-4 py-3 tabular-nums">
                                  {formatOrderRetrievalDate(row.retrievalDate)}
                                </td>
                                <td class="px-4 py-3">
                                  {row.counterpartyCompanyName ?? '—'}
                                </td>
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
                                    class="font-medium text-moss hover:underline underline-offset-2"
                                  >
                                    Détail
                                  </A>
                                </td>
                              </tr>
                            )}
                          </For>
                        </tbody>
                      </table>
                    </div>
                  </Show>
                </Show>
              </section>
              </Show>

              <div class="rounded-2xl border border-cream-dark bg-cream-dark/30 p-5 text-sm text-ink/70">
                <p class="font-mono text-xs uppercase text-ink/45">Session</p>
                <p class="mt-2">
                  <span class="text-ink/80">{u().email}</span>
                  {' · '}
                  rôle <span class="font-medium text-ink">{u().role}</span>
                  {' · '}
                  statut <span class="font-medium text-ink">{u().status}</span>
                </p>
              </div>
            </>
          )}
        </Show>
      </Show>
    </div>
  );
}
