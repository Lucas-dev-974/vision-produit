import { httpClient } from './http-client';
import type { User } from '../entities';

export const authService = {
  me: () => httpClient.get<User>('/auth/me'),
  login: (email: string, password: string) =>
    httpClient.post<User>('/auth/login', { email, password }),
  logout: () => httpClient.post<void>('/auth/logout'),
  register: (body: {
    email: string;
    password: string;
    siret: string;
    role: 'producer' | 'buyer';
  }) => httpClient.post<User>('/auth/register', body),
};
