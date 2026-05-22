import api from '../lib/api';
import type { Story, PaginatedResponse } from '../types';

export const storiesApi = {
  list: (params?: { page?: number; limit?: number }) =>
    api.get<PaginatedResponse<Story>>('/stories/me', { params }),

  getById: (id: string) =>
    api.get<Story>(`/stories/${id}`),

  create: (data: { title: string; description?: string; coverImageUrl?: string; countryId: string }) =>
    api.post<Story>('/stories', data),

  update: (id: string, data: Partial<{ title: string; description: string; coverImageUrl: string; countryId: string }>) =>
    api.patch<Story>(`/stories/${id}`, data),

  delete: (id: string) =>
    api.delete(`/stories/${id}`),

  togglePublish: (id: string) =>
    api.patch<Story>(`/stories/${id}/publish`),

  addProduct: (storyId: string, productId: string) =>
    api.post<Story>(`/stories/${storyId}/products/${productId}`),

  removeProduct: (storyId: string, productId: string) =>
    api.delete<Story>(`/stories/${storyId}/products/${productId}`),

  addTip: (storyId: string, tipId: string) =>
    api.post<Story>(`/stories/${storyId}/tips/${tipId}`),

  removeTip: (storyId: string, tipId: string) =>
    api.delete<Story>(`/stories/${storyId}/tips/${tipId}`),

  addContent: (storyId: string, contentId: string) =>
    api.post<Story>(`/stories/${storyId}/content/${contentId}`),

  removeContent: (storyId: string, contentId: string) =>
    api.delete<Story>(`/stories/${storyId}/content/${contentId}`),
};
