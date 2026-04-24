/**
 * Notifications système via l’API Notification du navigateur.
 * - Android (Chrome) : PWA installée ou onglet ; permission utilisateur.
 * - iOS : Web Push / notifications limitées ; iOS 16.4+ peut notifier une PWA ajoutée à l’écran d’accueil si l’utilisateur autorise le site.
 * Pas de serveur push dans cette version : uniquement affichage quand l’app est ouverte ou en arrière-plan avec polling.
 */

export type NotificationSupport = 'granted' | 'denied' | 'default' | 'unsupported';

export function getNotificationState(): NotificationSupport {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'unsupported';
  }
  return Notification.permission as NotificationSupport;
}

/** À appeler après un geste utilisateur si vous souhaitez demander la permission explicitement. */
export async function requestSystemNotificationPermission(): Promise<boolean> {
  if (getNotificationState() === 'unsupported') return false;
  if (Notification.permission === 'granted') return true;
  if (Notification.permission === 'denied') return false;
  const p = await Notification.requestPermission();
  return p === 'granted';
}

export function notifyInboxActivity(kind: 'message' | 'order'): void {
  if (typeof window === 'undefined' || Notification.permission !== 'granted') return;
  try {
    if (kind === 'message') {
      new Notification('MonAppli — Messagerie', {
        body: 'Nouveau message',
        icon: '/pwa-192.png',
        badge: '/pwa-192.png',
        tag: 'monappli-message',
      });
    } else {
      new Notification('MonAppli — Commandes', {
        body: 'Mise à jour sur une commande',
        icon: '/pwa-192.png',
        badge: '/pwa-192.png',
        tag: 'monappli-order',
      });
    }
  } catch {
    /* Safari / contextes restreints */
  }
}
