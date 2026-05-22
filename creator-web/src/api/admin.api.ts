import api from '@/lib/api';

// ── Destination types ─────────────────────────────────────────────────────────
export interface CreateDestinationData {
  name: string;
  type: string;
  parentId?: string;
  continent?: string;
  countryCode?: string;
  currency?: string;
  timezone?: string;
  bestTimeToVisit?: string;
  description?: string;
}

// ── Destinations ──────────────────────────────────────────────────────────────
export const adminDestinationsApi = {
  list: (params?: {
    type?: string;
    parentId?: string;
    search?: string;
    page?: number;
    limit?: number;
    includeInactive?: string;
  }) => api.get('/admin/destinations', { params }),

  tree: () => api.get('/admin/destinations/tree'),

  create: (data: CreateDestinationData) => api.post('/admin/destinations', data),

  update: (id: string, data: Partial<CreateDestinationData>) =>
    api.patch(`/admin/destinations/${id}`, data),

  toggle: (id: string) => api.patch(`/admin/destinations/${id}/toggle-status`),

  delete: (id: string) => api.delete(`/admin/destinations/${id}`),
};

// ── Subscription Plans ────────────────────────────────────────────────────────
export interface CreatePlanData {
  name: string;
  description?: string;
  type: string;
  billingPeriod: string;
  price: number;
  currency?: string;
  creatorTier?: string;
  maxProducts?: number | null;
  maxContent?: number | null;
  commissionRate?: number | null;
  trialDays?: number | null;
  isActive?: boolean;
}

export const adminPlansApi = {
  list: () => api.get('/admin/subscription-plans'),

  create: (data: CreatePlanData) => api.post('/admin/subscription-plans', data),

  update: (id: string, data: Partial<CreatePlanData>) =>
    api.patch(`/admin/subscription-plans/${id}`, data),

  toggle: (id: string) => api.patch(`/admin/subscription-plans/${id}/toggle-status`),

  delete: (id: string) => api.delete(`/admin/subscription-plans/${id}`),
};

// ── Creator Invites ───────────────────────────────────────────────────────────
export const adminInvitesApi = {
  list: (params?: { page?: number; limit?: number; status?: string }) =>
    api.get('/admin/invites', { params }),

  create: (data: { email: string; notes?: string }) => api.post('/admin/invites', data),

  stats: () => api.get('/admin/invites/stats'),

  revoke: (id: string) => api.delete(`/admin/invites/${id}`),
};

// ── Users ─────────────────────────────────────────────────────────────────────
export const adminUsersApi = {
  list: (params?: { search?: string; role?: string; page?: number; limit?: number }) =>
    api.get('/admin/users', { params }),

  get: (id: string) => api.get(`/admin/users/${id}`),

  updateRole: (id: string, role: string) => api.patch(`/admin/users/${id}/role`, { role }),

  delete: (id: string) => api.delete(`/admin/users/${id}`),
};

// ── Creators ──────────────────────────────────────────────────────────────────
export const adminCreatorsApi = {
  list: (params?: { search?: string; tier?: string; page?: number; limit?: number }) =>
    api.get('/admin/creators', { params }),

  toggleVerified: (id: string) => api.patch(`/admin/creators/${id}/toggle-verified`),

  updateTier: (id: string, tier: string) => api.patch(`/admin/creators/${id}/tier`, { tier }),

  delete: (id: string) => api.delete(`/admin/creators/${id}`),
};

// ── Platform stats ────────────────────────────────────────────────────────────
export const adminStatsApi = {
  get: () => api.get('/admin/stats'),
};
