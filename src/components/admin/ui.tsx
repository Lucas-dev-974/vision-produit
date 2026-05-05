import type { JSX } from 'solid-js';
import { Show } from 'solid-js';

/** Carte sombre standard pour les sections admin. */
export function AdminCard(props: {
  title?: string;
  hint?: string;
  actions?: JSX.Element;
  children: JSX.Element;
  class?: string;
}) {
  return (
    <section
      class={`rounded-2xl border border-moss-light/20 bg-ink/60 p-5 shadow-sm ${props.class ?? ''}`}
    >
      <Show when={props.title || props.actions}>
        <header class="mb-4 flex flex-wrap items-start justify-between gap-2">
          <div>
            <Show when={props.title}>
              <h2 class="font-display text-lg font-semibold text-cream">
                {props.title}
              </h2>
            </Show>
            <Show when={props.hint}>
              <p class="mt-0.5 text-xs text-cream/55">{props.hint}</p>
            </Show>
          </div>
          <Show when={props.actions}>
            <div class="flex flex-wrap items-center gap-2">{props.actions}</div>
          </Show>
        </header>
      </Show>
      {props.children}
    </section>
  );
}

/** Mini-carte de statistique cliquable. */
export function StatCard(props: {
  label: string;
  value: string | number;
  hint?: string;
  href?: string;
  tone?: 'default' | 'warning' | 'success' | 'danger';
}) {
  const tones: Record<NonNullable<typeof props.tone>, string> = {
    default: 'border-moss-light/25 bg-ink/60',
    warning: 'border-ochre/40 bg-ochre/10',
    success: 'border-moss/40 bg-moss/10',
    danger: 'border-rust/40 bg-rust/10',
  };
  const cls = `block rounded-xl border p-4 transition hover:border-cream/40 ${tones[props.tone ?? 'default']}`;

  const inner = (
    <>
      <p class="font-mono text-[11px] uppercase tracking-wider text-cream/55">
        {props.label}
      </p>
      <p class="mt-2 font-display text-3xl font-semibold text-cream">{props.value}</p>
      <Show when={props.hint}>
        <p class="mt-1 text-xs text-cream/55">{props.hint}</p>
      </Show>
    </>
  );

  if (props.href) {
    return (
      <a href={props.href} class={cls}>
        {inner}
      </a>
    );
  }
  return <div class={cls}>{inner}</div>;
}

const BADGE_TONES: Record<string, string> = {
  active: 'bg-moss/20 text-moss-light',
  pending_admin: 'bg-ochre/20 text-ochre',
  pending_email: 'bg-cream/15 text-cream/80',
  suspended: 'bg-rust/20 text-rust',
  deleted: 'bg-cream/10 text-cream/50',
  pending_review: 'bg-cream/15 text-cream/80',
  contacted: 'bg-moss-light/30 text-cream',
  invited: 'bg-ochre/25 text-ochre',
  approved: 'bg-moss/25 text-moss-light',
  rejected: 'bg-rust/25 text-rust',
  open: 'bg-rust/25 text-rust',
  reviewed: 'bg-ochre/25 text-ochre',
  resolved: 'bg-moss/25 text-moss-light',
  dismissed: 'bg-cream/10 text-cream/60',
  producer: 'bg-moss/25 text-moss-light',
  buyer: 'bg-ochre/25 text-ochre',
  admin: 'bg-rust/25 text-rust',
  undecided: 'bg-cream/15 text-cream/75',
};

export function StatusBadge(props: { value: string }) {
  const tone = BADGE_TONES[props.value] ?? 'bg-cream/15 text-cream/80';
  return (
    <span
      class={`inline-flex items-center rounded-full px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider ${tone}`}
    >
      {props.value}
    </span>
  );
}

/** Pagination simple page précédente / suivante. */
export function Pagination(props: {
  page: number;
  pageSize: number;
  total: number;
  onChange: (next: number) => void;
}) {
  const totalPages = () => Math.max(1, Math.ceil(props.total / props.pageSize));
  return (
    <div class="mt-4 flex items-center justify-between text-xs text-cream/65">
      <span>
        Page {props.page} / {totalPages()} — {props.total} élément
        {props.total > 1 ? 's' : ''}
      </span>
      <div class="flex gap-2">
        <button
          type="button"
          class="rounded border border-cream/20 px-2 py-1 hover:border-cream/50 disabled:opacity-40"
          disabled={props.page <= 1}
          onClick={() => props.onChange(Math.max(1, props.page - 1))}
        >
          ← Précédent
        </button>
        <button
          type="button"
          class="rounded border border-cream/20 px-2 py-1 hover:border-cream/50 disabled:opacity-40"
          disabled={props.page >= totalPages()}
          onClick={() => props.onChange(Math.min(totalPages(), props.page + 1))}
        >
          Suivant →
        </button>
      </div>
    </div>
  );
}

/** État vide stylé. */
export function EmptyState(props: { title: string; hint?: string }) {
  return (
    <div class="rounded-xl border border-dashed border-cream/15 px-6 py-12 text-center">
      <p class="font-display text-lg text-cream/80">{props.title}</p>
      <Show when={props.hint}>
        <p class="mt-2 text-sm text-cream/55">{props.hint}</p>
      </Show>
    </div>
  );
}

/** Bouton pill admin (dark theme). */
export function AdminButton(
  props: {
    children: JSX.Element;
    onClick?: (e: MouseEvent) => void | Promise<void>;
    type?: 'button' | 'submit';
    variant?: 'primary' | 'ghost' | 'danger';
    disabled?: boolean;
    class?: string;
  },
) {
  const variants = {
    primary:
      'bg-moss text-cream hover:bg-moss-light focus-visible:outline-moss',
    ghost:
      'border border-cream/20 bg-transparent text-cream hover:border-cream/50 focus-visible:outline-cream',
    danger:
      'bg-rust/80 text-cream hover:bg-rust focus-visible:outline-rust',
  } as const;
  const variant = () => props.variant ?? 'primary';
  return (
    <button
      type={props.type ?? 'button'}
      disabled={props.disabled}
      onClick={(e) => {
        if (props.onClick) void props.onClick(e);
      }}
      class={`inline-flex items-center justify-center rounded-md px-3 py-1.5 text-xs font-semibold transition disabled:opacity-50 disabled:pointer-events-none ${variants[variant()]} ${props.class ?? ''}`}
    >
      {props.children}
    </button>
  );
}
