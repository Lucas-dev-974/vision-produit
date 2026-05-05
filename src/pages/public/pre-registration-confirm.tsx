import { A, useSearchParams } from '@solidjs/router';
import { createResource, Match, Switch } from 'solid-js';
import { Button } from '../../components/ui/button';
import { APP_NAME } from '../../config/constants';
import { preRegistrationService } from '../../services/pre-registration.service';
import type { ApiError } from '../../services/http-client';

export function PreRegistrationConfirm() {
  const [params] = useSearchParams();

  const tokenParam = (): string | null => {
    const t = params.token;
    if (Array.isArray(t)) return t[0] ?? null;
    return t ?? null;
  };

  const [result] = createResource(tokenParam, async (token) => {
    if (!token) {
      throw {
        status: 400,
        code: 'VALIDATION_ERROR',
        message: 'Lien de confirmation invalide.',
      } satisfies ApiError;
    }
    return preRegistrationService.confirm(token);
  });

  return (
    <div class="min-h-full bg-gradient-to-b from-cream to-cream-dark">
      <header class="mx-auto flex max-w-3xl items-center justify-between px-4 py-6">
        <A href="/" class="font-display text-xl font-semibold text-moss">
          {APP_NAME}
        </A>
      </header>

      <main class="mx-auto max-w-xl px-4 py-12">
        <Switch>
          <Match when={result.loading}>
            <div class="rounded-2xl border border-cream-dark bg-cream p-8 text-center">
              <p class="text-ink/70">Confirmation en cours…</p>
            </div>
          </Match>

          <Match when={result.error}>
            {(_) => {
              const err = result.error as ApiError | undefined;
              return (
                <div class="rounded-2xl border border-rust/30 bg-rust/5 p-8 text-center">
                  <h1 class="font-display text-2xl font-semibold text-ink">
                    Confirmation impossible
                  </h1>
                  <p class="mt-3 text-sm text-ink/75">
                    {err?.message ?? 'Le lien est invalide ou a expiré.'}
                  </p>
                  <p class="mt-2 text-xs text-ink/55">
                    Vous pouvez recommencer une pré-inscription, le lien précédent sera
                    remplacé.
                  </p>
                  <div class="mt-6 flex flex-wrap justify-center gap-3">
                    <A href="/pre-inscription">
                      <Button>Recommencer</Button>
                    </A>
                    <A href="/">
                      <Button variant="ghost">Retour à l'accueil</Button>
                    </A>
                  </div>
                </div>
              );
            }}
          </Match>

          <Match when={result()}>
            {(data) => (
              <div class="rounded-2xl border border-moss/30 bg-moss/5 p-8 text-center">
                <h1 class="font-display text-2xl font-semibold text-ink">
                  {data().alreadyConfirmed
                    ? 'Pré-inscription déjà confirmée'
                    : 'Pré-inscription confirmée'}
                </h1>
                <p class="mt-3 text-sm text-ink/80">
                  Merci ! Votre adresse{' '}
                  <span class="font-medium text-ink">{data().email}</span> est validée.
                </p>
                <p class="mt-2 text-sm text-ink/70">
                  Nous vous recontacterons dès l'ouverture de la plateforme pour activer
                  votre compte.
                </p>
                <div class="mt-6 flex justify-center">
                  <A href="/">
                    <Button>Retour à l'accueil</Button>
                  </A>
                </div>
              </div>
            )}
          </Match>
        </Switch>
      </main>
    </div>
  );
}
