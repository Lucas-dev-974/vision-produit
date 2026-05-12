import { A, useNavigate } from '@solidjs/router';
import type { RouteSectionProps } from '@solidjs/router';
import { For, Show } from 'solid-js';
import { authStore } from '../../stores/auth.store';
import { APP_NAME } from '../../config/constants';

interface NavItem {
  href: string;
  label: string;
  end?: boolean;
}

const NAV: NavItem[] = [
  { href: '/admin', label: 'Vue d\u2019ensemble', end: true },
  { href: '/admin/pre-inscriptions', label: 'Pré-inscriptions' },
  { href: '/admin/questionnaires', label: 'Questionnaires' },
  { href: '/admin/users/pending', label: 'À approuver' },
  { href: '/admin/users', label: 'Utilisateurs', end: true },
  { href: '/admin/reports', label: 'Signalements' },
  { href: '/admin/audit', label: 'Journal d\u2019actions' },
];

export function AdminLayout(props: RouteSectionProps) {
  const navigate = useNavigate();

  return (
    <div class="min-h-screen bg-ink text-cream">
      <div class="flex min-h-screen">
        <aside class="hidden w-60 shrink-0 border-r border-moss-light/30 bg-ink/95 px-3 py-6 md:block">
          <A
            href="/admin"
            end
            class="block px-2 pb-6 font-display text-lg font-semibold tracking-wide text-cream"
          >
            {APP_NAME}
            <span class="ml-2 rounded-md bg-ochre/20 px-1.5 py-0.5 text-xs font-medium text-ochre">
              Admin
            </span>
          </A>
          <nav class="space-y-1">
            <For each={NAV}>
              {(item) => (
                <A
                  href={item.href}
                  end={item.end}
                  class="block rounded-md px-3 py-2 text-sm text-cream/80 transition hover:bg-moss-light/15 hover:text-cream"
                  activeClass="bg-moss-light/25 text-cream"
                >
                  {item.label}
                </A>
              )}
            </For>
          </nav>
        </aside>

        <div class="flex min-w-0 flex-1 flex-col">
          <header class="border-b border-moss-light/30 bg-ink/90 backdrop-blur">
            <div class="flex flex-wrap items-center justify-between gap-3 px-4 py-3 md:px-8">
              <div class="md:hidden">
                <span class="font-display text-base font-semibold">
                  {APP_NAME} Admin
                </span>
              </div>
              <Show when={authStore.currentUser()}>
                {(u) => (
                  <div class="flex items-center gap-3 text-sm">
                    <span class="rounded-md bg-cream/10 px-2 py-1 font-mono text-xs text-cream/80">
                      {u().email}
                    </span>
                    <button
                      type="button"
                      onClick={async () => {
                        await authStore.logout();
                        navigate('/login', { replace: true });
                      }}
                      class="rounded-md border border-cream/20 px-2 py-1 text-xs text-cream/80 transition hover:border-ochre hover:text-ochre"
                    >
                      Déconnexion
                    </button>
                  </div>
                )}
              </Show>
            </div>
            <nav class="flex flex-wrap gap-x-3 gap-y-1 border-t border-moss-light/20 px-4 py-2 text-xs md:hidden">
              <For each={NAV}>
                {(item) => (
                  <A
                    href={item.href}
                    end={item.end}
                    class="rounded px-2 py-1 text-cream/75 hover:text-cream"
                    activeClass="bg-moss-light/25 text-cream"
                  >
                    {item.label}
                  </A>
                )}
              </For>
            </nav>
          </header>
          <main class="flex-1 px-4 py-6 md:px-8 md:py-8">{props.children}</main>
        </div>
      </div>
    </div>
  );
}
