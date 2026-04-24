export function Placeholder(props: { title: string; description?: string }) {
  return (
    <div class="rounded-2xl border border-cream-dark bg-cream p-8 shadow-sm">
      <h1 class="font-display text-2xl font-semibold text-ink">{props.title}</h1>
      <p class="mt-3 text-ink/75">
        {props.description ??
          'Écran en cours de développement — voir le dossier technique pour le périmètre V1.'}
      </p>
    </div>
  );
}
