import { api } from './client';
export const trainingApi = {
  projects: (category?: string) => api.get(`/training/projects${category ? `?category=${category}` : ''}`),
  projectDetail: (id: number) => api.get(`/training/projects/${id}`),
  start: (data: { projectId: number; topic: string; content?: string; duration: string }) => api.post('/training/start', data),
  sessions: () => api.get('/training/sessions'),
  progress: () => api.get('/training/progress'),
};
