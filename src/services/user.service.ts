import { httpClient } from './http-client';
import type { RgpdExportPayload, User } from '../entities';

export interface PatchMeBody {
  phone?: string | null;
  description?: string | null;
  profilePhotoUrl?: string | null;
  locationLat?: number;
  locationLng?: number;
  addressLine?: string | null;
  city?: string | null;
  postalCode?: string | null;
}

export const userService = {
  patchMe: (body: PatchMeBody) => httpClient.patch<User>('/users/me', body),

  exportMe: () => httpClient.get<RgpdExportPayload>('/users/me/export'),

  deleteMe: () => httpClient.delete<void>('/users/me'),
};
