import type { StorageItem, StorageKey } from './storage.types';

const NAMESPACE = 'monappli.';

class Storage {
  private isAvailable(): boolean {
    try {
      localStorage.setItem('__t', '1');
      localStorage.removeItem('__t');
      return true;
    } catch {
      return false;
    }
  }

  get<T>(key: StorageKey): T | null {
    if (!this.isAvailable()) return null;
    try {
      const raw = localStorage.getItem(NAMESPACE + key);
      if (!raw) return null;
      const item: StorageItem<T> = JSON.parse(raw) as StorageItem<T>;
      if (item.expiresAt && Date.now() > item.expiresAt) {
        this.remove(key);
        return null;
      }
      return item.value;
    } catch (e) {
      console.error(`Storage.get(${key})`, e);
      return null;
    }
  }

  set<T>(key: StorageKey, value: T, ttlMs?: number): boolean {
    if (!this.isAvailable()) return false;
    try {
      const item: StorageItem<T> = {
        value,
        expiresAt: ttlMs ? Date.now() + ttlMs : undefined,
      };
      localStorage.setItem(NAMESPACE + key, JSON.stringify(item));
      return true;
    } catch (e) {
      console.error(`Storage.set(${key})`, e);
      return false;
    }
  }

  remove(key: StorageKey): void {
    if (!this.isAvailable()) return;
    localStorage.removeItem(NAMESPACE + key);
  }

  clear(): void {
    if (!this.isAvailable()) return;
    Object.keys(localStorage)
      .filter((k) => k.startsWith(NAMESPACE))
      .forEach((k) => localStorage.removeItem(k));
  }
}

export const storage = new Storage();
