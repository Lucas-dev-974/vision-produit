import { For, Show, createMemo, createSignal, onMount } from 'solid-js';
import { A } from '@solidjs/router';
import { Button } from '../components/ui/button';
import { authStore } from '../stores/auth.store';
import { productService } from '../services/product.service';
import { stockService } from '../services/stock.service';
import type { ApiError } from '../services/http-client';
import { formatIsoDate } from '../lib/formatters/date';
import type { Product, ProductCategory, Stock, StockUnit } from '../entities';

const CATEGORY_OPTIONS: { value: ProductCategory; label: string }[] = [
  { value: 'fruits', label: 'Fruits' },
  { value: 'vegetables', label: 'Légumes' },
  { value: 'eggs', label: 'Œufs' },
  { value: 'honey', label: 'Miel' },
  { value: 'poultry', label: 'Volaille' },
  { value: 'fish', label: 'Poisson' },
  { value: 'other', label: 'Autre' },
];

const UNIT_OPTIONS: { value: StockUnit; label: string }[] = [
  { value: 'kg', label: 'kg' },
  { value: 'g', label: 'g' },
  { value: 'bunch', label: 'Botte' },
  { value: 'crate', label: 'Cagette' },
  { value: 'unit', label: 'Unité' },
  { value: 'piece', label: 'Pièce' },
  { value: 'liter', label: 'Litre' },
];

function categoryLabel(c: ProductCategory): string {
  return CATEGORY_OPTIONS.find((o) => o.value === c)?.label ?? c;
}

function unitLabel(u: StockUnit): string {
  return UNIT_OPTIONS.find((o) => o.value === u)?.label ?? u;
}

function truncate(text: string, max: number): string {
  const t = text.trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max - 1)}…`;
}

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

function addDaysIso(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function formatMoney(n: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
  }).format(n);
}

function stocksForProduct(stocks: Stock[], productId: string): Stock[] {
  return stocks
    .filter((s) => s.productId === productId)
    .slice()
    .sort((a, b) => a.expiresAt.localeCompare(b.expiresAt) || a.id.localeCompare(b.id));
}

function productNameById(productList: Product[], productId: string): string {
  return productList.find((p) => p.id === productId)?.name ?? 'Produit inconnu';
}

export function ProducerCatalog() {
  const [products, setProducts] = createSignal<Product[]>([]);
  const [stocks, setStocks] = createSignal<Stock[]>([]);
  const [listLoading, setListLoading] = createSignal(true);
  const [listError, setListError] = createSignal<string | null>(null);
  const [stockError, setStockError] = createSignal<string | null>(null);

  const [formMode, setFormMode] = createSignal<'hidden' | 'create' | 'edit'>('hidden');
  const [editingId, setEditingId] = createSignal<string | null>(null);
  const [formName, setFormName] = createSignal('');
  const [formCategory, setFormCategory] = createSignal<ProductCategory>('fruits');
  const [formDescription, setFormDescription] = createSignal('');

  const [formError, setFormError] = createSignal<string | null>(null);
  const [formPending, setFormPending] = createSignal(false);
  const [deletingId, setDeletingId] = createSignal<string | null>(null);

  const [stockAdjustingId, setStockAdjustingId] = createSignal<string | null>(null);
  const [newStockProductId, setNewStockProductId] = createSignal<string | null>(null);
  const [expandLotsProductId, setExpandLotsProductId] = createSignal<string | null>(null);
  const [newQty, setNewQty] = createSignal(1);
  const [newUnit, setNewUnit] = createSignal<StockUnit>('kg');
  const [newPrice, setNewPrice] = createSignal(1);
  const [newFrom, setNewFrom] = createSignal(todayIso());
  const [newTo, setNewTo] = createSignal(addDaysIso(14));
  const [newStockPending, setNewStockPending] = createSignal(false);

  const [lotEditId, setLotEditId] = createSignal<string | null>(null);
  const [lotUnit, setLotUnit] = createSignal<StockUnit>('kg');
  const [lotPrice, setLotPrice] = createSignal(1);
  const [lotFrom, setLotFrom] = createSignal('');
  const [lotTo, setLotTo] = createSignal('');
  const [lotEditPending, setLotEditPending] = createSignal(false);

  const [allLotsPanelOpen, setAllLotsPanelOpen] = createSignal(true);

  const allLotsSorted = createMemo(() => {
    const prods = products();
    const list = stocks().slice();
    const nameOf = (pid: string) => productNameById(prods, pid);
    list.sort((a, b) => {
      const cmp = nameOf(a.productId).localeCompare(nameOf(b.productId), 'fr');
      if (cmp !== 0) return cmp;
      return a.expiresAt.localeCompare(b.expiresAt) || a.id.localeCompare(b.id);
    });
    return list;
  });

  async function reloadAll() {
    setListError(null);
    try {
      const [prodList, stockList] = await Promise.all([
        productService.listMine(),
        stockService.listMine(),
      ]);
      setProducts(prodList);
      setStocks(stockList);
    } catch (err) {
      const api = err as ApiError;
      setListError(api.message ?? 'Impossible de charger le catalogue.');
    }
  }

  onMount(async () => {
    if (!authStore.currentUser()) {
      await authStore.loadCurrentUser();
    }
    if (authStore.currentUser()?.role !== 'producer') {
      setListLoading(false);
      return;
    }
    setListLoading(true);
    await reloadAll();
    setListLoading(false);
  });

  function openNewStock(productId: string) {
    setStockError(null);
    setExpandLotsProductId(null);
    setNewStockProductId(productId);
    setNewQty(1);
    setNewUnit('kg');
    setNewPrice(1);
    setNewFrom(todayIso());
    setNewTo(addDaysIso(14));
  }

  function closeNewStock() {
    setNewStockProductId(null);
  }

  function toggleExpandLots(productId: string) {
    setStockError(null);
    setNewStockProductId(null);
    setExpandLotsProductId((prev) => (prev === productId ? null : productId));
    setLotEditId(null);
  }

  function openLotSettings(productId: string, lot: Stock) {
    setStockError(null);
    setNewStockProductId(null);
    setExpandLotsProductId(productId);
    openLotEdit(lot);
  }

  async function submitNewStock(productId: string, e: Event) {
    e.preventDefault();
    setStockError(null);
    const qty = newQty();
    const price = newPrice();
    const from = newFrom();
    const to = newTo();
    if (to < from) {
      setStockError('La date de fin doit être après la date de début.');
      return;
    }
    if (qty <= 0 || price < 0.01) {
      setStockError('Quantité et prix invalides.');
      return;
    }
    setNewStockPending(true);
    try {
      await stockService.create({
        productId,
        quantity: qty,
        unit: newUnit(),
        unitPrice: round2(price),
        availableFrom: from,
        expiresAt: to,
      });
      closeNewStock();
      await reloadAll();
    } catch (err) {
      const api = err as ApiError;
      setStockError(api.message ?? 'Création du lot impossible.');
    } finally {
      setNewStockPending(false);
    }
  }

  async function adjustQuantity(stock: Stock, delta: number) {
    setStockError(null);
    setStockAdjustingId(stock.id);
    try {
      const next = round2(parseFloat(stock.quantity) + delta);
      if (next <= 0) {
        await stockService.delete(stock.id);
      } else {
        await stockService.update(stock.id, { quantity: next });
      }
      await reloadAll();
    } catch (err) {
      const api = err as ApiError;
      setStockError(api.message ?? 'Mise à jour du stock impossible.');
    } finally {
      setStockAdjustingId(null);
    }
  }

  function openLotEdit(s: Stock) {
    setLotEditId(s.id);
    setLotUnit(s.unit);
    setLotPrice(parseFloat(s.unitPrice));
    setLotFrom(s.availableFrom);
    setLotTo(s.expiresAt);
  }

  async function saveLotEdit(stockId: string, e: Event) {
    e.preventDefault();
    setStockError(null);
    const from = lotFrom();
    const to = lotTo();
    if (to < from) {
      setStockError('La date de fin doit être après la date de début.');
      return;
    }
    const price = lotPrice();
    if (price < 0.01) {
      setStockError('Prix minimum 0,01 €.');
      return;
    }
    setLotEditPending(true);
    try {
      await stockService.update(stockId, {
        unit: lotUnit(),
        unitPrice: round2(price),
        availableFrom: from,
        expiresAt: to,
      });
      setLotEditId(null);
      await reloadAll();
    } catch (err) {
      const api = err as ApiError;
      setStockError(api.message ?? 'Enregistrement impossible.');
    } finally {
      setLotEditPending(false);
    }
  }

  async function removeLot(stockId: string) {
    if (!window.confirm('Supprimer ce lot ?')) return;
    setStockError(null);
    setStockAdjustingId(stockId);
    try {
      await stockService.delete(stockId);
      setLotEditId(null);
      await reloadAll();
    } catch (err) {
      const api = err as ApiError;
      setStockError(api.message ?? 'Suppression impossible.');
    } finally {
      setStockAdjustingId(null);
    }
  }

  function openCreate() {
    setFormError(null);
    setFormMode('create');
    setEditingId(null);
    setFormName('');
    setFormCategory('fruits');
    setFormDescription('');
  }

  function openEdit(p: Product) {
    setFormError(null);
    setFormMode('edit');
    setEditingId(p.id);
    setFormName(p.name);
    setFormCategory(p.category);
    setFormDescription(p.description);
  }

  function closeForm() {
    setFormMode('hidden');
    setEditingId(null);
    setFormError(null);
  }

  async function submitForm(e: Event) {
    e.preventDefault();
    setFormError(null);
    const name = formName().trim();
    const description = formDescription().trim();
    if (!name) {
      setFormError('Le nom est obligatoire.');
      return;
    }
    if (name.length > 100) {
      setFormError('Le nom ne peut pas dépasser 100 caractères.');
      return;
    }
    if (description.length > 2000) {
      setFormError('La description ne peut pas dépasser 2000 caractères.');
      return;
    }

    setFormPending(true);
    try {
      if (formMode() === 'create') {
        await productService.create({
          name,
          category: formCategory(),
          description,
        });
      } else if (formMode() === 'edit' && editingId()) {
        await productService.update(editingId()!, {
          name,
          category: formCategory(),
          description,
        });
      }
      await reloadAll();
      closeForm();
    } catch (err) {
      const api = err as ApiError;
      setFormError(api.message ?? 'Enregistrement impossible.');
    } finally {
      setFormPending(false);
    }
  }

  async function removeProduct(id: string) {
    if (!window.confirm('Supprimer ce produit ? Cette action est définitive.')) {
      return;
    }
    setDeletingId(id);
    setListError(null);
    try {
      await productService.delete(id);
      if (editingId() === id) closeForm();
      await reloadAll();
    } catch (err) {
      const api = err as ApiError;
      setListError(api.message ?? 'Suppression impossible.');
    } finally {
      setDeletingId(null);
    }
  }

  const inputClass =
    'mt-1 w-full rounded-lg border border-cream-dark bg-cream px-3 py-2 text-ink shadow-sm focus:border-moss focus:outline-none focus:ring-1 focus:ring-moss';

  const btnStep =
    'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-cream-dark bg-cream text-lg font-semibold text-ink hover:bg-cream-dark/80 disabled:opacity-45';

  return (
    <div class="space-y-8">
      <header class="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 class="font-display text-3xl font-semibold text-ink">Catalogue</h1>
          <p class="mt-2 max-w-xl text-ink/75">
            Fiches produit et <strong>stocks actifs</strong> (quantités, prix, dates) au même endroit.
            Les lots expirés ou à quantité nulle ne sont pas listés par l’API — créez un nouveau lot si
            besoin.
          </p>
        </div>
        <Show when={authStore.currentUser()?.role === 'producer'}>
          <div class="flex flex-wrap gap-2">
            <Show when={formMode() === 'hidden'}>
              <Button type="button" onClick={() => openCreate()}>
                Nouveau produit
              </Button>
            </Show>
            <Show when={formMode() !== 'hidden'}>
              <Button type="button" variant="ghost" onClick={() => closeForm()}>
                Fermer le formulaire
              </Button>
            </Show>
          </div>
        </Show>
      </header>

      <Show when={!authStore.isLoading()} fallback={<p class="text-ink/70">Chargement…</p>}>
        <Show
          when={authStore.currentUser()?.role === 'producer'}
          fallback={
            <div class="rounded-2xl border border-cream-dark bg-cream p-8 text-center shadow-sm">
              <p class="text-ink/80">Cette page est réservée aux comptes producteur.</p>
              <p class="mt-4">
                <A href="/app/dashboard" class="font-semibold text-moss underline underline-offset-2">
                  Retour au tableau de bord
                </A>
              </p>
            </div>
          }
        >
          <Show when={listError()}>
            {(msg) => (
              <div
                class="rounded-xl border border-rust/40 bg-rust/10 px-4 py-3 text-sm text-rust"
                role="alert"
              >
                {msg()}
              </div>
            )}
          </Show>

          <Show when={stockError()}>
            {(msg) => (
              <div
                class="rounded-xl border border-rust/40 bg-rust/10 px-4 py-3 text-sm text-rust"
                role="alert"
              >
                {msg()}
              </div>
            )}
          </Show>

          <section
            class="rounded-2xl border border-cream-dark bg-cream shadow-sm"
            aria-labelledby="all-lots-heading"
          >
            <button
              type="button"
              id="all-lots-heading"
              class="flex w-full items-center justify-between gap-3 px-5 py-4 text-left transition hover:bg-cream-dark/25"
              aria-expanded={allLotsPanelOpen()}
              onClick={() => setAllLotsPanelOpen(!allLotsPanelOpen())}
            >
              <span class="font-display text-lg font-semibold text-ink">
                Tous les lots
                <span class="ml-2 font-mono text-sm font-normal text-ink/55">
                  ({stocks().length})
                </span>
              </span>
              <span class="shrink-0 text-ink/45" aria-hidden="true">
                {allLotsPanelOpen() ? '▼' : '▶'}
              </span>
            </button>
            <Show when={allLotsPanelOpen()}>
              <div class="border-t border-cream-dark px-2 pb-4 sm:px-4">
                <p class="px-2 py-2 text-xs text-ink/55">
                  Vue plate de tous les lots actifs (non expirés, quantité &gt; 0), triés par produit
                  puis date de fin.
                </p>
                <Show
                  when={!listLoading()}
                  fallback={<p class="px-2 py-4 text-sm text-ink/60">Chargement…</p>}
                >
                  <Show
                    when={allLotsSorted().length > 0}
                    fallback={
                      <p class="px-2 py-4 text-sm text-ink/65">
                        Aucun lot actif. Ajoutez un lot depuis chaque produit dans le tableau
                        ci-dessous.
                      </p>
                    }
                  >
                    <div class="overflow-x-auto rounded-xl border border-cream-dark bg-white/50">
                      <table class="w-full min-w-[44rem] text-left text-sm">
                        <thead class="border-b border-cream-dark bg-cream-dark/35 font-mono text-xs uppercase tracking-wide text-ink/55">
                          <tr>
                            <th class="px-3 py-2.5 font-semibold">Produit</th>
                            <th class="px-3 py-2.5 font-semibold">Qté</th>
                            <th class="hidden px-3 py-2.5 font-semibold sm:table-cell">Unité</th>
                            <th class="px-3 py-2.5 font-semibold">Prix</th>
                            <th class="hidden px-3 py-2.5 font-semibold md:table-cell">Période</th>
                            <th class="px-3 py-2.5 font-semibold text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody class="divide-y divide-cream-dark">
                          <For each={allLotsSorted()}>
                            {(lot) => {
                              const busy = () => stockAdjustingId() === lot.id;
                              const pname = () => productNameById(products(), lot.productId);
                              return (
                                <tr class="text-ink/90">
                                  <td class="px-3 py-3">
                                    <span class="font-medium text-ink">{pname()}</span>
                                  </td>
                                  <td class="px-3 py-3">
                                    <div class="flex items-center gap-1">
                                      <button
                                        type="button"
                                        class={`${btnStep} h-8 w-8 text-base`}
                                        disabled={busy()}
                                        aria-label="Diminuer"
                                        onClick={() => void adjustQuantity(lot, -1)}
                                      >
                                        −
                                      </button>
                                      <span class="min-w-[3rem] text-center font-mono text-sm font-semibold tabular-nums">
                                        {lot.quantity}
                                      </span>
                                      <button
                                        type="button"
                                        class={`${btnStep} h-8 w-8 text-base`}
                                        disabled={busy()}
                                        aria-label="Augmenter"
                                        onClick={() => void adjustQuantity(lot, 1)}
                                      >
                                        +
                                      </button>
                                    </div>
                                    <span class="mt-1 text-xs text-ink/55 sm:hidden">
                                      {unitLabel(lot.unit)}
                                    </span>
                                  </td>
                                  <td class="hidden px-3 py-3 sm:table-cell">
                                    {unitLabel(lot.unit)}
                                  </td>
                                  <td class="px-3 py-3 tabular-nums">
                                    {formatMoney(parseFloat(lot.unitPrice))}
                                  </td>
                                  <td class="hidden px-3 py-3 text-xs text-ink/70 md:table-cell">
                                    {formatIsoDate(`${lot.availableFrom}T12:00:00`)} →{' '}
                                    {formatIsoDate(`${lot.expiresAt}T12:00:00`)}
                                  </td>
                                  <td class="px-3 py-3 text-right">
                                    <div class="flex flex-col items-end gap-1 sm:flex-row sm:justify-end sm:gap-2">
                                      <button
                                        type="button"
                                        class="text-xs font-semibold text-moss underline underline-offset-2 sm:text-sm"
                                        onClick={() => openLotSettings(lot.productId, lot)}
                                      >
                                        Prix &amp; dates
                                      </button>
                                      <button
                                        type="button"
                                        class="text-xs font-semibold text-rust underline underline-offset-2 sm:text-sm"
                                        disabled={busy()}
                                        onClick={() => void removeLot(lot.id)}
                                      >
                                        Supprimer
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              );
                            }}
                          </For>
                        </tbody>
                      </table>
                    </div>
                  </Show>
                </Show>
              </div>
            </Show>
          </section>

          <Show when={formMode() !== 'hidden'}>
            <section
              class="rounded-2xl border border-cream-dark bg-cream p-6 shadow-sm"
              aria-labelledby="catalog-form-title"
            >
              <h2 id="catalog-form-title" class="font-display text-xl font-semibold text-ink">
                {formMode() === 'create' ? 'Nouveau produit' : 'Modifier le produit'}
              </h2>
              <form class="mt-6 space-y-4" onSubmit={submitForm}>
                <div class="grid gap-4 sm:grid-cols-2">
                  <div class="sm:col-span-1">
                    <label class="block text-sm font-medium text-ink" for="prod-name">
                      Nom <span class="text-rust">*</span>
                    </label>
                    <input
                      id="prod-name"
                      class={inputClass}
                      maxlength={100}
                      required
                      value={formName()}
                      onInput={(e) => setFormName(e.currentTarget.value)}
                      placeholder="Ex. Ananas Victoria"
                    />
                  </div>
                  <div class="sm:col-span-1">
                    <label class="block text-sm font-medium text-ink" for="prod-category">
                      Catégorie
                    </label>
                    <select
                      id="prod-category"
                      class={inputClass}
                      value={formCategory()}
                      onChange={(e) =>
                        setFormCategory(e.currentTarget.value as ProductCategory)
                      }
                    >
                      <For each={CATEGORY_OPTIONS}>
                        {(opt) => <option value={opt.value}>{opt.label}</option>}
                      </For>
                    </select>
                  </div>
                </div>
                <div>
                  <label class="block text-sm font-medium text-ink" for="prod-desc">
                    Description
                  </label>
                  <textarea
                    id="prod-desc"
                    class={`${inputClass} min-h-[120px] resize-y`}
                    maxlength={2000}
                    rows={5}
                    value={formDescription()}
                    onInput={(e) => setFormDescription(e.currentTarget.value)}
                    placeholder="Origine, calibre, conditionnement, labels, etc."
                  />
                  <p class="mt-1 text-xs text-ink/50">{formDescription().length} / 2000</p>
                </div>

                <Show when={formError()}>
                  {(msg) => (
                    <p class="rounded-md bg-rust/10 px-3 py-2 text-sm text-rust" role="alert">
                      {msg()}
                    </p>
                  )}
                </Show>

                <div class="flex flex-wrap gap-3">
                  <Button type="submit" disabled={formPending()}>
                    {formPending()
                      ? 'Enregistrement…'
                      : formMode() === 'create'
                        ? 'Créer le produit'
                        : 'Enregistrer'}
                  </Button>
                  <Button type="button" variant="ghost" disabled={formPending()} onClick={closeForm}>
                    Annuler
                  </Button>
                </div>
              </form>
            </section>
          </Show>

          <section aria-labelledby="catalog-list-title">
            <h2 id="catalog-list-title" class="sr-only">
              Liste des produits
            </h2>
            <Show
              when={!listLoading()}
              fallback={<p class="text-ink/70">Chargement du catalogue…</p>}
            >
              <Show
                when={products().length > 0}
                fallback={
                  <div class="rounded-2xl border border-dashed border-cream-dark bg-cream/50 px-6 py-14 text-center">
                    <p class="text-ink/75">Aucun produit pour l’instant.</p>
                    <p class="mt-2 text-sm text-ink/60">
                      Ajoutez une fiche pour commencer à recevoir des précommandes.
                    </p>
                    <Show when={formMode() === 'hidden'}>
                      <p class="mt-6">
                        <Button type="button" onClick={() => openCreate()}>
                          Nouveau produit
                        </Button>
                      </p>
                    </Show>
                  </div>
                }
              >
                <div class="overflow-hidden rounded-2xl border border-cream-dark bg-cream shadow-sm">
                  <table class="w-full text-left text-sm">
                    <thead class="border-b border-cream-dark bg-cream-dark/40 font-mono text-xs uppercase tracking-wide text-ink/55">
                      <tr>
                        <th class="px-4 py-3 font-semibold">Produit</th>
                        <th class="hidden px-4 py-3 font-semibold lg:table-cell">Catégorie</th>
                        <th class="px-4 py-3 font-semibold">Stock</th>
                        <th class="hidden px-4 py-3 font-semibold md:table-cell">Créé le</th>
                        <th class="px-4 py-3 font-semibold text-right">Actions</th>
                      </tr>
                    </thead>
                    <For each={products()}>
                      {(p) => {
                        const lines = () => stocksForProduct(stocks(), p.id);
                        const busy = () => stockAdjustingId();
                        return (
                          <tbody class="border-b border-cream-dark last:border-b-0">
                            <tr class="align-top text-ink/90">
                              <td class="px-4 py-4">
                                <p class="font-medium text-ink">{p.name}</p>
                                <p class="mt-1 text-ink/65 lg:hidden">{categoryLabel(p.category)}</p>
                                <p class="mt-2 text-xs text-ink/60 md:hidden">
                                  {truncate(p.description, 100)}
                                </p>
                                <p class="mt-1 hidden text-xs text-ink/60 md:line-clamp-2 md:block lg:hidden">
                                  {truncate(p.description, 180)}
                                </p>
                              </td>
                              <td class="hidden px-4 py-4 lg:table-cell">
                                {categoryLabel(p.category)}
                              </td>
                              <td class="px-4 py-4">
                                <Show
                                  when={lines()[0]}
                                  fallback={
                                    <div class="flex flex-col gap-2">
                                      <span class="text-ink/55">Aucun lot actif</span>
                                      <button
                                        type="button"
                                        class="w-fit text-left text-sm font-semibold text-moss underline underline-offset-2"
                                        onClick={() => openNewStock(p.id)}
                                      >
                                        + Ajouter un lot
                                      </button>
                                    </div>
                                  }
                                >
                                  {(getStock) => {
                                    const st = getStock();
                                    return (
                                      <div class="flex flex-col gap-2">
                                        <div class="flex flex-wrap items-center gap-2">
                                          <button
                                            type="button"
                                            class={btnStep}
                                            disabled={busy() === st.id}
                                            aria-label="Diminuer la quantité"
                                            onClick={() => void adjustQuantity(st, -1)}
                                          >
                                            −
                                          </button>
                                          <span class="min-w-[4rem] text-center font-mono text-base font-semibold tabular-nums text-ink">
                                            {st.quantity}
                                          </span>
                                          <button
                                            type="button"
                                            class={btnStep}
                                            disabled={busy() === st.id}
                                            aria-label="Augmenter la quantité"
                                            onClick={() => void adjustQuantity(st, 1)}
                                          >
                                            +
                                          </button>
                                          <span class="text-sm text-ink/75">
                                            {unitLabel(st.unit)}
                                          </span>
                                        </div>
                                        <p class="text-xs text-ink/60">
                                          {formatMoney(parseFloat(st.unitPrice))} · du{' '}
                                          {formatIsoDate(`${st.availableFrom}T12:00:00`)} au{' '}
                                          {formatIsoDate(`${st.expiresAt}T12:00:00`)}
                                        </p>
                                        <div class="flex flex-wrap gap-x-3 gap-y-1 text-xs">
                                          <button
                                            type="button"
                                            class="font-semibold text-moss underline underline-offset-2"
                                            onClick={() => openNewStock(p.id)}
                                          >
                                            + Autre lot
                                          </button>
                                          <Show when={lines().length > 1}>
                                            <button
                                              type="button"
                                              class="font-semibold text-ink/70 underline underline-offset-2"
                                              onClick={() => toggleExpandLots(p.id)}
                                            >
                                              {expandLotsProductId() === p.id
                                                ? 'Masquer les lots'
                                                : `${lines().length} lots (détail)`}
                                            </button>
                                          </Show>
                                          <button
                                            type="button"
                                            class="font-semibold text-ink/70 underline underline-offset-2"
                                            onClick={() => openLotSettings(p.id, st)}
                                          >
                                            Prix &amp; dates
                                          </button>
                                        </div>
                                      </div>
                                    );
                                  }}
                                </Show>
                              </td>
                              <td class="hidden tabular-nums px-4 py-4 text-ink/70 md:table-cell">
                                {formatIsoDate(p.createdAt)}
                              </td>
                              <td class="px-4 py-4 text-right">
                                <div class="flex flex-col items-end gap-2 sm:flex-row sm:justify-end">
                                  <button
                                    type="button"
                                    class="text-sm font-semibold text-moss hover:underline underline-offset-2 disabled:opacity-50"
                                    disabled={deletingId() === p.id}
                                    onClick={() => openEdit(p)}
                                  >
                                    Modifier
                                  </button>
                                  <button
                                    type="button"
                                    class="text-sm font-semibold text-rust hover:underline underline-offset-2 disabled:opacity-50"
                                    disabled={deletingId() === p.id}
                                    onClick={() => void removeProduct(p.id)}
                                  >
                                    {deletingId() === p.id ? 'Suppression…' : 'Supprimer'}
                                  </button>
                                </div>
                              </td>
                            </tr>
                            <Show
                              when={
                                newStockProductId() === p.id ||
                                expandLotsProductId() === p.id
                              }
                            >
                              <tr class="bg-cream-dark/20">
                                <td class="px-4 py-4 lg:px-4" colSpan={5}>
                                  <Show when={newStockProductId() === p.id}>
                                    <div class="max-w-xl space-y-3">
                                      <p class="font-medium text-ink">Nouveau lot</p>
                                      <form
                                        class="grid gap-3 sm:grid-cols-2"
                                        onSubmit={(e) => submitNewStock(p.id, e)}
                                      >
                                        <div>
                                          <label class="text-xs font-medium text-ink/80" for={`nq-${p.id}`}>
                                            Quantité
                                          </label>
                                          <input
                                            id={`nq-${p.id}`}
                                            type="number"
                                            min={0.01}
                                            step={0.01}
                                            class={inputClass}
                                            value={newQty()}
                                            onInput={(e) =>
                                              setNewQty(parseFloat(e.currentTarget.value) || 0)
                                            }
                                          />
                                        </div>
                                        <div>
                                          <label class="text-xs font-medium text-ink/80" for={`nu-${p.id}`}>
                                            Unité
                                          </label>
                                          <select
                                            id={`nu-${p.id}`}
                                            class={inputClass}
                                            value={newUnit()}
                                            onChange={(e) =>
                                              setNewUnit(e.currentTarget.value as StockUnit)
                                            }
                                          >
                                            <For each={UNIT_OPTIONS}>
                                              {(opt) => (
                                                <option value={opt.value}>{opt.label}</option>
                                              )}
                                            </For>
                                          </select>
                                        </div>
                                        <div>
                                          <label class="text-xs font-medium text-ink/80" for={`np-${p.id}`}>
                                            Prix (€) / unité
                                          </label>
                                          <input
                                            id={`np-${p.id}`}
                                            type="number"
                                            min={0.01}
                                            step={0.01}
                                            class={inputClass}
                                            value={newPrice()}
                                            onInput={(e) =>
                                              setNewPrice(parseFloat(e.currentTarget.value) || 0)
                                            }
                                          />
                                        </div>
                                        <div>
                                          <label class="text-xs font-medium text-ink/80" for={`nf-${p.id}`}>
                                            Disponible dès
                                          </label>
                                          <input
                                            id={`nf-${p.id}`}
                                            type="date"
                                            class={inputClass}
                                            value={newFrom()}
                                            onInput={(e) => setNewFrom(e.currentTarget.value)}
                                          />
                                        </div>
                                        <div class="sm:col-span-2">
                                          <label class="text-xs font-medium text-ink/80" for={`nt-${p.id}`}>
                                            Jusqu’au
                                          </label>
                                          <input
                                            id={`nt-${p.id}`}
                                            type="date"
                                            class={inputClass}
                                            value={newTo()}
                                            onInput={(e) => setNewTo(e.currentTarget.value)}
                                          />
                                        </div>
                                        <div class="flex flex-wrap gap-2 sm:col-span-2">
                                          <Button type="submit" disabled={newStockPending()}>
                                            {newStockPending() ? 'Création…' : 'Créer le lot'}
                                          </Button>
                                          <Button
                                            type="button"
                                            variant="ghost"
                                            disabled={newStockPending()}
                                            onClick={closeNewStock}
                                          >
                                            Annuler
                                          </Button>
                                        </div>
                                      </form>
                                    </div>
                                  </Show>
                                  <Show when={expandLotsProductId() === p.id && !newStockProductId()}>
                                    <div class="space-y-4">
                                      <p class="font-medium text-ink">Lots actifs pour ce produit</p>
                                      <For each={lines()}>
                                        {(lot) => (
                                          <div class="rounded-xl border border-cream-dark bg-cream/80 px-4 py-3">
                                            <Show
                                              when={lotEditId() === lot.id}
                                              fallback={
                                                <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                                  <div>
                                                    <p class="font-mono text-sm tabular-nums text-ink">
                                                      <span class="font-semibold">{lot.quantity}</span>{' '}
                                                      {unitLabel(lot.unit)} ·{' '}
                                                      {formatMoney(parseFloat(lot.unitPrice))}
                                                    </p>
                                                    <p class="text-xs text-ink/60">
                                                      {formatIsoDate(`${lot.availableFrom}T12:00:00`)} →{' '}
                                                      {formatIsoDate(`${lot.expiresAt}T12:00:00`)}
                                                    </p>
                                                  </div>
                                                  <div class="flex flex-wrap items-center gap-2">
                                                    <button
                                                      type="button"
                                                      class={btnStep}
                                                      disabled={busy() === lot.id}
                                                      onClick={() => void adjustQuantity(lot, -1)}
                                                    >
                                                      −
                                                    </button>
                                                    <button
                                                      type="button"
                                                      class={btnStep}
                                                      disabled={busy() === lot.id}
                                                      onClick={() => void adjustQuantity(lot, 1)}
                                                    >
                                                      +
                                                    </button>
                                                    <button
                                                      type="button"
                                                      class="text-sm font-semibold text-moss underline underline-offset-2"
                                                      onClick={() => openLotEdit(lot)}
                                                    >
                                                      Modifier prix / dates
                                                    </button>
                                                    <button
                                                      type="button"
                                                      class="text-sm font-semibold text-rust underline underline-offset-2"
                                                      disabled={busy() === lot.id}
                                                      onClick={() => void removeLot(lot.id)}
                                                    >
                                                      Supprimer le lot
                                                    </button>
                                                  </div>
                                                </div>
                                              }
                                            >
                                              <form
                                                class="grid gap-3 sm:grid-cols-2"
                                                onSubmit={(e) => saveLotEdit(lot.id, e)}
                                              >
                                                <div>
                                                  <label class="text-xs font-medium text-ink/80">
                                                    Unité
                                                  </label>
                                                  <select
                                                    class={inputClass}
                                                    value={lotUnit()}
                                                    onChange={(e) =>
                                                      setLotUnit(e.currentTarget.value as StockUnit)
                                                    }
                                                  >
                                                    <For each={UNIT_OPTIONS}>
                                                      {(opt) => (
                                                        <option value={opt.value}>{opt.label}</option>
                                                      )}
                                                    </For>
                                                  </select>
                                                </div>
                                                <div>
                                                  <label class="text-xs font-medium text-ink/80">
                                                    Prix (€)
                                                  </label>
                                                  <input
                                                    type="number"
                                                    min={0.01}
                                                    step={0.01}
                                                    class={inputClass}
                                                    value={lotPrice()}
                                                    onInput={(e) =>
                                                      setLotPrice(parseFloat(e.currentTarget.value) || 0)
                                                    }
                                                  />
                                                </div>
                                                <div>
                                                  <label class="text-xs font-medium text-ink/80">
                                                    Depuis
                                                  </label>
                                                  <input
                                                    type="date"
                                                    class={inputClass}
                                                    value={lotFrom()}
                                                    onInput={(e) => setLotFrom(e.currentTarget.value)}
                                                  />
                                                </div>
                                                <div>
                                                  <label class="text-xs font-medium text-ink/80">
                                                    Jusqu’au
                                                  </label>
                                                  <input
                                                    type="date"
                                                    class={inputClass}
                                                    value={lotTo()}
                                                    onInput={(e) => setLotTo(e.currentTarget.value)}
                                                  />
                                                </div>
                                                <div class="flex flex-wrap gap-2 sm:col-span-2">
                                                  <Button type="submit" disabled={lotEditPending()}>
                                                    {lotEditPending() ? '…' : 'Enregistrer'}
                                                  </Button>
                                                  <Button
                                                    type="button"
                                                    variant="ghost"
                                                    disabled={lotEditPending()}
                                                    onClick={() => setLotEditId(null)}
                                                  >
                                                    Fermer
                                                  </Button>
                                                </div>
                                              </form>
                                            </Show>
                                          </div>
                                        )}
                                      </For>
                                    </div>
                                  </Show>
                                </td>
                              </tr>
                            </Show>
                          </tbody>
                        );
                      }}
                    </For>
                  </table>
                </div>
              </Show>
            </Show>
          </section>
        </Show>
      </Show>
    </div>
  );
}
