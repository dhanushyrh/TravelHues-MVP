import api from '../lib/api';
import type { Tip, PaginatedResponse } from '../types';

export const tipsApi = {
  list: (params?: { page?: number; limit?: number; destinationId?: string }) =>
    api.get<PaginatedResponse<Tip>>('/tips', { params }),

  getById: (id: string) =>
    api.get<Tip>(`/tips/${id}`),

  create: (data: Partial<Tip>) =>
    api.post<Tip>('/tips', data),

  update: (id: string, data: Partial<Tip>) =>
    api.patch<Tip>(`/tips/${id}`, data),

  delete: (id: string) =>
    api.delete(`/tips/${id}`),
};
