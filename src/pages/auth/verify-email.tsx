import { A } from '@solidjs/router';

export function VerifyEmail() {
  return (
    <div class="mx-auto max-w-md px-4 py-20 text-center">
      <h1 class="font-display text-3xl font-semibold text-ink">Vérifiez votre e-mail</h1>
      <p class="mt-4 text-ink/75">
        Un lien de confirmation vous a été envoyé (implémentation e-mail à finaliser côté
        backend). Cliquez sur le lien pour activer votre compte, puis attendez la
        validation administrateur.
      </p>
      <p class="mt-8">
        <A href="/login" class="font-medium text-moss hover:underline">
          Retour à la connexion
        </A>
      </p>
    </div>
  );
}
