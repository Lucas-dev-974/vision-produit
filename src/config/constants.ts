/**
 * Nom commercial de l'application, partagé par tout le frontend.
 * Pilotable via la variable d'environnement Vite `VITE_APP_NAME` (build-time).
 * Fallback codé en dur pour les contextes où l'env n'est pas chargée
 * (tests unitaires, etc.).
 */
export const APP_NAME: string =
  (import.meta.env.VITE_APP_NAME as string | undefined)?.trim() || 'MonAppli';

export const DEFAULT_SEARCH_RADIUS_KM = 25;
