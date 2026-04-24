import { describe, it, expect, beforeEach } from 'vitest';
import { storage } from './storage';

describe('storage', () => {
  beforeEach(() => {
    storage.clear();
  });

  it('persiste et relit une valeur', () => {
    expect(storage.set('ui.sidebarCollapsed', true)).toBe(true);
    expect(storage.get<boolean>('ui.sidebarCollapsed')).toBe(true);
  });
});
