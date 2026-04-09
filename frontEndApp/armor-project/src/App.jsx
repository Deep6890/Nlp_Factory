import React from 'react';
import { BrowserRouter as Router, Routes, Route, Outlet, Navigate } from 'react-router-dom';
import { AuthProvider }     from './context/AuthContext';
import { InsightsProvider } from './context/InsightsContext';
import { ThemeProvider }    from './context/ThemeContext';
import ProtectedRoute       from './components/ProtectedRoute';
import Navbar               from './components/Navbar';

/* ── Public pages ── */
import LoginPage  from './pages/LoginPage';
import SignupPage from './pages/SignupPage';

/* ── Dashboard pages ── */
import DashboardHome      from './pages/DashboardHome';
import SessionsPage       from './pages/SessionsPage';
import SessionDetailPage  from './pages/SessionDetailPage';
import InsightsEditorPage from './pages/InsightsEditorPage';
import LiveDetectionPage  from './pages/LiveDetectionPage';
import InsightsPage       from './pages/InsightsPage';
import RemindersPage      from './pages/RemindersPage';
import AlertsPage         from './pages/AlertsPage';
import ReportsPage        from './pages/ReportsPage';
import ProfilePage        from './pages/ProfilePage';
import SettingsPage       from './pages/SettingsPage';
import AnalyticsPage      from './pages/AnalyticsPage';

/* ── Public landing (keep existing) ── */
import LandingPage from './pages/LandingPage';

const DashboardLayout = () => (
  <div className="min-h-screen flex flex-col" style={{ background:'var(--bg-page)', transition:'background-color 0.25s ease' }}>
    <Navbar />
    <div className="flex-1 w-full max-w-[1440px] mx-auto px-7 pb-12 pt-6 box-border">
      <Outlet />
    </div>
  </div>
);

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <InsightsProvider>
          <Router>
            <Routes>
              {/* Public */}
              <Route path="/"        element={<LandingPage />} />
              <Route path="/login"   element={<LoginPage />} />
              <Route path="/signup"  element={<SignupPage />} />

              {/* Protected dashboard */}
              <Route element={<ProtectedRoute />}>
                <Route path="/dashboard" element={<DashboardLayout />}>
                  <Route index                          element={<DashboardHome />} />
                  <Route path="history"                 element={<SessionsPage />} />
                  <Route path="live"                    element={<LiveDetectionPage />} />
                  <Route path="sessions"                element={<SessionsPage />} />
                  <Route path="sessions/:id"            element={<SessionDetailPage />} />
                  <Route path="sessions/:id/edit-insights" element={<InsightsEditorPage />} />
                  <Route path="insights"                element={<InsightsPage />} />
                  <Route path="reminders"               element={<RemindersPage />} />
                  <Route path="alerts"                  element={<AlertsPage />} />
                  <Route path="reports"                 element={<ReportsPage />} />
                  <Route path="profile"                 element={<ProfilePage />} />
                  <Route path="settings"                element={<SettingsPage />} />
                  <Route path="analytics"               element={<AnalyticsPage />} />
                </Route>
              </Route>

              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </Router>
        </InsightsProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
