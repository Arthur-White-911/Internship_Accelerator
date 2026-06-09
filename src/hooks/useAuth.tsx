import { useState, useEffect, useCallback, createContext, useContext } from 'react';
import { authApi, removeToken, setToken, isLoggedIn as checkLogin } from '../api/auth';
import type { User } from '../api/auth';

interface AuthCtx {
  user: User | null;
  loading: boolean;
  login: (account: string, password: string, identity?: string) => Promise<boolean>;
  register: (data: { account: string; password: string; confirmPassword: string; name?: string; school?: string; major?: string }) => Promise<boolean>;
  logout: () => void;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthCtx>({
  user: null, loading: true,
  login: async () => false, register: async () => false, logout: () => {}, refresh: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!checkLogin()) { setUser(null); setLoading(false); return; }
    try {
      const res = await authApi.me();
      if (res.success) setUser(res.data);
      else { removeToken(); setUser(null); }
    } catch { removeToken(); setUser(null); }
    setLoading(false);
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const login = useCallback(async (account: string, password: string, identity = 'student') => {
    try {
      const res = await authApi.login({ account, password, identity });
      if (res.success) { setToken(res.data.token); setUser(res.data.user); return true; }
    } catch (e: any) { throw e; }
    return false;
  }, []);

  const register = useCallback(async (data: { account: string; password: string; confirmPassword: string; name?: string; school?: string; major?: string }) => {
    try {
      const res = await authApi.register({ ...data, identity: 'student' });
      if (res.success) { setToken(res.data.token); setUser(res.data.user); return true; }
    } catch (e: any) { throw e; }
    return false;
  }, []);

  const logout = useCallback(() => { removeToken(); setUser(null); window.location.reload(); }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refresh }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
