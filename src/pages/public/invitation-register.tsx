import { A, useNavigate, useSearchParams } from '@solidjs/router';
import {
  Match,
  Show,
  Switch,
  createResource,
  createSignal,
} from 'solid-js';
import { Button } from '../../components/ui/button';
import { APP_NAME } from '../../config/constants';
import {
  invitationService,
  type InvitationPreview,
} from '../../services/admin.service';
import type { ApiError } from '../../services/http-client';

/**
 * Inscription accélérée via une invitation envoyée par un admin.
 *
 * Cette page reste accessible **même** quand `VITE_APP_OPEN=false` car
 * l'utilisateur a été explicitement invité ; l'API correspondante
 * (`/auth/register-with-invite`) n'est pas gardée par le `appAccessGate`.
 */
export function InvitationRegister() {
  const navigate = useNavigate();
  const [params] = useSearchParams();

  const tokenParam = (): string | null => {
    const t = params.token;
    if (Array.isArray(t)) return t[0] ?? null;
    return t ?? null;
  };

  const [preview] = createResource(tokenParam, async (token) => {
    if (!token) {
      throw {
        status: 400,
        code: 'VALIDATION_ERROR',
        message: 'Lien d\u2019invitation invalide.',
      } satisfies ApiError;
    }
    return invitationService.validate(token);
  });

  const [siret, setSiret] = createSignal('');
  const [password, setPassword] = createSignal('');
  const [role, setRole] = createSignal<'producer' | 'buyer'>('buyer');
  const [error, setError] = createSignal<string | null>(null);
  const [pending, setPending] = createSignal(false);

  // Préremplir le rôle dès que la preview est dispo (sauf 'undecided').
  function syncRoleFromPreview(p: InvitationPreview) {
    if (p.role === 'producer' || p.role === 'buyer') setRole(p.role);
  }

  const onSubmit = async (e: SubmitEvent) => {
    e.preventDefault();
    setError(null);

    const token = tokenParam();
    if (!token) return;

    const trimmedSiret = siret().replace(/\s/g, '');
    if (!/^\d{14}$/.test(trimmedSiret)) {
      setError('Le SIRET doit contenir 14 chiffres.');
      return;
    }
    if (password().length < 12) {
      setError('Le mot de passe doit contenir au moins 12 caractères.');
      return;
    }

    setPending(true);
    try {
      await invitationService.acceptRegistration({
        inviteToken: token,
        password: password(),
        siret: trimmedSiret,
        role: role(),
      });
      navigate('/login?just-registered=1', { replace: true });
    } catch (err) {
      const api = err as ApiError;
      setError(api.message ?? 'Création du compte impossible.');
    } finally {
      setPending(false);
    }
  };

  return (
    <div class="min-h-full bg-gradient-to-b from-cream to-cream-dark">
      <header class="mx-auto flex max-w-3xl items-center justify-between px-4 py-6">
        <A href="/" class="font-display text-xl font-semibold text-moss">
          {APP_NAME}
        </A>
        <A href="/" class="text-sm text-ink/60 hover:text-moss">
          Accueil
        </A>
      </header>

      <main class="mx-auto max-w-xl px-4 py-8">
        <Switch>
          <Match when={preview.loading}>
            <div class="rounded-2xl border border-cream-dark bg-cream p-8 text-center">
              <p class="text-ink/70">Validation du lien d'invitation…</p>
            </div>
          </Match>

          <Match when={preview.error}>
            <div class="rounded-2xl border border-rust/30 bg-rust/5 p-8 text-center">
              <h1 class="font-display text-2xl font-semibold text-ink">
                Invitation invalide
              </h1>
              <p class="mt-3 text-sm text-ink/75">
                {(preview.error as ApiError | undefined)?.message ??
                  'Le lien est invalide ou a expiré.'}
              </p>
              <div class="mt-6 flex justify-center">
                <A href="/pre-inscription">
                  <Button>Faire une pré-inscription</Button>
                </A>
              </div>
            </div>
          </Match>

          <Match when={preview()}>
            {(data) => {
              syncRoleFromPreview(data());
              return (
                <div class="rounded-2xl border border-moss/30 bg-cream p-6 shadow-sm sm:p-8">
                  <h1 class="font-display text-2xl font-semibold text-ink">
                    Créez votre compte
                  </h1>
                  <p class="mt-2 text-sm text-ink/70">
                    Bienvenue. Votre invitation pour{' '}
                    <span class="font-medium text-ink">{data().email}</span> a été
                    validée. Définissez votre mot de passe pour activer le compte.
                  </p>

                  <form class="mt-6 space-y-4" onSubmit={onSubmit} novalidate>
                    <div>
                      <label class="block text-sm font-medium text-ink" for="email">
                        E-mail (figé)
                      </label>
                      <input
                        id="email"
                        type="email"
                        value={data().email}
                        readOnly
                        class="mt-1 w-full cursor-not-allowed rounded-lg border border-cream-dark bg-cream-dark/30 px-3 py-2 text-ink/80"
                      />
                    </div>

                    <div>
                      <label class="block text-sm font-medium text-ink" for="role">
                        Vous êtes
                      </label>
                      <select
                        id="role"
                        class="mt-1 w-full rounded-lg border border-cream-dark bg-cream px-3 py-2 text-ink focus:border-moss focus:outline-none focus:ring-1 focus:ring-moss"
                        value={role()}
                        onChange={(e) =>
                          setRole(
                            e.currentTarget.value === 'producer' ? 'producer' : 'buyer',
                          )
                        }
                      >
                        <option value="buyer">Commerçant</option>
                        <option value="producer">Producteur</option>
                      </select>
                    </div>

                    <div>
                      <label class="block text-sm font-medium text-ink" for="siret">
                        SIRET (14 chiffres)
                      </label>
                      <input
                        id="siret"
                        inputMode="numeric"
                        maxlength={14}
                        required
                        class="mt-1 w-full rounded-lg border border-cream-dark bg-cream px-3 py-2 font-mono text-ink focus:border-moss focus:outline-none focus:ring-1 focus:ring-moss"
                        value={siret() || data().siret || ''}
                        onInput={(e) =>
                          setSiret(
                            e.currentTarget.value.replace(/\D/g, '').slice(0, 14),
                          )
                        }
                      />
                    </div>

                    <div>
                      <label class="block text-sm font-medium text-ink" for="password">
                        Mot de passe (min. 12 caractères)
                      </label>
                      <input
                        id="password"
                        type="password"
                        autocomplete="new-password"
                        minLength={12}
                        required
                        class="mt-1 w-full rounded-lg border border-cream-dark bg-cream px-3 py-2 text-ink focus:border-moss focus:outline-none focus:ring-1 focus:ring-moss"
                        value={password()}
                        onInput={(e) => setPassword(e.currentTarget.value)}
                      />
                    </div>

                    <Show when={error()}>
                      <p class="rounded-md bg-rust/10 px-3 py-2 text-sm text-rust" role="alert">
                        {error()}
                      </p>
                    </Show>

                    <Button type="submit" class="w-full" disabled={pending()}>
                      {pending() ? 'Création…' : 'Créer mon compte'}
                    </Button>
                  </form>
                </div>
              );
            }}
          </Match>
        </Switch>
      </main>
    </div>
  );
}
