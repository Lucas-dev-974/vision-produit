import { For, Show, createSignal, onMount } from 'solid-js';
import { A, useNavigate, useParams } from '@solidjs/router';
import { Button } from '../components/ui/button';
import { authStore } from '../stores/auth.store';
import { publicService } from '../services/public.service';
import { orderService } from '../services/order.service';
import { conversationsService } from '../services/conversations.service';
import type { ApiError } from '../services/http-client';
import type { ProductCategory, PublicProducerDetail, PublicProducerStockRow } from '../entities';
import { formatIsoDate } from '../lib/formatters/date';

const CATEGORY_LABELS: Record<ProductCategory, string> = {
  fruits: 'Fruits',
  vegetables: 'Légumes',
  eggs: 'Œufs',
  honey: 'Miel',
  poultry: 'Volaille',
  fish: 'Poisson',
  other: 'Autre',
};

function categoryLabel(c: ProductCategory): string {
  return CATEGORY_LABELS[c] ?? c;
}

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

function addDaysIso(days: number): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

function formatMoney(amount: string): string {
  const n = parseFloat(amount);
  if (Number.isNaN(n)) return amount;
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(n);
}

function mapsUrl(lat: number, lng: number): string {
  return `https://www.google.com/maps?q=${lat},${lng}`;
}

export function ProducerProfilePage() {
  const params = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [profile, setProfile] = createSignal<PublicProducerDetail | null>(null);
  const [loadError, setLoadError] = createSignal<string | null>(null);
  const [loading, setLoading] = createSignal(true);

  const [cart, setCart] = createSignal<Record<string, number>>({});
  const [retrievalDate, setRetrievalDate] = createSignal(addDaysIso(2));
  const [timeSlot, setTimeSlot] = createSignal('');
  const [note, setNote] = createSignal('');
  const [orderError, setOrderError] = createSignal<string | null>(null);
  const [orderSubmitting, setOrderSubmitting] = createSignal(false);
  const [msgOpening, setMsgOpening] = createSignal(false);

  const isBuyer = () => authStore.currentUser()?.role === 'buyer';
  const isOwnProfile = () => authStore.currentUser()?.id === params.id;

  function maxQty(row: PublicProducerStockRow): number {
    const n = parseFloat(row.quantityAvailable);
    return Number.isNaN(n) ? 0 : n;
  }

  function setLineQty(stockId: string, raw: string, row: PublicProducerStockRow) {
    const max = maxQty(row);
    const n = parseFloat(raw.replace(',', '.'));
    setCart((prev) => {
      const next = { ...prev };
      if (Number.isNaN(n) || n <= 0) {
        delete next[stockId];
      } else {
        next[stockId] = Math.min(max, Math.max(n, 0));
      }
      return next;
    });
  }

  function lineQty(stockId: string): string {
    const q = cart()[stockId];
    return q != null && q > 0 ? String(q) : '';
  }

  async function load() {
    setLoading(true);
    setLoadError(null);
    try {
      const p = await publicService.getProducerDetail(params.id);
      setProfile(p);
    } catch (err) {
      const api = err as ApiError;
      setLoadError(api.message ?? 'Producteur introuvable.');
      setProfile(null);
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

  async function submitOrder(e: Event) {
    e.preventDefault();
    const p = profile();
    if (!p || !isBuyer()) return;

    const items = Object.entries(cart())
      .filter(([, q]) => q > 0)
      .map(([stockId, quantity]) => ({ stockId, quantity }));

    if (items.length === 0) {
      setOrderError('Ajoutez au moins une quantité sur un stock disponible.');
      return;
    }

    setOrderError(null);
    setOrderSubmitting(true);
    try {
      const order = await orderService.create({
        producerId: p.id,
        retrievalDate: retrievalDate(),
        retrievalTimeSlot: timeSlot().trim() || null,
        note: note().trim() || null,
        items,
      });
      navigate(`/app/orders/${order.id}`);
    } catch (err) {
      const api = err as ApiError;
      setOrderError(api.message ?? 'Précommande impossible.');
    } finally {
      setOrderSubmitting(false);
    }
  }

  async function openMessages() {
    const p = profile();
    if (!p || !isBuyer()) return;
    setMsgOpening(true);
    setOrderError(null);
    try {
      const c = await conversationsService.create({ producerId: p.id });
      navigate(`/app/messages/${c.id}`);
    } catch (err) {
      const api = err as ApiError;
      setOrderError(api.message ?? 'Impossible d’ouvrir la messagerie.');
    } finally {
      setMsgOpening(false);
    }
  }

  const inputClass =
    'mt-1 w-full rounded-lg border border-cream-dark bg-cream px-3 py-2 text-sm text-ink shadow-sm focus:border-moss focus:outline-none focus:ring-1 focus:ring-moss';

  return (
    <div class="space-y-8">
      <div class="flex flex-wrap items-center gap-3">
        <A
          href="/app/search"
          class="text-sm font-semibold text-moss underline underline-offset-2 hover:text-moss-light"
        >
          ← Recherche
        </A>
      </div>

      <Show when={loading()}>
        <p class="text-ink/70">Chargement du profil…</p>
      </Show>

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

      <Show when={!loading() && profile()}>
        {(p) => (
          <>
            <header class="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-start">
              <div>
                <h1 class="font-display text-3xl font-semibold text-ink">
                  {p().companyName ?? 'Producteur'}
                </h1>
                <p class="mt-1 text-sm text-ink/65">
                  {[p().city, p().postalCode].filter(Boolean).join(' · ') || 'La Réunion'}
                </p>
                <p class="mt-4 font-mono text-sm text-ink/70">
                  ★ {p().averageRating.toFixed(1)} ({p().totalRatings} avis) · fiabilité{' '}
                  {p().reliabilityScore.toFixed(0)}% · {p().totalOrders} commande
                  {p().totalOrders > 1 ? 's' : ''}
                </p>
                <Show when={p().publicLocation}>
                  {(loc) => (
                    <p class="mt-3">
                      <a
                        href={mapsUrl(loc().lat, loc().lng)}
                        target="_blank"
                        rel="noopener noreferrer"
                        class="text-sm font-semibold text-moss underline underline-offset-2"
                      >
                        Voir la zone approximative sur la carte
                      </a>
                      <span class="ml-2 text-xs text-ink/50">(±500 m)</span>
                    </p>
                  )}
                </Show>
              </div>
              <div class="flex flex-wrap gap-2">
                <Show when={isBuyer() && !isOwnProfile()}>
                  <Button
                    type="button"
                    variant="secondary"
                    disabled={msgOpening()}
                    onClick={() => void openMessages()}
                  >
                    {msgOpening() ? 'Ouverture…' : 'Message'}
                  </Button>
                </Show>
                <Show when={!isBuyer()}>
                  <p class="max-w-xs text-sm text-ink/70">
                    <A href="/login" class="font-semibold text-moss underline underline-offset-2">
                      Connectez-vous en tant que commerçant
                    </A>{' '}
                    pour précommander ou écrire au producteur.
                  </p>
                </Show>
              </div>
            </header>

            <Show when={isOwnProfile()}>
              <p class="rounded-xl border border-ochre/40 bg-ochre/10 px-4 py-3 text-sm text-ink/85">
                C’est votre vitrine publique. Gérez catalogue et stocks depuis{' '}
                <A href="/app/catalog" class="font-semibold text-moss underline underline-offset-2">
                  Catalogue
                </A>
                .
              </p>
            </Show>

            <Show when={p().profilePhotoUrl || (p().additionalPhotos && p().additionalPhotos.length > 0)}>
              <section class="space-y-3">
                <h2 class="font-mono text-xs uppercase tracking-wide text-moss">Photos</h2>
                <div class="flex flex-wrap gap-3">
                  <Show when={p().profilePhotoUrl}>
                    {(url) => (
                      <img
                        src={url()}
                        alt=""
                        class="h-40 w-40 rounded-2xl border border-cream-dark object-cover"
                      />
                    )}
                  </Show>
                  <For each={p().additionalPhotos}>
                    {(url) => (
                      <img
                        src={url}
                        alt=""
                        class="h-40 w-40 rounded-2xl border border-cream-dark object-cover"
                      />
                    )}
                  </For>
                </div>
              </section>
            </Show>

            <section class="rounded-2xl border border-cream-dark bg-cream p-6 shadow-sm">
              <h2 class="font-display text-xl font-semibold text-ink">Présentation</h2>
              <p class="mt-3 whitespace-pre-wrap text-ink/85">{p().description ?? '—'}</p>
            </section>

            <section class="space-y-4">
              <h2 class="font-mono text-xs uppercase tracking-wide text-moss">Référentiel produits</h2>
              <Show when={p().products.length === 0}>
                <p class="text-sm text-ink/65">Aucun produit référencé pour l’instant.</p>
              </Show>
              <ul class="grid gap-3 sm:grid-cols-2">
                <For each={p().products}>
                  {(prod) => (
                    <li class="rounded-xl border border-cream-dark bg-cream-dark/20 px-4 py-3">
                      <p class="font-medium text-ink">{prod.name}</p>
                      <p class="text-xs text-moss">{categoryLabel(prod.category)}</p>
                      <p class="mt-2 text-sm text-ink/75">{prod.description}</p>
                    </li>
                  )}
                </For>
              </ul>
            </section>

            <section class="space-y-4">
              <h2 class="font-mono text-xs uppercase tracking-wide text-moss">Stocks disponibles</h2>
              <Show when={p().stocks.length === 0}>
                <p class="text-sm text-ink/65">Aucun lot en vente pour le moment.</p>
              </Show>
              <Show when={p().stocks.length > 0}>
                <div class="overflow-x-auto rounded-xl border border-cream-dark">
                  <table class="min-w-full divide-y divide-cream-dark text-left text-sm">
                    <thead class="bg-cream-dark/40 font-mono text-xs uppercase text-ink/60">
                      <tr>
                        <th class="px-4 py-3">Produit</th>
                        <th class="px-4 py-3">Prix</th>
                        <th class="px-4 py-3">Dispo</th>
                        <th class="px-4 py-3">Fin validité</th>
                        <Show when={isBuyer() && !isOwnProfile()}>
                          <th class="px-4 py-3">Qté précommande</th>
                        </Show>
                      </tr>
                    </thead>
                    <tbody class="divide-y divide-cream-dark bg-cream">
                      <For each={p().stocks}>
                        {(row) => (
                          <tr>
                            <td class="px-4 py-3">
                              <p class="font-medium text-ink">{row.productName}</p>
                              <p class="text-xs text-ink/55">{categoryLabel(row.category)}</p>
                            </td>
                            <td class="px-4 py-3 whitespace-nowrap">
                              {formatMoney(row.unitPrice)} / {row.unit}
                            </td>
                            <td class="px-4 py-3 text-ink/75">{row.quantityAvailable}</td>
                            <td class="px-4 py-3 text-ink/75">{formatIsoDate(row.expiresAt)}</td>
                            <Show when={isBuyer() && !isOwnProfile()}>
                              <td class="px-4 py-3">
                                <input
                                  type="number"
                                  min={0}
                                  max={maxQty(row)}
                                  step="0.01"
                                  placeholder="0"
                                  class="w-28 rounded-lg border border-cream-dark bg-cream px-2 py-1.5 text-sm tabular-nums"
                                  value={lineQty(row.stockId)}
                                  onInput={(e) =>
                                    setLineQty(row.stockId, e.currentTarget.value, row)
                                  }
                                />
                              </td>
                            </Show>
                          </tr>
                        )}
                      </For>
                    </tbody>
                  </table>
                </div>
              </Show>
            </section>

            <Show when={isBuyer() && !isOwnProfile() && p().stocks.length > 0}>
              <form
                onSubmit={submitOrder}
                class="space-y-4 rounded-2xl border border-moss/25 bg-moss/5 p-6"
              >
                <h2 class="font-display text-xl font-semibold text-ink">Passer une précommande</h2>
                <p class="text-sm text-ink/70">
                  Indiquez les quantités ci-dessus, puis la date de retrait souhaitée. Le producteur
                  confirmera ou proposera une alternative.
                </p>
                <div class="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label class="block text-xs font-medium text-ink/80" for="pp-retrieval">
                      Date de retrait
                    </label>
                    <input
                      id="pp-retrieval"
                      type="date"
                      class={inputClass}
                      min={todayIso()}
                      value={retrievalDate()}
                      onInput={(e) => setRetrievalDate(e.currentTarget.value)}
                      required
                    />
                  </div>
                  <div>
                    <label class="block text-xs font-medium text-ink/80" for="pp-slot">
                      Créneau (optionnel)
                    </label>
                    <input
                      id="pp-slot"
                      type="text"
                      class={inputClass}
                      placeholder="ex. 9h–12h"
                      value={timeSlot()}
                      onInput={(e) => setTimeSlot(e.currentTarget.value)}
                    />
                  </div>
                </div>
                <div>
                  <label class="block text-xs font-medium text-ink/80" for="pp-note">
                    Note (optionnel)
                  </label>
                  <textarea
                    id="pp-note"
                    class={`${inputClass} min-h-[80px]`}
                    maxlength={2000}
                    value={note()}
                    onInput={(e) => setNote(e.currentTarget.value)}
                  />
                </div>
                <Show when={orderError()}>
                  {(msg) => (
                    <p class="text-sm text-rust" role="alert">
                      {msg()}
                    </p>
                  )}
                </Show>
                <Button type="submit" disabled={orderSubmitting()}>
                  {orderSubmitting() ? 'Envoi…' : 'Envoyer la précommande'}
                </Button>
              </form>
            </Show>
          </>
        )}
      </Show>
    </div>
  );
}
