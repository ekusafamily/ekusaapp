import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { isAuthenticated, clearAuth, apiClient } from './lib/apiClient';
import { Layout } from './components/Layout';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { MembersPage } from './pages/MembersPage';
import { MembershipPage } from './pages/MembershipPage';
import { AnnouncementsPage } from './pages/AnnouncementsPage';
import { EventsPage } from './pages/EventsPage';
import { WelfarePage } from './pages/WelfarePage';
import { CommunitiesPage } from './pages/CommunitiesPage';
import { LeadershipPage } from './pages/LeadershipPage';
import { RolesPage } from './pages/RolesPage';
import { AuditPage } from './pages/AuditPage';
import { SettingsPage } from './pages/SettingsPage';
import { ProtectedRoute } from './components/ProtectedRoute';

export function App() {
  const [isAuthChecked, setIsAuthChecked] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Check authentication on app load
    const checkAuth = async () => {
      if (isAuthenticated()) {
        try {
          await apiClient.get('/users/me');
        } catch {
          clearAuth();
        }
      }
      setIsAuthChecked(true);
    };
    checkAuth();
  }, []);

  if (!isAuthChecked) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <div className="spinner" style={{
          width: 40, height: 40, border: '3px solid var(--color-border)',
          borderTopColor: 'var(--color-primary)', borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }} />
        <style>{`
          @keyframes spin { to { transform: rotate(360deg); } }
        `}</style>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<ProtectedRoute />}>
        <Route element={<Layout />}>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="members" element={<MembersPage />} />
          <Route path="membership" element={<MembershipPage />} />
          <Route path="announcements" element={<AnnouncementsPage />} />
          <Route path="events" element={<EventsPage />} />
          <Route path="welfare" element={<WelfarePage />} />
          <Route path="communities" element={<CommunitiesPage />} />
          <Route path="leadership" element={<LeadershipPage />} />
          <Route path="roles" element={<RolesPage />} />
          <Route path="audit" element={<AuditPage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}