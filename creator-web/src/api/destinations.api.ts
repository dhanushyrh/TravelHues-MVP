import api from '@/lib/api';

export const destinationsApi = {
  listCountries: (params?: { search?: string; limit?: number }) =>
    api.get('/destinations/countries', { params: { limit: 100, ...params } }),

  listCities: (params?: { parentId?: string; search?: string; limit?: number }) =>
    api.get('/destinations', { params: { type: 'city', limit: 200, ...params } }),
};
