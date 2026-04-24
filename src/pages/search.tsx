import { For, Show, createSignal, onMount } from 'solid-js';
import { A } from '@solidjs/router';
import { Button } from '../components/ui/button';
import { authStore } from '../stores/auth.store';
import { searchService } from '../services/search.service';
import type { ApiError } from '../services/http-client';
import type { ProductCategory, SearchProducerHit, SearchProductHit } from '../entities';
import type { ProducerSort } from '../entities/search';
import { formatIsoDate } from '../lib/formatters/date';

const DEFAULT_LAT = -21.115_141; // centre approximatif La Réunion
const DEFAULT_LNG = 55.536_384;

const CATEGORY_OPTIONS: { value: ProductCategory; label: string }[] = [
  { value: 'fruits', label: 'Fruits' },
  { value: 'vegetables', label: 'Légumes' },
  { value: 'eggs', label: 'Œufs' },
  { value: 'honey', label: 'Miel' },
  { value: 'poultry', label: 'Volaille' },
  { value: 'fish', label: 'Poisson' },
  { value: 'other', label: 'Autre' },
];

const RADIUS_OPTIONS = [10, 25, 50, 100, 200] as const;

function categoryLabel(c: ProductCategory): string {
  return CATEGORY_OPTIONS.find((o) => o.value === c)?.label ?? c;
}

function formatMoney(amount: string): string {
  const n = parseFloat(amount);
  if (Number.isNaN(n)) return amount;
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(n);
}

function formatDistance(km: number): string {
  if (km < 1) return `${Math.round(km * 1000)} m`;
  return `${km.toFixed(1)} km`;
}

type Tab = 'producers' | 'products';

export function SearchPage() {
  const [tab, setTab] = createSignal<Tab>('producers');

  const [lat, setLat] = createSignal(String(DEFAULT_LAT));
  const [lng, setLng] = createSignal(String(DEFAULT_LNG));
  const [radius, setRadius] = createSignal(50);
  const [category, setCategory] = createSignal<ProductCategory | ''>('');
  const [producerQ, setProducerQ] = createSignal('');
  const [sort, setSort] = createSignal<ProducerSort>('distance');
  const [producerPage, setProducerPage] = createSignal(1);
  const [producerRows, setProducerRows] = createSignal<SearchProducerHit[]>([]);
  const [producerTotal, setProducerTotal] = createSignal(0);
  const [producerLoading, setProducerLoading] = createSignal(false);
  const [producerError, setProducerError] = createSignal<string | null>(null);
  const [geoPending, setGeoPending] = createSignal(false);

  const [productQ, setProductQ] = createSignal('');
  const [productPage, setProductPage] = createSignal(1);
  const [productRows, setProductRows] = createSignal<SearchProductHit[]>([]);
  const [productTotal, setProductTotal] = createSignal(0);
  const [productLoading, setProductLoading] = createSignal(false);
  const [productError, setProductError] = createSignal<string | null>(null);

  const pageSize = 20;

  function applyAccountLocation() {
    const u = authStore.currentUser();
    if (u?.locationLat != null && u?.locationLng != null) {
      setLat(String(u.locationLat));
      setLng(String(u.locationLng));
    }
  }

  async function loadProducers(page: number) {
    setProducerLoading(true);
    setProducerError(null);
    const la = parseFloat(lat().replace(',', '.'));
    const ln = parseFloat(lng().replace(',', '.'));
    if (Number.isNaN(la) || Number.isNaN(ln)) {
      setProducerError('Latitude et longitude invalides.');
      setProducerLoading(false);
      return;
    }
    try {
      const res = await searchService.searchProducers({
        lat: la,
        lng: ln,
        radius: radius(),
        category: category() || undefined,
        q: producerQ().trim() || undefined,
        sort: sort(),
        page,
        pageSize,
      });
      setProducerRows(res.items);
      setProducerTotal(res.pagination.total);
      setProducerPage(res.pagination.page);
    } catch (err) {
      const api = err as ApiError;
      setProducerError(api.message ?? 'Recherche impossible.');
      setProducerRows([]);
      setProducerTotal(0);
    } finally {
      setProducerLoading(false);
    }
  }

  async function loadProducts(page: number) {
    const q = productQ().trim();
    if (q.length < 1) {
      setProductError('Saisissez au moins un mot-clé.');
      return;
    }
    setProductLoading(true);
    setProductError(null);
    try {
      const res = await searchService.searchProducts(q, page, pageSize);
      setProductRows(res.items);
      setProductTotal(res.pagination.total);
      setProductPage(res.pagination.page);
    } catch (err) {
      const api = err as ApiError;
      setProductError(api.message ?? 'Recherche impossible.');
      setProductRows([]);
      setProductTotal(0);
    } finally {
      setProductLoading(false);
    }
  }

  function useGeolocation() {
    if (!navigator.geolocation) {
      setProducerError('Géolocalisation non disponible dans ce navigateur.');
      return;
    }
    setGeoPending(true);
    setProducerError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLat(String(pos.coords.latitude));
        setLng(String(pos.coords.longitude));
        setGeoPending(false);
        void loadProducers(1);
      },
      () => {
        setGeoPending(false);
        setProducerError('Impossible d’obtenir votre position (permission refusée ou erreur).');
      },
      { enableHighAccuracy: true, timeout: 12_000 },
    );
  }

  onMount(async () => {
    if (!authStore.currentUser()) {
      await authStore.loadCurrentUser();
    }
    applyAccountLocation();
    if (authStore.currentUser()?.role === 'buyer') {
      void loadProducers(1);
    }
  });

  const producerTotalPages = () => Math.max(1, Math.ceil(producerTotal() / pageSize));
  const productTotalPages = () => Math.max(1, Math.ceil(productTotal() / pageSize));

  const inputClass =
    'mt-1 w-full rounded-lg border border-cream-dark bg-cream px-3 py-2 text-sm text-ink shadow-sm focus:border-moss focus:outline-none focus:ring-1 focus:ring-moss';

  return (
    <div class="space-y-8">
      <header>
        <h1 class="font-display text-3xl font-semibold text-ink">Recherche producteurs</h1>
        <p class="mt-2 max-w-2xl text-ink/75">
          Trouvez des producteurs locaux autour d’un point (carte approximative ±500 m côté producteur) ou
          parcourez les stocks disponibles par mot-clé.
        </p>
      </header>

      <Show when={!authStore.isLoading()} fallback={<p class="text-ink/70">Chargement…</p>}>
        <Show
          when={authStore.currentUser()?.role === 'buyer'}
          fallback={
            <div class="rounded-2xl border border-cream-dark bg-cream p-8 text-center shadow-sm">
              <p class="text-ink/80">La recherche géographique et catalogue est réservée aux comptes commerçant.</p>
              <p class="mt-4">
                <A href="/login" class="font-semibold text-moss underline underline-offset-2">
                  Connexion
                </A>
              </p>
            </div>
          }
        >
          <div class="flex flex-wrap gap-2 border-b border-cream-dark pb-1">
            <button
              type="button"
              class={`rounded-t-lg px-4 py-2 text-sm font-semibold transition ${
                tab() === 'producers'
                  ? 'bg-moss text-cream'
                  : 'text-ink/70 hover:bg-cream-dark/50'
              }`}
              onClick={() => setTab('producers')}
            >
              Carte &amp; distance
            </button>
            <button
              type="button"
              class={`rounded-t-lg px-4 py-2 text-sm font-semibold transition ${
                tab() === 'products'
                  ? 'bg-moss text-cream'
                  : 'text-ink/70 hover:bg-cream-dark/50'
              }`}
              onClick={() => setTab('products')}
            >
              Stocks &amp; produits
            </button>
          </div>

          <Show when={tab() === 'producers'}>
            <section class="space-y-6 rounded-2xl border border-cream-dark bg-cream p-6 shadow-sm">
              <h2 class="font-mono text-xs uppercase tracking-wide text-moss">Point de recherche</h2>
              <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div>
                  <label class="block text-xs font-medium text-ink/80" for="search-lat">
                    Latitude
                  </label>
                  <input
                    id="search-lat"
                    type="text"
                    class={inputClass}
                    value={lat()}
                    onInput={(e) => setLat(e.currentTarget.value)}
                  />
                </div>
                <div>
                  <label class="block text-xs font-medium text-ink/80" for="search-lng">
                    Longitude
                  </label>
                  <input
                    id="search-lng"
                    type="text"
                    class={inputClass}
                    value={lng()}
                    onInput={(e) => setLng(e.currentTarget.value)}
                  />
                </div>
                <div>
                  <label class="block text-xs font-medium text-ink/80" for="search-radius">
                    Rayon (km)
                  </label>
                  <select
                    id="search-radius"
                    class={inputClass}
                    value={String(radius())}
                    onChange={(e) => setRadius(Number(e.currentTarget.value))}
                  >
                    <For each={[...RADIUS_OPTIONS]}>
                      {(r) => <option value={String(r)}>{r} km</option>}
                    </For>
                  </select>
                </div>
                <div>
                  <label class="block text-xs font-medium text-ink/80" for="search-sort">
                    Tri
                  </label>
                  <select
                    id="search-sort"
                    class={inputClass}
                    value={sort()}
                    onChange={(e) => setSort(e.currentTarget.value as ProducerSort)}
                  >
                    <option value="distance">Distance</option>
                    <option value="rating">Note</option>
                    <option value="name">Nom</option>
                  </select>
                </div>
              </div>
              <div class="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  disabled={geoPending()}
                  onClick={() => useGeolocation()}
                >
                  {geoPending() ? 'Position…' : 'Ma position'}
                </Button>
                <Button type="button" variant="ghost" onClick={() => applyAccountLocation()}>
                  Coordonnées du compte
                </Button>
              </div>

              <div class="grid gap-4 lg:grid-cols-2">
                <div>
                  <label class="block text-xs font-medium text-ink/80" for="search-cat">
                    Catégorie de produit (filtre)
                  </label>
                  <select
                    id="search-cat"
                    class={inputClass}
                    value={category()}
                    onChange={(e) =>
                      setCategory((e.currentTarget.value || '') as ProductCategory | '')
                    }
                  >
                    <option value="">Toutes</option>
                    <For each={CATEGORY_OPTIONS}>
                      {(o) => <option value={o.value}>{o.label}</option>}
                    </For>
                  </select>
                </div>
                <div>
                  <label class="block text-xs font-medium text-ink/80" for="search-q-prod">
                    Mot-clé (nom, description)
                  </label>
                  <input
                    id="search-q-prod"
                    type="search"
                    class={inputClass}
                    placeholder="ex. maraîcher, miel…"
                    value={producerQ()}
                    onInput={(e) => setProducerQ(e.currentTarget.value)}
                  />
                </div>
              </div>

              <div>
                <Button type="button" onClick={() => void loadProducers(1)}>
                  Rechercher
                </Button>
              </div>

              <Show when={producerError()}>
                {(msg) => (
                  <p class="rounded-lg border border-rust/40 bg-rust/10 px-3 py-2 text-sm text-rust" role="alert">
                    {msg()}
                  </p>
                )}
              </Show>

              <Show when={producerLoading()}>
                <p class="text-sm text-ink/65">Chargement…</p>
              </Show>

              <Show when={!producerLoading() && producerTotal() === 0 && !producerError()}>
                <p class="text-sm text-ink/70">Aucun producteur dans ce rayon avec ces critères.</p>
              </Show>

              <ul class="grid gap-4 sm:grid-cols-2">
                <For each={producerRows()}>
                  {(p) => (
                    <li class="flex flex-col rounded-2xl border border-cream-dark bg-cream-dark/20 p-5 shadow-sm">
                      <div class="flex items-start justify-between gap-2">
                        <p class="font-display text-lg font-semibold text-ink">
                          {p.companyName ?? 'Producteur'}
                        </p>
                        <span class="shrink-0 rounded-full bg-moss/15 px-2 py-0.5 font-mono text-xs text-moss">
                          {formatDistance(p.distanceKm)}
                        </span>
                      </div>
                      <p class="mt-1 text-sm text-ink/65">
                        {[p.city, p.postalCode].filter(Boolean).join(' · ') || 'La Réunion'}
                      </p>
                      <p class="mt-3 line-clamp-4 flex-1 text-sm text-ink/80">{p.description ?? '—'}</p>
                      <p class="mt-3 font-mono text-xs text-ink/55">
                        ★ {p.averageRating.toFixed(1)} ({p.totalRatings}) · fiabilité{' '}
                        {p.reliabilityScore.toFixed(0)}%
                      </p>
                      <p class="mt-4">
                        <A
                          href={`/app/producers/${p.id}`}
                          class="text-sm font-semibold text-moss underline underline-offset-2"
                        >
                          Voir le profil
                        </A>
                      </p>
                    </li>
                  )}
                </For>
              </ul>

              <Show when={producerTotal() > pageSize}>
                <div class="flex flex-wrap items-center gap-3 border-t border-cream-dark pt-4">
                  <span class="text-sm text-ink/70">
                    Page {producerPage()} / {producerTotalPages()} — {producerTotal()} résultat
                    {producerTotal() > 1 ? 's' : ''}
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    disabled={producerPage() <= 1}
                    onClick={() => void loadProducers(producerPage() - 1)}
                  >
                    Précédent
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    disabled={producerPage() >= producerTotalPages()}
                    onClick={() => void loadProducers(producerPage() + 1)}
                  >
                    Suivant
                  </Button>
                </div>
              </Show>
            </section>
          </Show>

          <Show when={tab() === 'products'}>
            <section class="space-y-6 rounded-2xl border border-cream-dark bg-cream p-6 shadow-sm">
              <h2 class="font-mono text-xs uppercase tracking-wide text-moss">Recherche dans les stocks</h2>
              <div class="flex flex-col gap-3 sm:flex-row sm:items-end">
                <div class="flex-1">
                  <label class="block text-xs font-medium text-ink/80" for="search-q-stock">
                    Mot-clé (nom ou description du produit)
                  </label>
                  <input
                    id="search-q-stock"
                    type="search"
                    class={inputClass}
                    placeholder="ex. tomate, miel, œuf…"
                    value={productQ()}
                    onInput={(e) => setProductQ(e.currentTarget.value)}
                  />
                </div>
                <Button type="button" onClick={() => void loadProducts(1)}>
                  Rechercher
                </Button>
              </div>

              <Show when={productError()}>
                {(msg) => (
                  <p class="rounded-lg border border-rust/40 bg-rust/10 px-3 py-2 text-sm text-rust" role="alert">
                    {msg()}
                  </p>
                )}
              </Show>

              <Show when={productLoading()}>
                <p class="text-sm text-ink/65">Chargement…</p>
              </Show>

              <Show when={!productLoading() && productTotal() === 0 && productQ().trim().length > 0 && !productError()}>
                <p class="text-sm text-ink/70">Aucun stock ne correspond à cette recherche.</p>
              </Show>

              <div class="overflow-x-auto rounded-xl border border-cream-dark">
                <table class="min-w-full divide-y divide-cream-dark text-left text-sm">
                  <thead class="bg-cream-dark/40 font-mono text-xs uppercase text-ink/60">
                    <tr>
                      <th class="px-4 py-3">Produit</th>
                      <th class="px-4 py-3">Catégorie</th>
                      <th class="px-4 py-3">Prix</th>
                      <th class="px-4 py-3">Dispo</th>
                      <th class="px-4 py-3">Producteur</th>
                      <th class="px-4 py-3" />
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-cream-dark bg-cream">
                    <For each={productRows()}>
                      {(row) => (
                        <tr>
                          <td class="px-4 py-3 font-medium text-ink">{row.productName}</td>
                          <td class="px-4 py-3 text-ink/75">{categoryLabel(row.category)}</td>
                          <td class="px-4 py-3 whitespace-nowrap">
                            {formatMoney(row.unitPrice)} / {row.unit}
                          </td>
                          <td class="px-4 py-3 text-ink/75">
                            {row.quantityAvailable} · jusqu’au {formatIsoDate(row.expiresAt)}
                          </td>
                          <td class="px-4 py-3 text-ink/80">{row.companyName ?? '—'}</td>
                          <td class="px-4 py-3">
                            <A
                              href={`/app/producers/${row.producerId}`}
                              class="font-semibold text-moss underline underline-offset-2"
                            >
                              Profil
                            </A>
                          </td>
                        </tr>
                      )}
                    </For>
                  </tbody>
                </table>
              </div>

              <Show when={productTotal() > pageSize}>
                <div class="flex flex-wrap items-center gap-3">
                  <span class="text-sm text-ink/70">
                    Page {productPage()} / {productTotalPages()} — {productTotal()} ligne
                    {productTotal() > 1 ? 's' : ''}
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    disabled={productPage() <= 1}
                    onClick={() => void loadProducts(productPage() - 1)}
                  >
                    Précédent
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    disabled={productPage() >= productTotalPages()}
                    onClick={() => void loadProducts(productPage() + 1)}
                  >
                    Suivant
                  </Button>
                </div>
              </Show>
            </section>
          </Show>
        </Show>
      </Show>
    </div>
  );
}
