/**
 * src/context/AuthContext.jsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Provides auth state (user, token, loading) and actions (login, logout)
 * to the entire app tree.
 *
 * On mount it attempts to restore the session by calling GET /auth/me with the
 * locally-stored token.  If the token is missing or invalid the user is treated
 * as unauthenticated — no redirect happens here (that's ProtectedRoute's job).
 */
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getMe } from '../api/auth';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser]       = useState(null);
  const [token, setToken]     = useState(() => localStorage.getItem('armor_token'));
  const [loading, setLoading] = useState(true); // true until session check completes

  // ── Restore session on app load ───────────────────────────────────────────
  useEffect(() => {
    const restore = async () => {
      const storedToken = localStorage.getItem('armor_token');
      if (!storedToken) {
        setLoading(false);
        return;
      }
      try {
        const data = await getMe();           // GET /auth/me
        setUser(data.user ?? data);
        setToken(storedToken);
      } catch {
        // Token invalid or expired — clear silently
        localStorage.removeItem('armor_token');
        localStorage.removeItem('armor_user');
        setToken(null);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    restore();
  }, []);

  // ── login ────────────────────────────────────────────────────────────────
  const login = useCallback((userData, jwtToken) => {
    localStorage.setItem('armor_token', jwtToken);
    localStorage.setItem('armor_user', JSON.stringify(userData));
    setToken(jwtToken);
    setUser(userData);
  }, []);

  // ── logout ───────────────────────────────────────────────────────────────
  const logout = useCallback(() => {
    localStorage.removeItem('armor_token');
    localStorage.removeItem('armor_user');
    setToken(null);
    setUser(null);
  }, []);

  const value = { user, token, loading, login, logout };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

/** Convenience hook — use anywhere inside AuthProvider */
export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
};

export default AuthContext;
