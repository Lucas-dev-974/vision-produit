import { Show, createEffect, onCleanup, onMount } from 'solid-js';
import { A } from '@solidjs/router';
import type { RouteSectionProps } from '@solidjs/router';
import { authStore } from '../../stores/auth.store';
import { inboxStore } from '../../stores/inbox.store';

const navLink =
  'rounded-md px-1.5 py-1 hover:text-moss focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-moss';

const navLinkWithBadge =
  `${navLink} relative inline-flex items-center gap-1 pr-2`;

const badgeClass =
  'absolute -right-0.5 -top-1 z-10 flex h-[1.125rem] min-w-[1.125rem] items-center justify-center rounded-full bg-rust px-1 text-[10px] font-bold tabular-nums leading-none text-cream shadow ring-2 ring-cream';

function isEligible(role: string | undefined) {
  return role === 'buyer' || role === 'producer';
}

function OrdersNavLink() {
  return (
    <A href="/app/orders" class={navLinkWithBadge} activeClass="text-moss">
      <span>Commandes</span>
      <Show when={isEligible(authStore.currentUser()?.role) && inboxStore.unreadOrders() > 0}>
        <span class={badgeClass} aria-label={`${inboxStore.unreadOrders()} commandes à consulter`}>
          {inboxStore.unreadOrders() > 99 ? '99+' : inboxStore.unreadOrders()}
        </span>
      </Show>
    </A>
  );
}

function MessagesNavLink() {
  return (
    <A href="/app/messages" class={navLinkWithBadge} activeClass="text-moss">
      <span>Messages</span>
      <Show when={isEligible(authStore.currentUser()?.role) && inboxStore.unreadMessages() > 0}>
        <span class={badgeClass} aria-label={`${inboxStore.unreadMessages()} messages non lus`}>
          {inboxStore.unreadMessages() > 99 ? '99+' : inboxStore.unreadMessages()}
        </span>
      </Show>
    </A>
  );
}

export function AppLayout(props: RouteSectionProps) {
  onMount(() => {
    void authStore.loadCurrentUser().then(() => {
      const u = authStore.currentUser();
      if (u?.role === 'buyer' || u?.role === 'producer') {
        void inboxStore.refresh();
      }
    });
  });

  createEffect(() => {
    const u = authStore.currentUser();
    if (u?.role === 'buyer' || u?.role === 'producer') {
      inboxStore.start();
    } else {
      inboxStore.stop();
    }
  });

  onCleanup(() => {
    inboxStore.stop();
  });

  return (
    <div class="min-h-full flex flex-col bg-cream">
      <header class="border-b border-cream-dark bg-cream/90 backdrop-blur">
        <div class="mx-auto flex max-w-5xl flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
          <A href="/app/dashboard" class="font-display text-lg font-semibold text-moss">
            MonAppli
          </A>
          <nav class="flex flex-wrap items-center gap-x-3 gap-y-2 text-sm font-medium text-ink">
            <A href="/app/dashboard" class={navLink} activeClass="text-moss">
              Tableau de bord
            </A>
            <Show when={authStore.currentUser()?.role === 'producer'}>
              <A href="/app/catalog" class={navLink} activeClass="text-moss">
                Catalogue
              </A>
            </Show>
            <Show when={authStore.currentUser()?.role === 'buyer'}>
              <A href="/app/search" class={navLink} activeClass="text-moss">
                Recherche
              </A>
            </Show>
            <OrdersNavLink />
            <MessagesNavLink />
            <A href="/app/compte" class={navLink} activeClass="text-moss">
              Compte
            </A>
          </nav>
        </div>
      </header>
      <main class="mx-auto w-full max-w-5xl flex-1 px-4 py-8">{props.children}</main>
    </div>
  );
}
