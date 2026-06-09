import { api } from './client';
export const programsApi = {
  list: () => api.get('/programs'),
  detail: (id: number) => api.get(`/programs/${id}`),
  enroll: (id: number) => api.post(`/programs/${id}/enroll`),
  myEnrollments: () => api.get('/programs/my/enrollments'),
};
