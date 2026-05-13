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
    setUser(data.user);
    return data.user;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('dc_token');
    setUser(null);
  }, []);

  const isAdmin = !!user && (user.role === 'super_admin' || user.role === 'admin');
  const isSuper = !!user && user.role === 'super_admin';

  const value = useMemo(
    () => ({ user, loading, login, logout, refresh, isAdmin, isSuper, setUser }),
    [user, loading, login, logout, refresh, isAdmin, isSuper],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
