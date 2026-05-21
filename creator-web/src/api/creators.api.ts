import api from '../lib/api';
import type { CreatorProfile, OnboardingData } from '../types';

export const creatorsApi = {
  getMyProfile: () => api.get<{ data: CreatorProfile }>('/creators/me'),

  updateMyProfile: (data: Partial<CreatorProfile>) =>
    api.patch('/creators/me', data),

  completeOnboarding: (data: OnboardingData) =>
    api.post('/creators/onboarding', data),

  getDashboard: () => api.get('/creators/me/dashboard'),

  getAnalytics: (period: string) =>
    api.get(`/creators/me/analytics?period=${period}`),
};
