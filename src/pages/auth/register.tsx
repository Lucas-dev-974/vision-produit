import { createSignal } from 'solid-js';
import { A, useNavigate } from '@solidjs/router';
import { Button } from '../../components/ui/button';
import { authService } from '../../services/auth.service';
import type { ApiError } from '../../services/http-client';

export function Register() {
  const navigate = useNavigate();
  const [email, setEmail] = createSignal('');
  const [password, setPassword] = createSignal('');
  const [siret, setSiret] = createSignal('');
  const [role, setRole] = createSignal<'producer' | 'buyer'>('buyer');
  const [error, setError] = createSignal<string | null>(null);
  const [pending, setPending] = createSignal(false);

  const onSubmit = async (e: SubmitEvent) => {
    e.preventDefault();
    setError(null);
    setPending(true);
    try {
      await authService.register({
        email: email(),
        password: password(),
        siret: siret().replace(/\s/g, ''),
        role: role(),
      });

      // Demande au navigateur d'enregistrer le nouveau couple email/mot de passe.
      if ('credentials' in navigator && 'PasswordCredential' in window) {
        try {
          const cred = new (window as unknown as {
            PasswordCredential: new (init: {
              id: string;
              password: string;
              name?: string;
            }) => Credential;
          }).PasswordCredential({ id: email(), password: password(), name: email() });
          await navigator.credentials.store(cred);
        } catch {
          // Navigateurs sans support : on ignore silencieusement.
        }
      }

      navigate('/verify-email', { replace: true });
    } catch (err) {
      const api = err as ApiError;
      setError(api.message ?? 'Inscription impossible');
    } finally {
      setPending(false);
    }
  };

  return (
    <div class="mx-auto flex min-h-full max-w-md flex-col justify-center px-4 py-16">
      <h1 class="font-display text-3xl font-semibold text-ink">Inscription</h1>
      <p class="mt-2 text-sm text-ink/70">
        Déjà inscrit ?{' '}
        <A href="/login" class="font-medium text-moss hover:underline">
          Connexion
        </A>
      </p>

      <form
        class="mt-8 space-y-4"
        method="post"
        action="/register"
        onSubmit={onSubmit}
      >
        <div>
          <label class="block text-sm font-medium text-ink" for="role">
            Vous êtes
          </label>
          <select
            id="role"
            name="role"
            class="mt-1 w-full rounded-lg border border-cream-dark bg-cream px-3 py-2 text-ink shadow-sm focus:border-moss focus:outline-none focus:ring-1 focus:ring-moss"
            value={role()}
            onChange={(e) =>
              setRole(e.currentTarget.value === 'producer' ? 'producer' : 'buyer')
            }
          >
            <option value="buyer">Commerçant (restaurant, primeur, épicerie…)</option>
            <option value="producer">Producteur agricole</option>
          </select>
        </div>

        <div>
          <label class="block text-sm font-medium text-ink" for="siret">
            SIRET (14 chiffres)
          </label>
          <input
            id="siret"
            name="siret"
            inputMode="numeric"
            pattern="\d{14}"
            maxlength={14}
            required
            class="mt-1 w-full rounded-lg border border-cream-dark bg-cream px-3 py-2 font-mono text-ink shadow-sm focus:border-moss focus:outline-none focus:ring-1 focus:ring-moss"
            value={siret()}
            onInput={(e) => setSiret(e.currentTarget.value.replace(/\D/g, '').slice(0, 14))}
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-ink" for="email">
            E-mail professionnel
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
            Mot de passe (min. 12 caractères)
          </label>
          <input
            id="password"
            name="password"
            type="password"
            autocomplete="new-password"
            minLength={12}
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
          {pending() ? 'Envoi…' : 'Créer mon compte'}
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
