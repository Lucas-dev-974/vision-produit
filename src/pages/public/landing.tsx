import { A } from '@solidjs/router';
import { For, Show, createResource, onMount } from 'solid-js';
import { Button } from '../../components/ui/button';
import { APP_NAME } from '../../config/constants';
import { publicService } from '../../services/public.service';
import { authStore } from '../../stores/auth.store';

export function Landing() {
  const [producers] = createResource(() => publicService.listProducers(1, 12));

  onMount(() => {
    void authStore.loadCurrentUser();
  });

  return (
    <div class="min-h-full bg-gradient-to-b from-cream to-cream-dark">
      <header class="mx-auto flex max-w-6xl items-center justify-between px-4 py-6">
        <span class="font-display text-xl font-semibold text-moss">{APP_NAME}</span>
        <div class="flex flex-wrap items-center justify-end gap-3">
          <Show when={authStore.isLoading()}>
            <span
              class="inline-block h-10 w-28 animate-pulse rounded-lg bg-cream-dark/50"
              aria-hidden
            />
          </Show>
          <Show when={!authStore.isLoading() && authStore.currentUser()}>
            <A href="/app">
              <Button>Ouvrir l'app</Button>
            </A>
            <Button variant="ghost" onClick={() => void authStore.logout()}>
              Déconnexion
            </Button>
          </Show>
          <Show when={!authStore.isLoading() && !authStore.currentUser()}>
            <A href="/login">
              <Button variant="ghost">Connexion</Button>
            </A>
            <A href="/register">
              <Button>Inscription</Button>
            </A>
          </Show>
        </div>
      </header>

      <main class="mx-auto max-w-6xl space-y-16 px-4 py-10">
        <div class="grid gap-12 md:grid-cols-2 md:items-center">
          <div class="space-y-6">
            <p class="inline-flex rounded-full bg-moss/10 px-3 py-1 text-xs font-mono uppercase tracking-wide text-moss">
              Marché B2B — La Réunion (974)
            </p>
            <h1 class="font-display text-4xl font-semibold leading-tight text-ink md:text-5xl">
              Producteurs locaux et commerçants, réunis sans intermédiaire financier.
            </h1>
            <p class="max-w-xl text-lg text-ink/80">
              Catalogue, stocks, précommandes, messagerie et validation admin : tout pour
              sécuriser la mise en relation, en français et en conformité RGPD (hébergement
              UE).
            </p>
            <div class="flex flex-wrap gap-3">
              <Show when={authStore.isLoading()}>
                <span
                  class="inline-block h-11 w-44 animate-pulse rounded-lg bg-cream-dark/50"
                  aria-hidden
                />
              </Show>
              <Show when={!authStore.isLoading() && authStore.currentUser()}>
                <A href="/app">
                  <Button>Ouvrir l'app</Button>
                </A>
              </Show>
              <Show when={!authStore.isLoading() && !authStore.currentUser()}>
                <A href="/register">
                  <Button>Créer un compte</Button>
                </A>
              </Show>
              <A href="/cgu">
                <Button variant="ghost">CGU (placeholder)</Button>
              </A>
            </div>
          </div>

          <div class="grid gap-4 rounded-2xl border border-cream-dark bg-cream p-6 shadow-sm">
            <div class="rounded-xl bg-moss/5 p-4">
              <p class="font-mono text-xs uppercase text-moss">Producteurs</p>
              <p class="mt-2 font-display text-2xl text-ink">Catalogue &amp; stocks temps réel</p>
              <p class="mt-1 text-sm text-ink/75">
                Géolocalisation floutée, profil vérifié SIRET via INSEE.
              </p>
            </div>
            <div class="rounded-xl bg-ochre/10 p-4">
              <p class="font-mono text-xs uppercase text-ochre">Commerçants</p>
              <p class="mt-2 font-display text-2xl text-ink">Carte, filtres, précommandes</p>
              <p class="mt-1 text-sm text-ink/75">
                Recherche par distance et catégorie, sans paiement intégré en V1.
              </p>
            </div>
          </div>
        </div>

        <section class="space-y-6" aria-labelledby="producteurs-heading">
          <div class="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 id="producteurs-heading" class="font-display text-2xl font-semibold text-ink">
                Producteurs sur l’île
              </h2>
              <p class="mt-1 text-sm text-ink/70">
                Aperçu public — inscrivez-vous pour précommander et accéder au détail complet.
              </p>
            </div>
            <Show when={producers.latest}>
              {(res) => (
                <p class="font-mono text-xs text-ink/60">
                  {res().pagination.total} profil{res().pagination.total > 1 ? 's' : ''}
                </p>
              )}
            </Show>
          </div>

          <Show when={producers.loading}>
            <p class="rounded-xl border border-cream-dark bg-cream px-4 py-8 text-center text-ink/70">
              Chargement des producteurs…
            </p>
          </Show>

          <Show when={producers.error}>
            <p
              class="rounded-xl border border-rust/30 bg-rust/5 px-4 py-6 text-center text-rust"
              role="alert"
            >
              Impossible de charger la liste des producteurs. Vérifiez que l’API est démarrée.
            </p>
          </Show>

          <Show when={producers.latest}>
            {(res) => (
              <ul class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <For each={res().items}>
                  {(p) => (
                    <li class="flex flex-col rounded-2xl border border-cream-dark bg-cream p-5 shadow-sm transition hover:border-moss/30">
                      <p class="font-display text-lg font-semibold text-ink">
                        {p.companyName ?? 'Producteur'}
                      </p>
                      <p class="mt-1 text-sm text-ink/65">
                        {[p.city, p.postalCode].filter(Boolean).join(' · ') || 'La Réunion'}
                      </p>
                      <p class="mt-3 line-clamp-3 flex-1 text-sm text-ink/80">
                        {p.description ?? '—'}
                      </p>
                      <div class="mt-4 flex flex-wrap items-center gap-3 border-t border-cream-dark pt-4 font-mono text-xs text-ink/70">
                        <span>
                          ★ {p.averageRating.toFixed(1)} ({p.totalRatings} avis)
                        </span>
                        <span>{p.reliabilityScore.toFixed(0)}% fiabilité</span>
                      </div>
                      <p class="mt-3 text-xs text-ink/50">
                        Localisation approximative (±500 m) — connexion requise pour en savoir
                        plus.
                      </p>
                    </li>
                  )}
                </For>
              </ul>
            )}
          </Show>
        </section>
      </main>
    </div>
  );
}
