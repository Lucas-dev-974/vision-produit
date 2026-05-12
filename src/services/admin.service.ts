import { httpClient } from './http-client';
import type { PaginatedResult } from './http-client';

export type UserRole = 'producer' | 'buyer' | 'admin';
export type UserStatus =
  | 'pending_email'
  | 'pending_admin'
  | 'active'
  | 'suspended'
  | 'deleted';

export type ReportCategory =
  | 'fake_profile'
  | 'inappropriate_content'
  | 'scam'
  | 'harassment'
  | 'other';

export type ReportStatus = 'open' | 'reviewed' | 'resolved' | 'dismissed';

export type AuditTargetType = 'user' | 'pre_registration' | 'report' | 'system';

export type PreRegistrationRole = 'producer' | 'buyer' | 'undecided';
export type PreRegistrationStatus =
  | 'pending_email'
  | 'pending_review'
  | 'contacted'
  | 'invited'
  | 'approved'
  | 'rejected';

export interface AdminStats {
  preRegistrations: Record<PreRegistrationStatus | 'total', number>;
  users: {
    total: number;
    active: number;
    pendingAdmin: number;
    pendingEmail: number;
    suspended: number;
    deleted: number;
    byRole: { producer: number; buyer: number; admin: number };
  };
  orders: {
    last7d: Record<string, number>;
    last30d: Record<string, number>;
    acceptanceRate30d: number;
    honorRate30d: number;
  };
  reports: Record<ReportStatus, number>;
  quality: {
    averageRating: number;
    averageReliability: number;
  };
}

export interface AdminUserListItem {
  id: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  companyName: string | null;
  siret: string | null;
  city: string | null;
  postalCode: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface AdminUserDetail extends AdminUserListItem {
  phone: string | null;
  description: string | null;
  nafCode: string | null;
  addressLine: string | null;
  profilePhotoUrl: string | null;
  locationLat: number | null;
  locationLng: number | null;
  producerProfile: {
    averageRating: number;
    totalRatings: number;
    reliabilityScore: number;
    totalOrders: number;
  } | null;
  ordersSummary: { asBuyer: number; asProducer: number };
}

export type SurveyRespondentRole = 'producer' | 'merchant' | 'both';
export type SurveyResponseStatus = 'new' | 'reviewed' | 'archived';
/** Palier de priorisation (aligné sur `computeSurveyLeadTier` côté API). */
export type SurveyLeadTier = 'hot' | 'warm' | 'cold' | 'out';

export interface AdminSurveyResponse {
  id: string;
  contactName: string | null;
  contactEmail: string;
  contactPhone: string;
  role: SurveyRespondentRole;
  activityType: string | null;
  zone: string | null;
  sizeBracket: string | null;
  answers: Record<string, unknown>;
  consentRgpd: boolean;
  consentRecontact: boolean;
  leadTier: SurveyLeadTier;
  status: SurveyResponseStatus;
  source: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AdminPreRegistration {
  id: string;
  email: string;
  role: PreRegistrationRole;
  companyName: string | null;
  siret: string | null;
  phone: string | null;
  city: string | null;
  postalCode: string | null;
  message: string | null;
  consentRgpd: boolean;
  status: PreRegistrationStatus;
  source: string | null;
  emailConfirmedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AdminReport {
  id: string;
  reporterId: string;
  reporterEmail: string | null;
  targetUserId: string | null;
  targetUserEmail: string | null;
  targetMessageId: string | null;
  targetMessageContent?: string | null;
  category: ReportCategory;
  description: string;
  status: ReportStatus;
  adminNotes: string | null;
  resolvedAt: string | null;
  createdAt: string;
}

export interface AdminAuditEntry {
  id: string;
  adminId: string | null;
  adminEmail: string | null;
  action: string;
  targetType: AuditTargetType;
  targetId: string | null;
  payload: Record<string, unknown> | null;
  createdAt: string;
}

function toQuery(params: Record<string, string | number | undefined | null>): string {
  const usp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === null || v === '') continue;
    usp.set(k, String(v));
  }
  const qs = usp.toString();
  return qs ? `?${qs}` : '';
}

export const adminService = {
  stats: () => httpClient.get<AdminStats>('/admin/stats'),

  users: {
    list: (params: {
      page: number;
      pageSize: number;
      role?: UserRole;
      status?: UserStatus;
      q?: string;
    }): Promise<PaginatedResult<AdminUserListItem>> =>
      httpClient.getPaginated<AdminUserListItem>(`/admin/users${toQuery(params)}`),

    get: (id: string) => httpClient.get<AdminUserDetail>(`/admin/users/${id}`),

    approve: (id: string) =>
      httpClient.post<AdminUserDetail>(`/admin/users/${id}/approve`),

    reject: (id: string, reason: string) =>
      httpClient.post<AdminUserDetail>(`/admin/users/${id}/reject`, { reason }),

    suspend: (id: string, reason: string) =>
      httpClient.post<AdminUserDetail>(`/admin/users/${id}/suspend`, { reason }),

    reactivate: (id: string) =>
      httpClient.post<AdminUserDetail>(`/admin/users/${id}/reactivate`),

    softDelete: (id: string) => httpClient.delete<void>(`/admin/users/${id}`),
  },

  preRegistrations: {
    list: (params: {
      page: number;
      pageSize: number;
      status?: PreRegistrationStatus;
    }): Promise<PaginatedResult<AdminPreRegistration>> =>
      httpClient.getPaginated<AdminPreRegistration>(
        `/admin/pre-registrations${toQuery(params)}`,
      ),

    updateStatus: (id: string, status: PreRegistrationStatus) =>
      httpClient.patch<AdminPreRegistration>(`/admin/pre-registrations/${id}`, { status }),

    invite: (id: string, message?: string) =>
      httpClient.post<AdminPreRegistration>(`/admin/pre-registrations/${id}/invite`, {
        message: message?.trim() || undefined,
      }),
  },

  reports: {
    list: (params: {
      page: number;
      pageSize: number;
      status?: ReportStatus;
      category?: ReportCategory;
    }): Promise<PaginatedResult<AdminReport>> =>
      httpClient.getPaginated<AdminReport>(`/admin/reports${toQuery(params)}`),

    get: (id: string) => httpClient.get<AdminReport>(`/admin/reports/${id}`),

    resolve: (
      id: string,
      input: { status: 'reviewed' | 'resolved' | 'dismissed'; adminNotes?: string },
    ) => httpClient.post<AdminReport>(`/admin/reports/${id}/resolve`, input),
  },

  audit: {
    list: (params: {
      page: number;
      pageSize: number;
      targetType?: AuditTargetType;
      action?: string;
    }): Promise<PaginatedResult<AdminAuditEntry>> =>
      httpClient.getPaginated<AdminAuditEntry>(`/admin/audit${toQuery(params)}`),
  },

  surveys: {
    list: (params: {
      page: number;
      pageSize: number;
      status?: SurveyResponseStatus;
      role?: SurveyRespondentRole;
      leadTier?: SurveyLeadTier;
    }): Promise<PaginatedResult<AdminSurveyResponse>> =>
      httpClient.getPaginated<AdminSurveyResponse>(`/admin/surveys${toQuery(params)}`),

    get: (id: string) => httpClient.get<AdminSurveyResponse>(`/admin/surveys/${id}`),

    updateStatus: (id: string, status: SurveyResponseStatus) =>
      httpClient.patch<AdminSurveyResponse>(`/admin/surveys/${id}`, { status }),

    delete: (id: string) => httpClient.delete<void>(`/admin/surveys/${id}`),
  },
};

// --- Service public lié à l'invitation (utilisé par /inscription) ---

export interface InvitationPreview {
  email: string;
  role: PreRegistrationRole;
  companyName: string | null;
  siret: string | null;
  city: string | null;
  postalCode: string | null;
}

export const invitationService = {
  validate: (token: string) =>
    httpClient.post<InvitationPreview>('/public/pre-registrations/validate-invitation', {
      token,
    }),

  acceptRegistration: (input: {
    inviteToken: string;
    password: string;
    siret: string;
    role: 'producer' | 'buyer';
  }) => httpClient.post<unknown>('/auth/register-with-invite', input),
};
