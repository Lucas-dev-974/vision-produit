import { createSignal, Show } from 'solid-js';
import { A } from '@solidjs/router';
import { Button } from '../../components/ui/button';
import { APP_NAME } from '../../config/constants';
import {
  preRegistrationService,
  type PreRegistrationRole,
} from '../../services/pre-registration.service';
import type { ApiError } from '../../services/http-client';

export function PreRegistration() {
  const [email, setEmail] = createSignal('');
  const [role, setRole] = createSignal<PreRegistrationRole>('buyer');
  const [companyName, setCompanyName] = createSignal('');
  const [siret, setSiret] = createSignal('');
  const [phone, setPhone] = createSignal('');
  const [city, setCity] = createSignal('');
  const [postalCode, setPostalCode] = createSignal('');
  const [message, setMessage] = createSignal('');
  const [consent, setConsent] = createSignal(false);

  const [error, setError] = createSignal<string | null>(null);
  const [pending, setPending] = createSignal(false);
  const [submittedEmail, setSubmittedEmail] = createSignal<string | null>(null);

  const onSubmit = async (e: SubmitEvent) => {
    e.preventDefault();
    setError(null);

    if (!consent()) {
      setError('Vous devez accepter le traitement de vos données pour vous pré-inscrire.');
      return;
    }
    const trimmedSiret = siret().replace(/\s/g, '');
    if (trimmedSiret && !/^\d{14}$/.test(trimmedSiret)) {
      setError('Le SIRET doit contenir 14 chiffres.');
      return;
    }

    setPending(true);
    try {
      await preRegistrationService.create({
        email: email().trim(),
        role: role(),
        companyName: companyName().trim() || undefined,
        siret: trimmedSiret || undefined,
        phone: phone().trim() || undefined,
        city: city().trim() || undefined,
        postalCode: postalCode().trim() || undefined,
        message: message().trim() || undefined,
        source: 'landing',
        consentRgpd: true,
      });
      setSubmittedEmail(email().trim());
    } catch (err) {
      const api = err as ApiError;
      setError(api.message ?? 'Pré-inscription impossible. Réessayez plus tard.');
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
          Retour à l'accueil
        </A>
      </header>

      <main class="mx-auto max-w-2xl px-4 py-8">
        <Show
          when={!submittedEmail()}
          fallback={
            <ConfirmationSent
              email={submittedEmail() as string}
              onResend={async () => {
                try {
                  await preRegistrationService.resend(submittedEmail() as string);
                } catch {
                  // Silencieux : la réponse côté serveur est déjà neutre.
                }
              }}
            />
          }
        >
          <h1 class="font-display text-3xl font-semibold text-ink">
            Pré-inscription
          </h1>
          <p class="mt-2 text-sm text-ink/70">
            La plateforme n'est pas encore ouverte au public. Laissez vos coordonnées :
            vous recevrez un e-mail de confirmation, puis nous vous contacterons à
            l'ouverture.
          </p>

          <form class="mt-8 space-y-5" onSubmit={onSubmit} novalidate>
            <fieldset class="space-y-2">
              <legend class="text-sm font-medium text-ink">Vous êtes</legend>
              <div class="grid gap-2 sm:grid-cols-3">
                <RadioCard
                  name="role"
                  value="buyer"
                  selected={role() === 'buyer'}
                  onSelect={() => setRole('buyer')}
                  label="Commerçant"
                  hint="Restaurant, primeur, épicerie…"
                />
                <RadioCard
                  name="role"
                  value="producer"
                  selected={role() === 'producer'}
                  onSelect={() => setRole('producer')}
                  label="Producteur"
                  hint="Maraîchage, élevage, etc."
                />
                <RadioCard
                  name="role"
                  value="undecided"
                  selected={role() === 'undecided'}
                  onSelect={() => setRole('undecided')}
                  label="Pas encore décidé·e"
                  hint="On en discutera ensemble."
                />
              </div>
            </fieldset>

            <Field label="E-mail professionnel" htmlFor="email" required>
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
            </Field>

            <Field label="Nom de l'entreprise" htmlFor="companyName">
              <input
                id="companyName"
                name="companyName"
                type="text"
                autocomplete="organization"
                maxlength={255}
                class="mt-1 w-full rounded-lg border border-cream-dark bg-cream px-3 py-2 text-ink shadow-sm focus:border-moss focus:outline-none focus:ring-1 focus:ring-moss"
                value={companyName()}
                onInput={(e) => setCompanyName(e.currentTarget.value)}
              />
            </Field>

            <Field
              label="SIRET (optionnel, 14 chiffres)"
              htmlFor="siret"
              hint="Nous vérifierons votre activité auprès de l'INSEE à l'ouverture."
            >
              <input
                id="siret"
                name="siret"
                inputMode="numeric"
                pattern="\d{14}"
                maxlength={14}
                class="mt-1 w-full rounded-lg border border-cream-dark bg-cream px-3 py-2 font-mono text-ink shadow-sm focus:border-moss focus:outline-none focus:ring-1 focus:ring-moss"
                value={siret()}
                onInput={(e) => setSiret(e.currentTarget.value.replace(/\D/g, '').slice(0, 14))}
              />
            </Field>

            <div class="grid gap-4 sm:grid-cols-2">
              <Field label="Ville" htmlFor="city">
                <input
                  id="city"
                  name="city"
                  type="text"
                  maxlength={100}
                  autocomplete="address-level2"
                  class="mt-1 w-full rounded-lg border border-cream-dark bg-cream px-3 py-2 text-ink shadow-sm focus:border-moss focus:outline-none focus:ring-1 focus:ring-moss"
                  value={city()}
                  onInput={(e) => setCity(e.currentTarget.value)}
                />
              </Field>
              <Field label="Code postal" htmlFor="postalCode">
                <input
                  id="postalCode"
                  name="postalCode"
                  type="text"
                  inputMode="numeric"
                  maxlength={10}
                  autocomplete="postal-code"
                  class="mt-1 w-full rounded-lg border border-cream-dark bg-cream px-3 py-2 text-ink shadow-sm focus:border-moss focus:outline-none focus:ring-1 focus:ring-moss"
                  value={postalCode()}
                  onInput={(e) => setPostalCode(e.currentTarget.value)}
                />
              </Field>
            </div>

            <Field label="Téléphone (optionnel)" htmlFor="phone">
              <input
                id="phone"
                name="phone"
                type="tel"
                maxlength={20}
                autocomplete="tel"
                class="mt-1 w-full rounded-lg border border-cream-dark bg-cream px-3 py-2 text-ink shadow-sm focus:border-moss focus:outline-none focus:ring-1 focus:ring-moss"
                value={phone()}
                onInput={(e) => setPhone(e.currentTarget.value)}
              />
            </Field>

            <Field label="Message (optionnel)" htmlFor="message">
              <textarea
                id="message"
                name="message"
                rows={4}
                maxlength={2000}
                class="mt-1 w-full rounded-lg border border-cream-dark bg-cream px-3 py-2 text-ink shadow-sm focus:border-moss focus:outline-none focus:ring-1 focus:ring-moss"
                value={message()}
                onInput={(e) => setMessage(e.currentTarget.value)}
              />
            </Field>

            <label class="flex items-start gap-3 rounded-xl border border-cream-dark bg-cream p-3">
              <input
                type="checkbox"
                class="mt-1 h-4 w-4 rounded border-cream-dark text-moss focus:ring-moss"
                checked={consent()}
                onChange={(e) => setConsent(e.currentTarget.checked)}
                required
              />
              <span class="text-sm text-ink/80">
                J'accepte que mes informations soient utilisées par {APP_NAME} pour me
                tenir informé·e de l'ouverture de la plateforme. Je peux demander leur
                suppression à tout moment ({' '}
                <A href="/cgu" class="font-medium text-moss hover:underline">
                  voir CGU
                </A>{' '}
                ).
              </span>
            </label>

            <Show when={error()}>
              <p class="rounded-md bg-rust/10 px-3 py-2 text-sm text-rust" role="alert">
                {error()}
              </p>
            </Show>

            <Button type="submit" class="w-full" disabled={pending()}>
              {pending() ? 'Envoi…' : 'Je me pré-inscris'}
            </Button>
          </form>

          <p class="mt-6 text-center text-xs text-ink/50">
            En soumettant ce formulaire vous acceptez de recevoir un e-mail de
            confirmation à l'adresse renseignée.
          </p>
        </Show>
      </main>
    </div>
  );
}

function Field(props: {
  label: string;
  htmlFor: string;
  required?: boolean;
  hint?: string;
  children: any;
}) {
  return (
    <div>
      <label class="block text-sm font-medium text-ink" for={props.htmlFor}>
        {props.label}
        {props.required ? <span class="ml-1 text-rust">*</span> : null}
      </label>
      {props.children}
      {props.hint ? <p class="mt-1 text-xs text-ink/55">{props.hint}</p> : null}
    </div>
  );
}

function RadioCard(props: {
  name: string;
  value: string;
  selected: boolean;
  onSelect: () => void;
  label: string;
  hint: string;
}) {
  return (
    <label
      class={`flex cursor-pointer flex-col rounded-xl border p-3 text-left transition ${
        props.selected
          ? 'border-moss bg-moss/5 ring-1 ring-moss'
          : 'border-cream-dark bg-cream hover:border-moss/40'
      }`}
    >
      <input
        type="radio"
        name={props.name}
        value={props.value}
        checked={props.selected}
        onChange={() => props.onSelect()}
        class="sr-only"
      />
      <span class="font-medium text-ink">{props.label}</span>
      <span class="mt-1 text-xs text-ink/60">{props.hint}</span>
    </label>
  );
}

function ConfirmationSent(props: { email: string; onResend: () => Promise<void> }) {
  const [resending, setResending] = createSignal(false);
  const [resent, setResent] = createSignal(false);

  return (
    <div class="rounded-2xl border border-moss/30 bg-moss/5 p-8 text-center">
      <h1 class="font-display text-2xl font-semibold text-ink">
        Vérifiez votre boîte e-mail
      </h1>
      <p class="mt-3 text-sm text-ink/80">
        Nous venons d'envoyer un lien de confirmation à{' '}
        <span class="font-medium text-ink">{props.email}</span>. Cliquez sur ce lien pour
        valider votre pré-inscription.
      </p>
      <p class="mt-2 text-xs text-ink/55">
        Pensez à vérifier vos courriers indésirables. Le lien est valide 7 jours.
      </p>

      <div class="mt-6 flex flex-wrap justify-center gap-3">
        <Button
          variant="ghost"
          disabled={resending() || resent()}
          onClick={async () => {
            setResending(true);
            await props.onResend();
            setResending(false);
            setResent(true);
          }}
        >
          {resent() ? 'Lien renvoyé' : resending() ? 'Envoi…' : 'Renvoyer l\u2019e-mail'}
        </Button>
        <A href="/">
          <Button>Retour à l'accueil</Button>
        </A>
      </div>
    </div>
  );
}
