import React, { useEffect, useState } from 'react';
import { Users, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { apiClient } from '../lib/apiClient';

interface DashboardStats {
  totalUsers: number;
  verifiedMembers: number;
  pendingMemberships: number;
  recentAnnouncements: any[];
  upcomingEvents: number;
  eventRegistrations: number;
  openWelfareRequests: number;
  recentAuditLogs: any[];
}

export function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await apiClient.get('/admin/dashboard');
        setStats(response.data?.data ?? response.data);
      } catch (err: any) {
        setError('Failed to load dashboard statistics');
      } finally {
        setIsLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (isLoading) {
    return <div style={styles.loading}>Loading dashboard...</div>;
  }

  if (error) {
    return <div style={styles.error}>{error}</div>;
  }

  return (
    <div style={styles.container}>
      <div style={styles.statsGrid}>
        <StatCard
          title="Total Users"
          value={stats?.totalUsers || 0}
          icon={<Users size={24} color="var(--color-primary)" />}
          color="var(--color-primary)"
        />
        <StatCard
          title="Verified Members"
          value={stats?.verifiedMembers || 0}
          icon={<CheckCircle size={24} color="var(--color-success)" />}
          color="var(--color-success)"
        />
        <StatCard
          title="Pending Memberships"
          value={stats?.pendingMemberships || 0}
          icon={<Clock size={24} color="var(--color-warning)" />}
          color="var(--color-warning)"
        />
        <StatCard
          title="Open Welfare Requests"
          value={stats?.openWelfareRequests || 0}
          icon={<AlertCircle size={24} color="var(--color-error)" />}
          color="var(--color-error)"
        />
      </div>

      <div style={styles.chartsGrid}>
        <div style={styles.chartCard}>
          <h3 style={styles.chartTitle}>Recent Announcements</h3>
          <div style={styles.announcementList}>
            {Array.isArray(stats?.recentAnnouncements) && stats.recentAnnouncements.slice(0, 5).map((ann: any) => (
              <div key={ann.id} style={styles.announcementItem}>
                <div style={styles.announcementInfo}>
                  <span style={styles.announcementTitle}>{ann.title}</span>
                  <span style={styles.announcementMeta}>
                    {ann.priority} • {ann.publishedAt ? new Date(ann.publishedAt).toLocaleDateString() : 'Draft'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div style={styles.chartCard}>
          <h3 style={styles.chartTitle}>Quick Stats</h3>
          <div style={styles.quickStats}>
            <QuickStat label="Upcoming Events" value={stats?.upcomingEvents || 0} />
            <QuickStat label="Event Registrations" value={stats?.eventRegistrations || 0} />
            <QuickStat label="Recent Activity" value={stats?.recentAuditLogs?.length || 0} />
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon, color }: { title: string; value: number; icon: React.ReactNode; color: string }) {
  return (
    <div style={styles.statCard}>
      <div style={{ ...styles.statIcon, backgroundColor: `color-mix(in srgb, ${color} 12%, transparent)` }}>
        {icon}
      </div>
      <div style={styles.statContent}>
        <span style={styles.statValue}>{value.toLocaleString()}</span>
        <span style={styles.statTitle}>{title}</span>
      </div>
    </div>
  );
}

function QuickStat({ label, value }: { label: string; value: number }) {
  return (
    <div style={styles.quickStat}>
      <span style={styles.quickStatValue}>{value}</span>
      <span style={styles.quickStatLabel}>{label}</span>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--spacing-xl)',
  },
  loading: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 'var(--spacing-xxl)',
    color: 'var(--color-text-secondary)',
  },
  error: {
    padding: 'var(--spacing-lg)',
    borderRadius: 'var(--border-radius-md)',
    backgroundColor: 'var(--color-error-container)',
    color: 'var(--color-error)',
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
    gap: 'var(--spacing-lg)',
  },
  statCard: {
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--spacing-md)',
    padding: 'var(--spacing-lg)',
    backgroundColor: 'var(--color-surface)',
    borderRadius: 'var(--border-radius-lg)',
    border: '1px solid var(--color-border)',
    boxShadow: 'var(--shadow-sm)',
  },
  statIcon: {
    width: 56,
    height: 56,
    borderRadius: 'var(--border-radius-lg)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statContent: {
    display: 'flex',
    flexDirection: 'column',
  },
  statValue: {
    fontSize: 'var(--font-size-xxxl)',
    fontWeight: 'var(--font-weight-bold)',
    color: 'var(--color-text-primary)',
    lineHeight: 1,
  },
  statTitle: {
    fontSize: 'var(--font-size-sm)',
    color: 'var(--color-text-secondary)',
    marginTop: 'var(--spacing-xs)',
  },
  chartsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
    gap: 'var(--spacing-lg)',
  },
  chartCard: {
    backgroundColor: 'var(--color-surface)',
    borderRadius: 'var(--border-radius-lg)',
    border: '1px solid var(--color-border)',
    padding: 'var(--spacing-lg)',
    boxShadow: 'var(--shadow-sm)',
  },
  chartTitle: {
    fontSize: 'var(--font-size-lg)',
    fontWeight: 'var(--font-weight-semibold)',
    color: 'var(--color-text-primary)',
    marginBottom: 'var(--spacing-lg)',
  },
  announcementList: {
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--spacing-md)',
  },
  announcementItem: {
    padding: 'var(--spacing-md)',
    backgroundColor: 'var(--color-surface-variant)',
    borderRadius: 'var(--border-radius-md)',
  },
  announcementInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--spacing-xs)',
  },
  announcementTitle: {
    fontSize: 'var(--font-size-md)',
    fontWeight: 'var(--font-weight-medium)',
    color: 'var(--color-text-primary)',
  },
  announcementMeta: {
    fontSize: 'var(--font-size-xs)',
    color: 'var(--color-text-tertiary)',
  },
  quickStats: {
    display: 'flex',
    gap: 'var(--spacing-xl)',
  },
  quickStat: {
    flex: 1,
    textAlign: 'center',
    padding: 'var(--spacing-lg)',
    backgroundColor: 'var(--color-surface-variant)',
    borderRadius: 'var(--border-radius-md)',
  },
  quickStatValue: {
    display: 'block',
    fontSize: 'var(--font-size-xxxl)',
    fontWeight: 'var(--font-weight-bold)',
    color: 'var(--color-primary)',
    lineHeight: 1,
  },
  quickStatLabel: {
    fontSize: 'var(--font-size-sm)',
    color: 'var(--color-text-secondary)',
    marginTop: 'var(--spacing-xs)',
  },
};