import { api } from './client';
export const notificationsApi = {
  list: (params?: { type?: string; isRead?: boolean }) => {
    const qs = params ? '?' + new URLSearchParams(Object.entries(params).filter(([,v]) => v !== undefined).map(([k,v]) => [k, String(v)]) as string[][]).toString() : '';
    return api.get(`/notifications${qs}`);
  },
  stats: () => api.get('/notifications/stats'),
  markRead: (id: number) => api.put(`/notifications/${id}/read`),
  markAllRead: () => api.put('/notifications/read-all'),
  delete: (id: number) => api.delete(`/notifications/${id}`),
};
