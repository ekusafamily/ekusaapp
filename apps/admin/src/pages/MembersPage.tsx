import React, { useEffect, useState } from 'react';
import { apiClient, handleResponse } from '../lib/apiClient';

interface User {
  id: string;
  username: string;
  email?: string;
  accountStatus: string;
  createdAt: string;
  profile?: { displayName?: string; avatarObjectKey?: string };
  membership?: { membershipStatus: string };
}

export function MembersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await apiClient.get('/admin/memberships', {
          params: { status: statusFilter, page, limit: 20 },
        });
        const data = handleResponse(response);
        setUsers(data.items);
        setTotalPages(data.totalPages);
      } catch (err: any) {
        setError('Failed to load members');
      } finally {
        setIsLoading(false);
      }
    };
    fetchUsers();
  }, [page, statusFilter, search]);

  const statusColors: Record<string, string> = {
    registered: 'var(--color-text-tertiary)',
    membership_pending: 'var(--color-warning)',
    verified_member: 'var(--color-success)',
    rejected: 'var(--color-error)',
    suspended: 'var(--color-warning)',
    deactivated: 'var(--color-text-tertiary)',
  };

  const statusLabels: Record<string, string> = {
    registered: 'Registered',
    membership_pending: 'Pending',
    verified_member: 'Verified',
    rejected: 'Rejected',
    suspended: 'Suspended',
    deactivated: 'Deactivated',
  };

  if (isLoading) return <div style={styles.loading}>Loading members...</div>;
  if (error) return <div style={styles.error}>{error}</div>;

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2 style={styles.title}>Members</h2>
        <div style={styles.filters}>
          <select style={styles.select} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="all">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="verified">Verified</option>
            <option value="rejected">Rejected</option>
            <option value="suspended">Suspended</option>
          </select>
          <input
            type="text"
            style={styles.searchInput}
            placeholder="Search users..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div style={styles.tableContainer}>
        <table style={styles.table}>
          <thead>
            <tr style={styles.headerRow}>
              <th style={styles.headerCell}>User</th>
              <th style={styles.headerCell}>Status</th>
              <th style={styles.headerCell}>Membership</th>
              <th style={styles.headerCell}>Joined</th>
              <th style={styles.headerCell}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => (
              <tr key={user.id} style={styles.row}>
                <td style={styles.cell}>
                  <div style={styles.userInfo}>
                    <div style={{ ...styles.avatar, backgroundColor: 'var(--color-primary-container)' }}>
                      {user.profile?.displayName?.[0]?.toUpperCase() || user.username[0].toUpperCase()}
                    </div>
                    <div>
                      <span style={styles.userName}>{user.profile?.displayName || user.username}</span>
                      <span style={styles.userUsername}>@{user.username}</span>
                    </div>
                  </div>
                </td>
                <td style={styles.cell}>
                  <span style={{
                    ...styles.statusBadge,
                    backgroundColor: `${statusColors[user.accountStatus] || 'var(--color-text-tertiary)'}20`,
                    color: statusColors[user.accountStatus] || 'var(--color-text-tertiary)',
                  }}>
                    {statusLabels[user.accountStatus] || user.accountStatus}
                  </span>
                </td>
                <td style={styles.cell}>
                  <span style={{
                    ...styles.statusBadge,
                    backgroundColor: user.membership?.membershipStatus === 'verified'
                      ? 'var(--color-success-container)'
                      : 'var(--color-warning-container)',
                    color: user.membership?.membershipStatus === 'verified'
                      ? 'var(--color-success)'
                      : 'var(--color-warning)',
                  }}>
                    {user.membership?.membershipStatus || 'None'}
                  </span>
                </td>
                <td style={styles.cell}>
                  {new Date(user.createdAt).toLocaleDateString()}
                </td>
                <td style={styles.cell}>
                  <div style={styles.actions}>
                    <button style={styles.actionButton}>View</button>
                    <button style={styles.actionButtonSecondary}>Edit</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={styles.pagination}>
        <button
          style={styles.pageButton}
          onClick={() => setPage(p => Math.max(1, p - 1))}
          disabled={page === 1}
        >
          Previous
        </button>
        <span style={styles.pageInfo}>Page {page} of {totalPages}</span>
        <button
          style={styles.pageButton}
          onClick={() => setPage(p => Math.min(totalPages, p + 1))}
          disabled={page === totalPages}
        >
          Next
        </button>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--spacing-lg)',
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
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 'var(--spacing-md)',
    flexWrap: 'wrap',
  },
  title: {
    fontSize: 'var(--font-size-xxl)',
    fontWeight: 'var(--font-weight-semibold)',
    color: 'var(--color-text-primary)',
  },
  filters: {
    display: 'flex',
    gap: 'var(--spacing-md)',
  },
  select: {
    padding: 'var(--spacing-sm) var(--spacing-md)',
    border: '1px solid var(--color-border)',
    borderRadius: 'var(--border-radius-md)',
    fontSize: 'var(--font-size-sm)',
    backgroundColor: 'var(--color-surface)',
  },
  searchInput: {
    padding: 'var(--spacing-sm) var(--spacing-md)',
    border: '1px solid var(--color-border)',
    borderRadius: 'var(--border-radius-md)',
    fontSize: 'var(--font-size-sm)',
    width: 250,
  },
  tableContainer: {
    overflowX: 'auto',
    backgroundColor: 'var(--color-surface)',
    borderRadius: 'var(--border-radius-lg)',
    border: '1px solid var(--color-border)',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
  },
  headerRow: {
    backgroundColor: 'var(--color-surface-variant)',
  },
  headerCell: {
    padding: 'var(--spacing-md)',
    textAlign: 'left',
    fontSize: 'var(--font-size-xs)',
    fontWeight: 'var(--font-weight-semibold)',
    color: 'var(--color-text-tertiary)',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    borderBottom: '1px solid var(--color-border)',
  },
  row: {
    borderBottom: '1px solid var(--color-divider)',
  },
  cell: {
    padding: 'var(--spacing-md)',
    fontSize: 'var(--font-size-sm)',
    color: 'var(--color-text-primary)',
  },
  userInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--spacing-md)',
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 'var(--border-radius-full)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 'var(--font-weight-semibold)',
    fontSize: 'var(--font-size-sm)',
    color: 'var(--color-primary)',
  },
  userName: {
    display: 'block',
    fontWeight: 'var(--font-weight-medium)',
  },
  userUsername: {
    display: 'block',
    fontSize: 'var(--font-size-xs)',
    color: 'var(--color-text-tertiary)',
  },
  statusBadge: {
    display: 'inline-flex',
    padding: 'var(--spacing-xs) var(--spacing-sm)',
    borderRadius: 'var(--border-radius-full)',
    fontSize: 'var(--font-size-xs)',
    fontWeight: 'var(--font-weight-medium)',
  },
  actions: {
    display: 'flex',
    gap: 'var(--spacing-sm)',
  },
  actionButton: {
    padding: 'var(--spacing-xs) var(--spacing-md)',
    borderRadius: 'var(--border-radius-sm)',
    backgroundColor: 'var(--color-primary)',
    color: 'var(--color-on-primary)',
    fontSize: 'var(--font-size-xs)',
    fontWeight: 'var(--font-weight-medium)',
  },
  actionButtonSecondary: {
    padding: 'var(--spacing-xs) var(--spacing-md)',
    borderRadius: 'var(--border-radius-sm)',
    backgroundColor: 'var(--color-surface-variant)',
    color: 'var(--color-text-secondary)',
    fontSize: 'var(--font-size-xs)',
    fontWeight: 'var(--font-weight-medium)',
    border: '1px solid var(--color-border)',
  },
  pagination: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 'var(--spacing-md)',
    padding: 'var(--spacing-md)',
  },
  pageButton: {
    padding: 'var(--spacing-sm) var(--spacing-md)',
    borderRadius: 'var(--border-radius-md)',
    backgroundColor: 'var(--color-primary)',
    color: 'var(--color-on-primary)',
    fontSize: 'var(--font-size-sm)',
  },
  pageInfo: {
    fontSize: 'var(--font-size-sm)',
    color: 'var(--color-text-secondary)',
  },
};