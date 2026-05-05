import { Navigate } from '@solidjs/router';
import type { JSX } from 'solid-js';
import { Show } from 'solid-js';
import { env } from '../../config/env';

/**
 * Bloque l'accès aux pages publiques d'inscription tant que la phase de
 * pré-lancement est active (`VITE_APP_OPEN=false`). Les visiteurs sont
 * redirigés vers la page de pré-inscription.
 *
 * `/login` reste accessible pour permettre aux comptes admin de se connecter.
 */
export function PublicAuthGate(props: { children: JSX.Element }) {
  return (
    <Show when={env.APP_OPEN} fallback={<Navigate href="/pre-inscription" />}>
      {props.children}
    </Show>
  );
}
