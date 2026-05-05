import { createSignal, Show } from 'solid-js';
import { A, useNavigate } from '@solidjs/router';
import { Button } from '../../components/ui/button';
import { authStore } from '../../stores/auth.store';
import { env } from '../../config/env';
import type { ApiError } from '../../services/http-client';

export function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = createSignal('');
  const [password, setPassword] = createSignal('');
  const [error, setError] = createSignal<string | null>(null);
  const [pending, setPending] = createSignal(false);

  const onSubmit = async (e: SubmitEvent) => {
    e.preventDefault();
    setError(null);
    setPending(true);
    try {
      await authStore.login(email(), password());

      // Propose au navigateur d'enregistrer les identifiants (Credential Management API).
      // Indispensable dans une SPA car la navigation client-side ne déclenche pas
      // l'heuristique native "form submission successful".
      if ('credentials' in navigator && 'PasswordCredential' in window) {
        try {
          const cred = new (window as unknown as {
            PasswordCredential: new (form: HTMLFormElement) => Credential;
          }).PasswordCredential(e.target as HTMLFormElement);
          await navigator.credentials.store(cred);
        } catch {
          // Firefox/Safari n'implémentent pas encore PasswordCredential : on ignore.
        }
      }

      navigate('/app/dashboard', { replace: true });
    } catch (err) {
      const api = err as ApiError;
      setError(api.message ?? 'Connexion impossible');
    } finally {
      setPending(false);
    }
  };

  return (
    <div class="mx-auto flex min-h-full max-w-md flex-col justify-center px-4 py-16">
      <h1 class="font-display text-3xl font-semibold text-ink">Connexion</h1>
      <Show
        when={env.APP_OPEN}
        fallback={
          <p class="mt-2 text-sm text-ink/70">
            La plateforme n'est pas encore ouverte au public.{' '}
            <A href="/pre-inscription" class="font-medium text-moss hover:underline">
              Pré-inscrivez-vous
            </A>{' '}
            pour être prévenu·e à l'ouverture.
          </p>
        }
      >
        <p class="mt-2 text-sm text-ink/70">
          Pas encore de compte ?{' '}
          <A href="/register" class="font-medium text-moss hover:underline">
            Inscription
          </A>
        </p>
      </Show>

      <form
        class="mt-8 space-y-4"
        method="post"
        action="/login"
        onSubmit={onSubmit}
      >
        <div>
          <label class="block text-sm font-medium text-ink" for="email">
            E-mail
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autocomplete="email"
            required
            class="mt-1 w-full rounded-lg border border-cream-dark bg-cream px-3 py-2 text-ink shadow-sm focus:border-moss focus:outline-none focus:ring-1 focus:ring-moss"
            value={email()}
            onInput={(e) => setEmail(e.currentTarget.value)}
          />
        </div>
        <div>
          <label class="block text-sm font-medium text-ink" for="password">
            Mot de passe
          </label>
          <input
            id="password"
            name="password"
            type="password"
            autocomplete="current-password"
            required
            class="mt-1 w-full rounded-lg border border-cream-dark bg-cream px-3 py-2 text-ink shadow-sm focus:border-moss focus:outline-none focus:ring-1 focus:ring-moss"
            value={password()}
            onInput={(e) => setPassword(e.currentTarget.value)}
          />
        </div>

        {error() && (
          <p class="rounded-md bg-rust/10 px-3 py-2 text-sm text-rust" role="alert">
            {error()}
          </p>
        )}

        <Button type="submit" class="w-full" disabled={pending()}>
          {pending() ? 'Connexion…' : 'Se connecter'}
        </Button>
      </form>

      <p class="mt-6 text-center text-sm text-ink/60">
        <A href="/" class="hover:text-moss">
          Retour à l’accueil
        </A>
      </p>
    </div>
  );
}
