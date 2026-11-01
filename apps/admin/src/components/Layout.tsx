import React, { useState } from 'react';
import { Outlet, NavLink, useLocation } from 'react-router-dom';

const NAV_ITEMS = [
  { path: '/dashboard', label: 'Dashboard', icon: '📊' },
  { path: '/members', label: 'Members', icon: '👥' },
  { path: '/membership', label: 'Membership', icon: '🏷️' },
  { path: '/announcements', label: 'Announcements', icon: '📢' },
  { path: '/events', label: 'Events', icon: '📅' },
  { path: '/welfare', label: 'Welfare', icon: '🆘' },
  { path: '/communities', label: 'Communities', icon: '👥' },
  { path: '/leadership', label: 'Leadership', icon: '🎓' },
  { path: '/roles', label: 'Roles & Permissions', icon: '🔐' },
  { path: '/audit', label: 'Audit Logs', icon: '📋' },
  { path: '/settings', label: 'Settings', icon: '⚙️' },
];

export function Layout() {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const handleLogout = async () => {
    try {
      const { authApi } = await import('@ekusa/api-client');
      await authApi.logout();
      window.location.href = '/login';
    } catch (error) {
      console.error('Logout failed:', error);
    }
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
            {sidebarOpen ? '◀' : '▶'}
          </button>
        </div>

        <nav style={styles.nav}>
          {NAV_ITEMS.map(item => (
            <NavLink
              key={item.path}
              to={item.path}
              style={({ isActive }: { isActive: boolean }) => ({
                ...styles.navLink,
                backgroundColor: isActive ? 'var(--color-primary-container)' : 'transparent',
                color: isActive ? 'var(--color-primary)' : 'var(--color-text-secondary)',
                borderLeft: isActive ? '3px solid var(--color-primary)' : '3px solid transparent',
              })}
              end={item.path === '/dashboard'}
            >
              <span style={styles.navIcon}>{item.icon}</span>
              {sidebarOpen && <span style={styles.navLabel}>{item.label}</span>}
            </NavLink>
          ))}
        </nav>

        <div style={styles.sidebarFooter}>
          {sidebarOpen && (
            <button style={styles.logoutButton} onClick={handleLogout}>
              <span style={styles.logoutIcon}>🚪</span>
              <span style={styles.logoutLabel}>Logout</span>
            </button>
          )}
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
    backgroundColor: 'var(--color-surface)',
    borderRight: '1px solid var(--color-border)',
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
    borderBottom: '1px solid var(--color-border)',
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
    color: 'var(--color-text-primary)',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  toggleButton: {
    width: 32,
    height: 32,
    borderRadius: 'var(--border-radius-md)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'var(--color-text-secondary)',
    backgroundColor: 'var(--color-surface-variant)',
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
    borderRadius: 'var(--border-radius-md)',
    fontSize: 'var(--font-size-sm)',
    fontWeight: 'var(--font-weight-medium)',
    transition: 'all 0.15s ease',
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
    borderTop: '1px solid var(--color-border)',
  },
  logoutButton: {
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--spacing-md)',
    width: '100%',
    padding: 'var(--spacing-sm) var(--spacing-md)',
    borderRadius: 'var(--border-radius-md)',
    color: 'var(--color-error)',
    backgroundColor: 'var(--color-error-container)',
    fontSize: 'var(--font-size-sm)',
    fontWeight: 'var(--font-weight-medium)',
    transition: 'all 0.15s ease',
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
    padding: 'var(--spacing-md) var(--spacing-xl)',
    backgroundColor: 'var(--color-surface)',
    borderBottom: '1px solid var(--color-border)',
    position: 'sticky',
    top: 0,
    zIndex: 50,
  },
  pageTitle: {
    fontSize: 'var(--font-size-xxl)',
    fontWeight: 'var(--font-weight-semibold)',
    color: 'var(--color-text-primary)',
  },
  headerActions: {
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--spacing-md)',
  },
  userBadge: {
    padding: 'var(--spacing-xs) var(--spacing-sm)',
    borderRadius: 'var(--border-radius-full)',
    backgroundColor: 'var(--color-primary-container)',
    color: 'var(--color-primary)',
    fontSize: 'var(--font-size-xs)',
    fontWeight: 'var(--font-weight-semibold)',
  },
  content: {
    flex: 1,
    padding: 'var(--spacing-xl)',
    maxWidth: '1400px',
    width: '100%',
    margin: '0 auto',
  },
};