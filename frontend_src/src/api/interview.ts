import { api } from './client';
export const interviewApi = {
  questions: (params?: { category?: string; frequency?: string; type?: string; search?: string }) => {
    const qs = params ? '?' + new URLSearchParams(Object.entries(params).filter(([,v]) => v) as string[][]).toString() : '';
    return api.get(`/interview/questions${qs}`);
  },
  questionDetail: (id: number) => api.get(`/interview/questions/${id}`),
  mock: (data: { interviewType: string; industry: string; answers?: any[] }) => api.post('/interview/mock', data),
  history: () => api.get('/interview/history'),
};
