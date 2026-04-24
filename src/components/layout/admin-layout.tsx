import { A } from '@solidjs/router';
import type { RouteSectionProps } from '@solidjs/router';

export function AdminLayout(props: RouteSectionProps) {
  return (
    <div class="min-h-full bg-ink text-cream">
      <header class="border-b border-moss-light/40">
        <div class="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <span class="font-display text-lg font-semibold">Administration</span>
          <nav class="flex gap-4 text-sm">
            <A href="/admin" class="hover:text-ochre" end activeClass="text-ochre">
              Vue d'ensemble
            </A>
          </nav>
        </div>
      </header>
      <main class="mx-auto max-w-6xl px-4 py-8">{props.children}</main>
    </div>
  );
}
