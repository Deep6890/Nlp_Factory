import React from 'react';
import { BrowserRouter as Router, Routes, Route, Outlet, Navigate } from 'react-router-dom';

import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Navbar from './components/Common/Navbar';

import LandingPage from './components/Public/LandingPage';
import Login from './components/Auth/Login';
import Signup from './components/Auth/Signup';

import Main from './components/Dashboard/Main';
import Sessions from './components/Dashboard/Sessions';
import SessionDetail from './components/Dashboard/SessionDetail';
import Settings from './components/Dashboard/Settings';
import Profile from './components/Dashboard/Profile';
import LiveDetection from './components/Dashboard/LiveDetection';
import Insights from './components/Dashboard/Insights';
import Decisions from './components/Dashboard/Decisions';
import Reminders from './components/Dashboard/Reminders';
import Alerts from './components/Dashboard/Alerts';
import Reports from './components/Dashboard/Reports';
import Analytics from './components/Dashboard/Analytics';

const DashboardLayout = () => (
  <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: '#FFFDF6' }}>
    <Navbar />
    <div style={{ flex: 1, overflowY: 'auto', padding: '24px 20px 40px' }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        <Outlet />
      </div>
    </div>
  </div>
);

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />

          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<DashboardLayout />}>
              <Route index element={<Main />} />
              <Route path="history" element={<Sessions />} />
              <Route path="live" element={<LiveDetection />} />
              <Route path="sessions" element={<Sessions />} />
              <Route path="sessions/:id" element={<SessionDetail />} />
              <Route path="settings" element={<Settings />} />
              <Route path="profile" element={<Profile />} />
              <Route path="insights" element={<Insights />} />
              <Route path="decisions" element={<Decisions />} />
              <Route path="reminders" element={<Reminders />} />
              <Route path="alerts" element={<Alerts />} />
              <Route path="reports" element={<Reports />} />
              <Route path="analytics" element={<Analytics />} />
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;