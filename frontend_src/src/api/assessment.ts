import { api } from './client';
export const assessmentApi = {
  submit: (data: { major: string; skillLevel: string; experience?: string; careerGoal: string }) => api.post('/assessment/submit', data),
  history: () => api.get('/assessment/history'),
  latest: () => api.get('/assessment/latest'),
};
