import { httpClient } from './http-client';

export type PreRegistrationRole = 'producer' | 'buyer' | 'undecided';

export interface CreatePreRegistrationInput {
  email: string;
  role: PreRegistrationRole;
  companyName?: string;
  siret?: string;
  phone?: string;
  city?: string;
  postalCode?: string;
  message?: string;
  source?: string;
  consentRgpd: true;
}

export interface CreatePreRegistrationResponse {
  ok: boolean;
  emailSent: boolean;
}

export interface ConfirmPreRegistrationResponse {
  email: string;
  alreadyConfirmed: boolean;
}

export const preRegistrationService = {
  create: (input: CreatePreRegistrationInput) =>
    httpClient.post<CreatePreRegistrationResponse>('/public/pre-registrations', input),

  confirm: (token: string) =>
    httpClient.post<ConfirmPreRegistrationResponse>('/public/pre-registrations/confirm', {
      token,
    }),

  resend: (email: string) =>
    httpClient.post<{ ok: boolean }>('/public/pre-registrations/resend', { email }),
};
