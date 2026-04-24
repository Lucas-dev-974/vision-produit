import type { JSX } from 'solid-js';
import { splitProps } from 'solid-js';

type Variant = 'primary' | 'secondary' | 'ghost';

const variantClass: Record<Variant, string> = {
  primary:
    'bg-moss text-cream hover:bg-moss-light focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-moss',
  secondary:
    'bg-ochre text-cream hover:opacity-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ochre',
  ghost:
    'bg-transparent text-ink border border-cream-dark hover:bg-cream-dark/80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-moss',
};

export type ButtonProps = {
  variant?: Variant;
  class?: string;
  type?: 'button' | 'submit' | 'reset';
} & JSX.ButtonHTMLAttributes<HTMLButtonElement>;

export function Button(props: ButtonProps) {
  const [local, rest] = splitProps(props, ['variant', 'class', 'type', 'children']);
  const v = () => local.variant ?? 'primary';
  return (
    <button
      type={local.type ?? 'button'}
      class={`inline-flex items-center justify-center rounded-lg px-4 py-2.5 text-sm font-semibold transition disabled:opacity-50 disabled:pointer-events-none font-sans ${variantClass[v()]} ${local.class ?? ''}`}
      {...rest}
    >
      {local.children}
    </button>
  );
}
