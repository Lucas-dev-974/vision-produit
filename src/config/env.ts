const raw = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000/v1';
const apiBase = raw.replace(/\/$/, '');

function messagingWsUrlFromApiBase(base: string): string {
  const u = new URL(base);
  u.protocol = u.protocol === 'https:' ? 'wss:' : 'ws:';
  const path = u.pathname.replace(/\/$/, '');
  return `${u.origin}${path}/messaging/ws`;
}

/**
 * `VITE_APP_OPEN=true` ouvre la plateforme au grand public (login/register/app).
 * Tout autre valeur (incluant l'absence) garde la phase de pré-lancement :
 * la landing présente la plateforme et un formulaire de pré-inscription.
 */
const appOpen = String(import.meta.env.VITE_APP_OPEN ?? 'false').toLowerCase() === 'true';

export const env = {
  API_BASE_URL: apiBase,
  MESSAGING_WS_URL: messagingWsUrlFromApiBase(apiBase),
  APP_OPEN: appOpen,
} as const;
