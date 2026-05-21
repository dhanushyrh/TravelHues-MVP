import api from '../lib/api';
import type { Product } from '../types';

export const productsApi = {
  list: (params?: { type?: string; page?: number; limit?: number }) =>
    api.get('/products', { params }),

  getById: (id: string) =>
    api.get<{ data: Product }>(`/products/${id}`),

  create: (data: Partial<Product>) =>
    api.post('/products', data),

  update: (id: string, data: Partial<Product>) =>
    api.patch(`/products/${id}`, data),

  delete: (id: string) =>
    api.delete(`/products/${id}`),

  publish: (id: string) =>
    api.patch(`/products/${id}/publish`),

  unpublish: (id: string) =>
    api.patch(`/products/${id}/unpublish`),

  // Activity specific
  createActivity: (data: Partial<Product>) =>
    api.post('/products/activity', data),

  // Stay specific
  createStay: (data: Partial<Product>) =>
    api.post('/products/stay', data),

  // Itinerary specific
  createItinerary: (data: Partial<Product>) =>
    api.post('/products/itinerary', data),

  // Package specific
  createPackage: (data: Partial<Product>) =>
    api.post('/products/package', data),

  // Visa specific
  createVisa: (data: Partial<Product>) =>
    api.post('/products/visa', data),
};
