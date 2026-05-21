import api from '../lib/api';
import type { Content } from '../types';

export const contentApi = {
  list: (params?: { type?: string; page?: number; limit?: number }) =>
    api.get('/content', { params }),

  getById: (id: string) =>
    api.get<{ data: Content }>(`/content/${id}`),

  create: (data: Partial<Content>) =>
    api.post('/content', data),

  update: (id: string, data: Partial<Content>) =>
    api.patch(`/content/${id}`, data),

  delete: (id: string) =>
    api.delete(`/content/${id}`),

  publish: (id: string) =>
    api.patch(`/content/${id}/publish`),

  unpublish: (id: string) =>
    api.patch(`/content/${id}/unpublish`),
};
