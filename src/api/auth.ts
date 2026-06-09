import { api } from './client';

export interface LoginReq { account: string; password: string; identity?: string }
export interface RegisterReq { account: string; password: string; confirmPassword: string; identity?: string; name?: string; school?: string; major?: string; phone?: string; email?: string }
export interface User { id: number; account: string; identity: string; name: string; school?: string; major?: string; phone?: string; email?: string; avatar?: string; skillProfessional?: string; skillLanguage?: string; skillSoft?: string; }

export const authApi = {
  login: (data: LoginReq) => api.post('/auth/login', data),
  register: (data: RegisterReq) => api.post('/auth/register', data),
  me: () => api.get('/auth/me'),
  updateProfile: (data: Partial<User>) => api.put('/auth/profile', data),
  updatePassword: (data: { oldPassword: string; newPassword: string }) => api.put('/auth/password', data),
};

export function getToken() { return localStorage.getItem('token'); }
export function setToken(t: string) { localStorage.setItem('token', t); }
export function removeToken() { localStorage.removeItem('token'); }
export function isLoggedIn() { return !!getToken(); }
