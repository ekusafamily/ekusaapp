import React, { useState } from 'react';
import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, Tag, Megaphone, Calendar, HeartHandshake, Globe, GraduationCap, ShieldCheck, ClipboardList, Settings, LogOut, ChevronLeft, ChevronRight } from 'lucide-react';
import { apiClient, clearAuth } from '../lib/apiClient';

const NAV_ITEMS = [
  { path: '/dashboard', label: 'Dashboard', Icon: LayoutDashboard },
  { path: '/members', label: 'Members', Icon: Users },
  { path: '/membership', label: 'Membership', Icon: Tag },
  { path: '/announcements', label: 'Announcements', Icon: Megaphone },
  { path: '/events', label: 'Events', Icon: Calendar },
  { path: '/welfare', label: 'Welfare', Icon: HeartHandshake },
  { path: '/communities', label: 'Communities', Icon: Globe },
  { path: '/leadership', label: 'Leadership', Icon: GraduationCap },
  { path: '/roles', label: 'Roles & Permissions', Icon: ShieldCheck },
  { path: '/audit', label: 'Audit Logs', Icon: ClipboardList },
  { path: '/settings', label: 'Settings', Icon: Settings },
];

export function Layout() {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const handleLogout = async () => {
    try {
      await apiClient.post('/auth/logout');
    } catch (error) {
      console.error('Logout failed:', error);
    }
    clearAuth();
    window.location.href = '/login';
  };

  return (
    <div style={styles.container}>
      {/* Sidebar */}
      <aside style={{ ...styles.sidebar, width: sidebarOpen ? 'var(--sidebar-width)' : '72px' }}>
        <div style={styles.sidebarHeader}>
          {sidebarOpen && (
            <div style={styles.logo}>
              <span style={styles.logoIcon}>E</span>
              <span style={styles.logoText}>EKUSA Admin</span>
            </div>
          )}
          <button
            style={styles.toggleButton}
            onClick={() => setSidebarOpen(!sidebarOpen)}
            aria-label={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
          >
            {sidebarOpen ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
          </button>
        </div>

        <nav style={styles.nav}>
          {NAV_ITEMS.map(item => (
            <NavLink
              key={item.path}
              to={item.path}
              style={({ isActive }: { isActive: boolean }) => ({
                ...styles.navLink,
                backgroundColor: isActive ? 'rgba(255, 255, 255, 0.12)' : 'transparent',
                color: isActive ? '#FFFFFF' : 'rgba(255, 255, 255, 0.62)',
              })}
              end={item.path === '/dashboard'}
            >
              <span style={styles.navIcon}><item.Icon size={18} /></span>
              {sidebarOpen && <span style={styles.navLabel}>{item.label}</span>}
            </NavLink>
          ))}
        </nav>

        <div style={styles.sidebarFooter}>
          <button
            style={styles.logoutButton}
            onClick={handleLogout}
            aria-label="Logout"
            title="Logout"
          >
            <span style={styles.logoutIcon}><LogOut size={18} /></span>
            {sidebarOpen && <span style={styles.logoutLabel}>Logout</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main style={{ ...styles.main, marginLeft: sidebarOpen ? 'var(--sidebar-width)' : '72px' }}>
        {/* Header */}
        <header style={styles.header}>
          <h1 style={styles.pageTitle}>
            {NAV_ITEMS.find(item => location.pathname.startsWith(item.path))?.label || 'Dashboard'}
          </h1>
          <div style={styles.headerActions}>
            <span style={styles.userBadge}>Admin</span>
          </div>
        </header>

        {/* Page Content */}
        <div style={styles.content}>
          <Outlet />
        </div>
      </main>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    minHeight: '100vh',
    backgroundColor: 'var(--color-background)',
  },
  sidebar: {
    height: '100vh',
    backgroundColor: 'var(--color-secondary)',
    display: 'flex',
    flexDirection: 'column',
    transition: 'width 0.2s ease',
    position: 'fixed',
    left: 0,
    top: 0,
    zIndex: 100,
    overflow: 'hidden',
  },
  sidebarHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 'var(--spacing-md)',
    minHeight: 'var(--header-height)',
  },
  logo: {
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--spacing-sm)',
  },
  logoIcon: {
    width: 32,
    height: 32,
    borderRadius: 'var(--border-radius-md)',
    backgroundColor: 'var(--color-primary)',
    color: 'var(--color-on-primary)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 'var(--font-weight-bold)',
    fontSize: 'var(--font-size-xl)',
  },
  logoText: {
    fontSize: 'var(--font-size-lg)',
    fontWeight: 'var(--font-weight-semibold)',
    letterSpacing: '-0.2px',
    color: '#FFFFFF',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  toggleButton: {
    width: 32,
    height: 32,
    borderRadius: 'var(--border-radius-full)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'rgba(255, 255, 255, 0.72)',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    fontSize: 'var(--font-size-sm)',
  },
  nav: {
    flex: 1,
    padding: 'var(--spacing-md)',
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--spacing-xs)',
  },
  navLink: {
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--spacing-md)',
    padding: 'var(--spacing-sm) var(--spacing-md)',
    borderRadius: 'var(--border-radius-full)',
    fontSize: 'var(--font-size-sm)',
    fontWeight: 'var(--font-weight-medium)',
    letterSpacing: '-0.1px',
    transition: 'background-color 0.15s ease, color 0.15s ease',
    textDecoration: 'none',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
  },
  navIcon: {
    fontSize: 'var(--font-size-lg)',
    flexShrink: 0,
    width: 24,
    textAlign: 'center',
  },
  navLabel: {
    transition: 'opacity 0.15s ease',
  },
  sidebarFooter: {
    padding: 'var(--spacing-md)',
  },
  logoutButton: {
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--spacing-md)',
    width: '100%',
    padding: 'var(--spacing-sm) var(--spacing-md)',
    borderRadius: 'var(--border-radius-full)',
    color: 'rgba(255, 255, 255, 0.62)',
    fontSize: 'var(--font-size-sm)',
    fontWeight: 'var(--font-weight-medium)',
    transition: 'background-color 0.15s ease, color 0.15s ease',
  },
  logoutIcon: {
    fontSize: 'var(--font-size-lg)',
  },
  logoutLabel: {
    whiteSpace: 'nowrap',
  },
  main: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    transition: 'margin-left 0.2s ease',
    minHeight: '100vh',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 'var(--header-height)',
    padding: '0 var(--spacing-xl)',
    backgroundColor: 'color-mix(in srgb, var(--color-background) 80%, transparent)',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    borderBottom: '1px solid var(--color-divider)',
    position: 'sticky',
    top: 0,
    zIndex: 50,
  },
  pageTitle: {
    fontSize: 'var(--font-size-xl)',
    fontWeight: 'var(--font-weight-semibold)',
    letterSpacing: '-0.3px',
    color: 'var(--color-text-primary)',
  },
  headerActions: {
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--spacing-md)',
  },
  userBadge: {
    padding: '4px 12px',
    borderRadius: 'var(--border-radius-full)',
    backgroundColor: 'var(--color-primary)',
    color: 'var(--color-on-primary)',
    fontSize: 'var(--font-size-xs)',
    fontWeight: 'var(--font-weight-medium)',
    letterSpacing: '0.2px',
  },
  content: {
    flex: 1,
    padding: 'var(--spacing-xl)',
    maxWidth: '1400px',
    width: '100%',
    margin: '0 auto',
  },
};