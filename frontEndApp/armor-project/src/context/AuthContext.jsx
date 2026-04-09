import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import supabase from '../lib/supabase';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser]       = useState(null);
  const [token, setToken]     = useState(() => localStorage.getItem('armor_token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        const u = _mapUser(session.user);
        setUser(u);
        setToken(session.access_token);
        localStorage.setItem('armor_token', session.access_token);
        localStorage.setItem('armor_user', JSON.stringify(u));
      } else {
        const storedUser = localStorage.getItem('armor_user');
        if (storedUser) {
          try { setUser(JSON.parse(storedUser)); } catch (_) {}
        }
      }
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        const u = _mapUser(session.user);
        setUser(u);
        setToken(session.access_token);
        localStorage.setItem('armor_token', session.access_token);
        localStorage.setItem('armor_user', JSON.stringify(u));
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const login = useCallback((userData, accessToken) => {
    localStorage.setItem('armor_token', accessToken);
    localStorage.setItem('armor_user', JSON.stringify(userData));
    setToken(accessToken);
    setUser(userData);
  }, []);

  const logout = useCallback(async () => {
    await supabase.auth.signOut().catch(() => {});
    localStorage.removeItem('armor_token');
    localStorage.removeItem('armor_user');
    setToken(null);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

const _mapUser = (u) => ({
  id:    u.id,
  _id:   u.id,
  name:  u.user_metadata?.name || u.email?.split('@')[0] || 'User',
  email: u.email,
  role:  u.user_metadata?.role || 'user',
});

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
};

export default AuthContext;
