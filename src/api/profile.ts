import { api } from './client';
export const profileApi = {
  get: () => api.get('/profile'),
  update: (data: { name?: string; school?: string; major?: string; phone?: string; email?: string }) => api.put('/profile', data),
  trainingRecords: () => api.get('/profile/training-records'),
  certificates: () => api.get('/profile/certificates'),
};
