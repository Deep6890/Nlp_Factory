/**
 * src/components/ProtectedRoute.jsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Wraps dashboard routes.
 *
 * - While session is being restored → shows a full-screen spinner so the UI
 *   doesn't flash the login page on hard refresh.
 * - If unauthenticated after load → redirects to /login.
 * - If authenticated → renders <Outlet /> (the nested dashboard routes).
 */
import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const C = { green: '#A0C878', text: '#1a2010' };

const ProtectedRoute = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        minHeight: '100vh', background: '#FFFDF6', flexDirection: 'column', gap: 16,
      }}>
        {/* Simple CSS spinner — no extra deps needed */}
        <div style={{
          width: 44, height: 44, borderRadius: '50%',
          border: `4px solid rgba(160,200,120,0.2)`,
          borderTopColor: C.green,
          animation: 'spin 0.8s linear infinite',
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <span style={{ fontSize: 13, color: C.text, fontWeight: 600, opacity: 0.5 }}>
          Restoring session…
        </span>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
