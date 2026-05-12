import { A } from '@solidjs/router';
import { Show, createSignal, onMount } from 'solid-js';
import { Button } from '../../components/ui/button';
import { SurveyModal } from '../../components/survey/survey-modal';
import { APP_NAME } from '../../config/constants';
import { env } from '../../config/env';
import { authStore } from '../../stores/auth.store';

/**
 * Landing de pré-lancement.
 *
 * - Tant que `VITE_APP_OPEN=false` : on présente la plateforme et on pousse
 *   uniquement la pré-inscription. Aucune connexion / inscription publique
 *   n'est mise en avant (un lien discret « Espace admin » reste accessible).
 * - Si `VITE_APP_OPEN=true` : on bascule vers les CTA Connexion / Inscription
 *   classiques.
 */
export function Landing() {
  const [surveyOpen, setSurveyOpen] = createSignal(false);

  onMount(() => {
    if (env.APP_OPEN) {
      void authStore.loadCurrentUser();
    }
  });

  return (
    <div class="min-h-full bg-gradient-to-b from-cream to-cream-dark">
      <header class="mx-auto flex max-w-6xl items-center justify-between px-4 py-6">
        <span class="font-display text-xl font-semibold text-moss">{APP_NAME}</span>
        <div class="flex flex-wrap items-center justify-end gap-3">
          <Show when={env.APP_OPEN}>
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
          </Show>
          <Show when={!env.APP_OPEN}>
            <A href="/pre-inscription">
              <Button>Je me pré-inscris</Button>
            </A>
          </Show>
        </div>
      </header>

      <main class="mx-auto max-w-6xl space-y-20 px-4 py-12">
        <section class="grid gap-12 md:grid-cols-2 md:items-center">
          <div class="space-y-6">
            <p class="inline-flex rounded-full bg-moss/10 px-3 py-1 text-xs font-mono uppercase tracking-wide text-moss">
              <Show when={!env.APP_OPEN} fallback={<span>Marché B2B — La Réunion (974)</span>}>
                <span>Bientôt disponible — La Réunion (974)</span>
              </Show>
            </p>
            <h1 class="font-display text-4xl font-semibold leading-tight text-ink md:text-5xl">
              Producteurs locaux et commerçants, réunis sans intermédiaire financier.
            </h1>
            <p class="max-w-xl text-lg text-ink/80">
              Catalogue, stocks, précommandes, messagerie et validation admin : tout pour
              sécuriser la mise en relation, en français et en conformité RGPD (hébergement
              UE).
            </p>
            <Show when={!env.APP_OPEN}>
              <p class="max-w-xl rounded-xl border border-moss/20 bg-moss/5 px-4 py-3 text-sm text-ink/80">
                La plateforme ouvre prochainement. Pré-inscrivez-vous pour être prévenu·e dès
                l'ouverture et accéder en priorité aux premières mises en relation.
              </p>
            </Show>
            <div class="flex flex-wrap gap-3">
              <Show when={!env.APP_OPEN}>
                <A href="/pre-inscription">
                  <Button>Je me pré-inscris</Button>
                </A>
                <Button
                  type="button"
                  variant="secondary"
                  class="shadow-md"
                  onClick={() => setSurveyOpen(true)}
                >
                  Questionnaire
                </Button>
                <A href="/cgu">
                  <Button variant="ghost">CGU</Button>
                </A>
              </Show>
              <Show when={env.APP_OPEN}>
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
                <Button
                  type="button"
                  variant="secondary"
                  class="shadow-md"
                  onClick={() => setSurveyOpen(true)}
                >
                  Questionnaire
                </Button>
                <A href="/cgu">
                  <Button variant="ghost">CGU (placeholder)</Button>
                </A>
              </Show>
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
        </section>

        <section class="space-y-8" aria-labelledby="comment-ca-marche">
          <h2 id="comment-ca-marche" class="font-display text-2xl font-semibold text-ink">
            Comment ça marche
          </h2>
          <ol class="grid gap-4 md:grid-cols-3">
            <li class="rounded-2xl border border-cream-dark bg-cream p-5 shadow-sm">
              <p class="font-mono text-xs uppercase tracking-wide text-moss">Étape 1</p>
              <p class="mt-2 font-display text-lg font-semibold text-ink">
                Pré-inscription
              </p>
              <p class="mt-2 text-sm text-ink/80">
                Quelques informations sur votre activité et votre e-mail professionnel.
              </p>
            </li>
            <li class="rounded-2xl border border-cream-dark bg-cream p-5 shadow-sm">
              <p class="font-mono text-xs uppercase tracking-wide text-moss">Étape 2</p>
              <p class="mt-2 font-display text-lg font-semibold text-ink">
                Confirmation e-mail
              </p>
              <p class="mt-2 text-sm text-ink/80">
                Vous recevez un lien à cliquer pour valider votre adresse e-mail.
              </p>
            </li>
            <li class="rounded-2xl border border-cream-dark bg-cream p-5 shadow-sm">
              <p class="font-mono text-xs uppercase tracking-wide text-moss">Étape 3</p>
              <p class="mt-2 font-display text-lg font-semibold text-ink">
                Accès anticipé
              </p>
              <p class="mt-2 text-sm text-ink/80">
                Dès l'ouverture, nous vous contactons pour activer votre compte.
              </p>
            </li>
          </ol>
        </section>

        <section class="space-y-6" aria-labelledby="faq">
          <h2 id="faq" class="font-display text-2xl font-semibold text-ink">
            Questions fréquentes
          </h2>
          <div class="grid gap-4 md:grid-cols-2">
            <details class="rounded-xl border border-cream-dark bg-cream p-4">
              <summary class="cursor-pointer font-medium text-ink">
                Quand la plateforme ouvre-t-elle ?
              </summary>
              <p class="mt-2 text-sm text-ink/75">
                Une ouverture progressive est prévue dans les prochains mois. Les
                personnes pré-inscrites sont contactées en priorité.
              </p>
            </details>
            <details class="rounded-xl border border-cream-dark bg-cream p-4">
              <summary class="cursor-pointer font-medium text-ink">
                Est-ce gratuit ?
              </summary>
              <p class="mt-2 text-sm text-ink/75">
                La pré-inscription est gratuite et sans engagement. La grille tarifaire
                de la V1 sera communiquée avant l'ouverture.
              </p>
            </details>
            <details class="rounded-xl border border-cream-dark bg-cream p-4">
              <summary class="cursor-pointer font-medium text-ink">
                Mes données sont-elles protégées ?
              </summary>
              <p class="mt-2 text-sm text-ink/75">
                Nous hébergeons vos informations dans l'Union européenne et appliquons
                le RGPD. Vous pouvez demander leur suppression à tout moment.
              </p>
            </details>
            <details class="rounded-xl border border-cream-dark bg-cream p-4">
              <summary class="cursor-pointer font-medium text-ink">
                Et si je ne suis pas encore décidé·e ?
              </summary>
              <p class="mt-2 text-sm text-ink/75">
                Le formulaire propose une option « je ne sais pas encore ». Vous pouvez
                vous pré-inscrire et préciser votre rôle plus tard.
              </p>
            </details>
          </div>
        </section>

        <section class="rounded-2xl border border-moss/20 bg-moss/5 px-6 py-10 text-center">
          <h2 class="font-display text-2xl font-semibold text-ink">
            Prêt·e à rejoindre les premiers utilisateurs ?
          </h2>
          <p class="mx-auto mt-2 max-w-xl text-sm text-ink/75">
            Laissez vos coordonnées en moins d'une minute, on s'occupe du reste.
          </p>
          <div class="mt-6 flex justify-center">
            <A href="/pre-inscription">
              <Button>Je me pré-inscris</Button>
            </A>
          </div>
        </section>
      </main>

      <footer class="border-t border-cream-dark/60 bg-cream/60">
        <div class="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-6 text-sm text-ink/60">
          <span>
            © {new Date().getFullYear()} {APP_NAME}
          </span>
          <div class="flex flex-wrap items-center gap-4">
            <A href="/cgu" class="hover:text-moss">
              CGU
            </A>
            <A href="/login" class="text-ink/40 hover:text-moss">
              Espace admin
            </A>
          </div>
        </div>
      </footer>

      <SurveyModal open={surveyOpen()} onClose={() => setSurveyOpen(false)} />
    </div>
  );
}
