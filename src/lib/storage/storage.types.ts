export type StorageKey =
  | 'user.preferences'
  | 'user.lastLocation'
  | 'user.searchRadius'
  | 'ui.sidebarCollapsed'
  | 'form.orderDraft'
  | 'onboarding.completed';

export interface StorageItem<T> {
  value: T;
  expiresAt?: number;
}
