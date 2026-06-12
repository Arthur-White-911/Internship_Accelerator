const API_BASE = (import.meta.env.VITE_API_BASE as string) || 'http://localhost:3001/api';

export async function apiFetch(path: string, options: RequestInit = {}) {
  const token = localStorage.getItem('token');
  const url = `${API_BASE}${path}`;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((options.headers as Record<string, string>) || {}),
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(url, { ...options, headers });
  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const error = new Error(data.message || `HTTP ${res.status}`);
    (error as any).status = res.status;
    (error as any).response = data;
    throw error;
  }
  return data;
}

export const api = {
  get: (path: string) => apiFetch(path, { method: 'GET' }),
  post: (path: string, body?: any) => apiFetch(path, { method: 'POST', body: body ? JSON.stringify(body) : undefined }),
  put: (path: string, body?: any) => apiFetch(path, { method: 'PUT', body: body ? JSON.stringify(body) : undefined }),
  delete: (path: string) => apiFetch(path, { method: 'DELETE' }),
};
