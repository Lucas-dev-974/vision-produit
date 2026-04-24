import { createSignal } from 'solid-js';
import { authService } from '../services/auth.service';
import type { User } from '../entities';

const [currentUser, setCurrentUser] = createSignal<User | null>(null);
const [isLoading, setIsLoading] = createSignal(false);

export const authStore = {
  currentUser,
  isLoading,

  async loadCurrentUser() {
    setIsLoading(true);
    try {
      const user = await authService.me();
      setCurrentUser(user);
    } catch {
      setCurrentUser(null);
    } finally {
      setIsLoading(false);
    }
  },

  async login(email: string, password: string) {
    const user = await authService.login(email, password);
    setCurrentUser(user);
    return user;
  },

  async logout() {
    await authService.logout();
    setCurrentUser(null);
  },
};
