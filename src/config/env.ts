const raw = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000/v1';
const apiBase = raw.replace(/\/$/, '');

function messagingWsUrlFromApiBase(base: string): string {
  const u = new URL(base);
  u.protocol = u.protocol === 'https:' ? 'wss:' : 'ws:';
  const path = u.pathname.replace(/\/$/, '');
  return `${u.origin}${path}/messaging/ws`;
}

export const env = {
  API_BASE_URL: apiBase,
  MESSAGING_WS_URL: messagingWsUrlFromApiBase(apiBase),
} as const;
