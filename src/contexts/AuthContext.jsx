import React, { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react';
import { authApi } from '../lib/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const token = localStorage.getItem('dc_token');
    if (!token) { setUser(null); setLoading(false); return; }
    try {
      const me = await authApi.me();
      setUser(me);
    } catch (e) {
      localStorage.removeItem('dc_token');
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const login = useCallback(async (email, password) => {
    const data = await authApi.login(email, password);
    localStorage.setItem('dc_token', data.access_token);
    if (data.user.allowed_sites && !data.user.all_sites) localStorage.setItem('active_site', data.user.active_site || data.user.allowed_sites[0]);
    setUser(data.user);
    return data.user;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('dc_token');
    setUser(null);
  }, []);

  const isAdmin = !!user && ['super_admin', 'admin', 'site_admin', 'delivery_specialist'].includes(user.role);
  const isSuper = !!user && user.role === 'super_admin';

  const value = useMemo(
    () => ({ user, loading, login, logout, refresh, isAdmin, isSuper, setUser }),
    [user, loading, login, logout, refresh, isAdmin, isSuper],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
