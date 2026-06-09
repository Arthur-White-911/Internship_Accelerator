import { api } from './client';
export const chatApi = {
  send: (message: string) => api.post('/chat/send', { message }),
  history: () => api.get('/chat/history'),
  clear: () => api.delete('/chat/history'),
};
