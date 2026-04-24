import { For, Show, createSignal, onMount } from 'solid-js';
import { A, useNavigate, useParams } from '@solidjs/router';
import { Button } from '../components/ui/button';
import { authStore } from '../stores/auth.store';
import { orderService } from '../services/order.service';
import { inboxStore } from '../stores/inbox.store';
import { conversationsService } from '../services/conversations.service';
import type { ApiError } from '../services/http-client';
import { formatIsoDate } from '../lib/formatters/date';
import {
  ORDER_STATUS_LABEL,
  formatOrderRetrievalDate,
  orderStatusBadgeClass,
} from '../lib/order-ui';
import type { OrderDetail } from '../entities';

function lineTotalEUR(qty: string, unitPrice: string): string {
  const t = parseFloat(qty) * parseFloat(unitPrice);
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(t);
}

export function OrderDetailPage() {
  const navigate = useNavigate();
  const params = useParams<{ id: string }>();
  const [order, setOrder] = createSignal<OrderDetail | null>(null);
  const [loadError, setLoadError] = createSignal<string | null>(null);
  const [actionError, setActionError] = createSignal<string | null>(null);
  const [actionPending, setActionPending] = createSignal(false);
  const [reasonMode, setReasonMode] = createSignal<'refuse' | 'cancel' | null>(null);
  const [reasonText, setReasonText] = createSignal('');
  const [msgOpening, setMsgOpening] = createSignal(false);

  const id = () => params.id;

  async function reload() {
    setLoadError(null);
    try {
      const d = await orderService.getById(id());
      setOrder(d);
    } catch (err) {
      const api = err as ApiError;
      setLoadError(api.message ?? 'Commande introuvable.');
      setOrder(null);
    }
  }

  onMount(async () => {
    if (!authStore.currentUser()) {
      await authStore.loadCurrentUser();
    }
    await reload();
    if (order()) {
      try {
        await orderService.acknowledgeSeen(id());
        await inboxStore.refresh();
      } catch {
        /* ignore */
      }
    }
  });

  const role = () => authStore.currentUser()?.role;
  const isProducer = () => role() === 'producer';
  const isBuyer = () => role() === 'buyer';

  const canActAsProducer = () =>
    isProducer() && order() && order()!.producerId === authStore.currentUser()?.id;
  const canActAsBuyer = () =>
    isBuyer() && order() && order()!.buyerId === authStore.currentUser()?.id;

  async function runAction(fn: () => Promise<OrderDetail>) {
    setActionError(null);
    setActionPending(true);
    try {
      const d = await fn();
      setOrder(d);
    } catch (err) {
      const api = err as ApiError;
      setActionError(api.message ?? 'Action impossible.');
    } finally {
      setActionPending(false);
    }
  }

  function openReason(mode: 'refuse' | 'cancel') {
    setReasonText('');
    setReasonMode(mode);
    setActionError(null);
  }

  function closeReason() {
    setReasonMode(null);
    setReasonText('');
  }

  async function openConversationWithCounterparty() {
    const ord = order();
    if (!ord) return;
    setActionError(null);
    setMsgOpening(true);
    try {
      if (isBuyer()) {
        const c = await conversationsService.create({ producerId: ord.producerId });
        navigate(`/app/messages/${c.id}`);
      } else if (isProducer()) {
        const c = await conversationsService.create({ buyerId: ord.buyerId });
        navigate(`/app/messages/${c.id}`);
      }
    } catch (err) {
      const api = err as ApiError;
      setActionError(api.message ?? 'Impossible d’ouvrir la messagerie.');
    } finally {
      setMsgOpening(false);
    }
  }

  async function submitReason(e: Event) {
    e.preventDefault();
    const r = reasonText().trim();
    if (r.length < 1) {
      setActionError('Indiquez un motif.');
      return;
    }
    const oid = id();
    const mode = reasonMode();
    setActionPending(true);
    setActionError(null);
    try {
      if (mode === 'refuse') {
        const d = await orderService.refuse(oid, r);
        setOrder(d);
      } else if (mode === 'cancel') {
        const d = await orderService.cancel(oid, r);
        setOrder(d);
      }
      closeReason();
    } catch (err) {
      const api = err as ApiError;
      setActionError(api.message ?? 'Action impossible.');
    } finally {
      setActionPending(false);
    }
  }

  const inputClass =
    'mt-1 w-full rounded-lg border border-cream-dark bg-cream px-3 py-2 text-ink shadow-sm focus:border-moss focus:outline-none focus:ring-1 focus:ring-moss';

  return (
    <div class="space-y-8">
      <div class="flex flex-wrap items-center gap-3">
        <A
          href="/app/orders"
          class="text-sm font-semibold text-moss hover:underline underline-offset-2"
        >
          ← Toutes les commandes
        </A>
      </div>

      <Show when={loadError()}>
        {(msg) => (
          <div
            class="rounded-xl border border-rust/40 bg-rust/10 px-4 py-3 text-sm text-rust"
            role="alert"
          >
            {msg()}
            <p class="mt-3">
              <A href="/app/orders" class="font-medium underline underline-offset-2">
                Retour à la liste
              </A>
            </p>
          </div>
        )}
      </Show>

      <Show when={order()}>
        {(o) => (
          <>
            <header class="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h1 class="font-display text-3xl font-semibold text-ink">Précommande</h1>
                <p class="mt-1 font-mono text-xs text-ink/50">{o().id}</p>
              </div>
              <span class={`w-fit ${orderStatusBadgeClass(o().status)}`}>
                {ORDER_STATUS_LABEL[o().status]}
              </span>
            </header>

            <div class="grid gap-6 lg:grid-cols-2">
              <section class="rounded-2xl border border-cream-dark bg-cream p-5 shadow-sm">
                <h2 class="font-mono text-xs uppercase tracking-wide text-ink/50">Retrait</h2>
                <p class="mt-2 font-medium text-ink">{formatOrderRetrievalDate(o().retrievalDate)}</p>
                <Show when={o().retrievalTimeSlot}>
                  {(slot) => <p class="mt-1 text-sm text-ink/70">Créneau : {slot()}</p>}
                </Show>
                <p class="mt-3 text-xs text-ink/55">
                  Créée le {formatIsoDate(o().createdAt)}
                </p>
              </section>

              <section class="rounded-2xl border border-cream-dark bg-cream p-5 shadow-sm">
                <h2 class="font-mono text-xs uppercase tracking-wide text-ink/50">Parties</h2>
                <p class="mt-2 text-sm text-ink/80">
                  <span class="text-ink/55">Commerçant :</span>{' '}
                  {o().buyer.companyName ?? o().buyer.id}
                </p>
                <p class="mt-1 text-sm text-ink/80">
                  <span class="text-ink/55">Producteur :</span>{' '}
                  {o().producer.companyName ?? o().producer.id}
                </p>
                <Show when={canActAsBuyer() || canActAsProducer()}>
                  <div class="mt-4">
                    <Button
                      type="button"
                      variant="secondary"
                      class="text-sm"
                      disabled={msgOpening()}
                      onClick={() => void openConversationWithCounterparty()}
                    >
                      {msgOpening()
                        ? 'Ouverture…'
                        : canActAsBuyer()
                          ? 'Écrire au producteur'
                          : 'Écrire au commerçant'}
                    </Button>
                  </div>
                </Show>
              </section>
            </div>

            <Show when={o().note}>
              {(n) => (
                <section class="rounded-2xl border border-cream-dark bg-cream-dark/25 px-5 py-4">
                  <h2 class="font-mono text-xs uppercase tracking-wide text-ink/50">Note</h2>
                  <p class="mt-2 text-sm text-ink/85">{n()}</p>
                </section>
              )}
            </Show>

            <Show when={o().refusalReason}>
              {(r) => (
                <p class="rounded-xl bg-rust/10 px-4 py-3 text-sm text-rust">
                  <strong>Motif du refus :</strong> {r()}
                </p>
              )}
            </Show>
            <Show when={o().cancellationReason}>
              {(r) => (
                <p class="rounded-xl bg-cream-dark/50 px-4 py-3 text-sm text-ink/80">
                  <strong>Motif d’annulation :</strong> {r()}
                </p>
              )}
            </Show>

            <section class="rounded-2xl border border-cream-dark bg-cream shadow-sm">
              <h2 class="border-b border-cream-dark bg-cream-dark/30 px-4 py-3 font-display text-lg font-semibold text-ink">
                Lignes
              </h2>
              <div class="overflow-x-auto">
                <table class="w-full text-left text-sm">
                  <thead class="font-mono text-xs uppercase tracking-wide text-ink/50">
                    <tr class="border-b border-cream-dark">
                      <th class="px-4 py-2 font-semibold">Produit</th>
                      <th class="px-4 py-2 font-semibold text-right">Qté</th>
                      <th class="px-4 py-2 font-semibold">Unité</th>
                      <th class="px-4 py-2 font-semibold text-right">Prix u.</th>
                      <th class="px-4 py-2 font-semibold text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-cream-dark bg-white/30">
                    <For each={o().items}>
                      {(it) => (
                        <tr>
                          <td class="px-4 py-3 font-medium text-ink">{it.productName}</td>
                          <td class="px-4 py-3 text-right tabular-nums">{it.quantity}</td>
                          <td class="px-4 py-3 text-ink/75">{it.unit}</td>
                          <td class="px-4 py-3 text-right tabular-nums">
                            {new Intl.NumberFormat('fr-FR', {
                              style: 'currency',
                              currency: 'EUR',
                            }).format(parseFloat(it.unitPriceSnapshot))}
                          </td>
                          <td class="px-4 py-3 text-right font-medium tabular-nums text-ink">
                            {lineTotalEUR(it.quantity, it.unitPriceSnapshot)}
                          </td>
                        </tr>
                      )}
                    </For>
                  </tbody>
                </table>
              </div>
            </section>

            <Show when={actionError()}>
              {(msg) => (
                <p class="rounded-md bg-rust/10 px-3 py-2 text-sm text-rust" role="alert">
                  {msg()}
                </p>
              )}
            </Show>

            <section class="rounded-2xl border border-moss/25 bg-moss/5 p-5">
              <h2 class="font-display text-lg font-semibold text-ink">Actions</h2>
              <p class="mt-1 text-sm text-ink/65">
                Selon votre rôle et le statut de la commande (voir dossier technique).
              </p>

              <div class="mt-4 flex flex-wrap gap-3">
                <Show when={o().status === 'pending' && canActAsProducer()}>
                  <Button
                    type="button"
                    disabled={actionPending()}
                    onClick={() =>
                      void runAction(() => orderService.accept(o().id))
                    }
                  >
                    Accepter
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    disabled={actionPending()}
                    onClick={() => openReason('refuse')}
                  >
                    Refuser
                  </Button>
                </Show>

                <Show when={o().status === 'pending' && (canActAsBuyer() || canActAsProducer())}>
                  <Button
                    type="button"
                    variant="ghost"
                    disabled={actionPending()}
                    onClick={() => openReason('cancel')}
                  >
                    Annuler la commande
                  </Button>
                </Show>

                <Show
                  when={
                    (o().status === 'accepted' || o().status === 'confirmed') &&
                    (canActAsBuyer() || canActAsProducer())
                  }
                >
                  <Button
                    type="button"
                    disabled={actionPending()}
                    onClick={() => void runAction(() => orderService.markHonored(o().id))}
                  >
                    Marquer honorée
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    disabled={actionPending()}
                    onClick={() => void runAction(() => orderService.markNotHonored(o().id))}
                  >
                    Marquer non honorée
                  </Button>
                </Show>
              </div>
            </section>
          </>
        )}
      </Show>

      <Show when={reasonMode()}>
        <div
          class="fixed inset-0 z-50 flex items-end justify-center bg-ink/40 p-4 sm:items-center"
          role="dialog"
          aria-modal="true"
        >
          <div class="w-full max-w-md rounded-2xl border border-cream-dark bg-cream p-6 shadow-lg">
            <h3 class="font-display text-lg font-semibold text-ink">
              {reasonMode() === 'refuse' ? 'Refuser la commande' : 'Annuler la commande'}
            </h3>
            <form class="mt-4 space-y-3" onSubmit={submitReason}>
              <div>
                <label class="text-sm font-medium text-ink" for="reason-input">
                  Motif <span class="text-rust">*</span>
                </label>
                <textarea
                  id="reason-input"
                  class={`${inputClass} min-h-[100px]`}
                  required
                  maxlength={2000}
                  value={reasonText()}
                  onInput={(e) => setReasonText(e.currentTarget.value)}
                />
              </div>
              <Show when={actionError()}>
                {(m) => <p class="text-sm text-rust">{m()}</p>}
              </Show>
              <div class="flex flex-wrap gap-2">
                <Button type="submit" disabled={actionPending()}>
                  Confirmer
                </Button>
                <Button type="button" variant="ghost" onClick={closeReason}>
                  Fermer
                </Button>
              </div>
            </form>
          </div>
        </div>
      </Show>
    </div>
  );
}
