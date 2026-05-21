import api from '../lib/api';

export const authApi = {
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }),

  registerCreator: (data: {
    inviteToken: string;
    email: string;
    password: string;
    firstName: string;
    lastName: string;
  }) => api.post('/auth/register/creator', data),

  validateInvite: (token: string) =>
    api.get(`/auth/invites/${token}/validate`),

  refresh: (refreshToken: string) =>
    api.post('/auth/refresh', { refreshToken }),

  logout: () => api.post('/auth/logout'),

  me: () => api.get('/auth/me'),

  forgotPassword: (email: string) =>
    api.post('/auth/forgot-password', { email }),

  resetPassword: (token: string, password: string) =>
    api.post('/auth/reset-password', { token, password }),
};
