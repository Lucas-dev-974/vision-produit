export type UserRole = 'producer' | 'buyer' | 'admin';
export type UserStatus =
  | 'pending_email'
  | 'pending_admin'
  | 'active'
  | 'suspended'
  | 'deleted';

export interface User {
  id: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  siret: string | null;
  nafCode: string | null;
  companyName: string | null;
  phone: string | null;
  description: string | null;
  profilePhotoUrl: string | null;
  addressLine: string | null;
  city: string | null;
  postalCode: string | null;
  locationLat: number | null;
  locationLng: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface RgpdExportPayload {
  exportedAt: string;
  user: Record<string, unknown>;
}

export interface ProducerPublicProfile extends User {
  publicLocation: { lat: number; lng: number } | null;
  additionalPhotos: string[];
  averageRating: number;
  totalRatings: number;
  reliabilityScore: number;
  totalOrders: number;
}
