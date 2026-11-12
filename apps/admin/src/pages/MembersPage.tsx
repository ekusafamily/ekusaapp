import React, { useEffect, useState } from 'react';
import { apiClient, handleResponse } from '../lib/apiClient';

interface MemberItem {
  id: string;
  registrationNumber?: string;
  campus?: string;
  course?: string;
  yearOfStudy?: number;
  membershipStatus?: string;
  createdAt?: string;
  submittedAt?: string;
  user?: {
    id: string;
    username: string;
    email?: string;
    accountStatus: string;
    createdAt: string;
    profile?: { displayName?: string; avatarObjectKey?: string };
  };
  username?: string;
  email?: string;
  accountStatus?: string;
  profile?: { displayName?: string; avatarObjectKey?: string };
}

export function MembersPage() {
  const [items, setItems] = useState<MemberItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    const fetchMembers = async () => {
      setIsLoading(true);
      setError('');
      try {
        const response = await apiClient.get('/admin/memberships', {
          params: { status: statusFilter, page, limit: 20 },
        });
        const data = handleResponse(response);
        setItems(data.items || []);
        setTotalPages(data.totalPages || 1);
      } catch (err: any) {
        setError('Failed to load members');
      } finally {
        setIsLoading(false);
      }
    };
    fetchMembers();
  }, [page, statusFilter]);

  const statusColors: Record<string, string> = {
    registered: 'var(--color-text-tertiary)',
    pending: 'var(--color-warning)',
    membership_pending: 'var(--color-warning)',
    verified: 'var(--color-success)',
    verified_member: 'var(--color-success)',
    rejected: 'var(--color-error)',
    suspended: 'var(--color-warning)',
    deactivated: 'var(--color-text-tertiary)',
  };

  const statusLabels: Record<string, string> = {
    registered: 'Registered',
    pending: 'Pending',
    membership_pending: 'Pending',
    verified: 'Verified',
    verified_member: 'Verified',
    rejected: 'Rejected',
    suspended: 'Suspended',
    deactivated: 'Deactivated',
  };

  const filteredItems = items.filter(item => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    const userInfo = item.user || item;
    const name = userInfo.profile?.displayName || userInfo.username || '';
    const username = userInfo.username || '';
    const regNo = item.registrationNumber || '';
    const campus = item.campus || '';
    return name.toLowerCase().includes(q) || username.toLowerCase().includes(q) || regNo.toLowerCase().includes(q) || campus.toLowerCase().includes(q);
  });

  if (isLoading) return <div style={styles.loading}>Loading members...</div>;
  if (error) return <div style={styles.error}>{error}</div>;

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2 style={styles.title}>Members Directory</h2>
        <div style={styles.filters}>
          <select style={styles.select} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="all">All Statuses</option>
            <option value="pending">Pending Verification</option>
            <option value="verified">Verified Members</option>
            <option value="rejected">Rejected</option>
          </select>
          <input
            type="text"
            style={styles.searchInput}
            placeholder="Search by name, username, reg no..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div style={styles.tableContainer}>
        <table style={styles.table}>
          <thead>
            <tr style={styles.headerRow}>
              <th style={styles.headerCell}>Member</th>
              <th style={styles.headerCell}>Reg. Number</th>
              <th style={styles.headerCell}>Campus & Course</th>
              <th style={styles.headerCell}>Account Status</th>
              <th style={styles.headerCell}>Membership</th>
              <th style={styles.headerCell}>Joined / Submitted</th>
            </tr>
          </thead>
          <tbody>
            {filteredItems.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ ...styles.cell, textAlign: 'center', padding: 'var(--spacing-xl)' }}>
                  No members found matching criteria
                </td>
              </tr>
            ) : (
              filteredItems.map(item => {
                const u = item.user || item;
                const username = u.username || 'Unknown';
                const displayName = u.profile?.displayName || username;
                const accountStatus = u.accountStatus || 'registered';
                const memStatus = item.membershipStatus || 'none';
                const dateStr = item.submittedAt || u.createdAt || item.createdAt;

                return (
                  <tr key={item.id} style={styles.row}>
                    <td style={styles.cell}>
                      <div style={styles.userInfo}>
                        <div style={{ ...styles.avatar, backgroundColor: 'var(--color-primary-container)' }}>
                          {displayName[0]?.toUpperCase() || 'U'}
                        </div>
                        <div>
                          <span style={styles.userName}>{displayName}</span>
                          <span style={styles.userUsername}>@{username}</span>
                        </div>
                      </div>
                    </td>
                    <td style={styles.cell}>{item.registrationNumber || 'N/A'}</td>
                    <td style={styles.cell}>
                      {item.campus ? (
                        <div>
                          <span style={{ display: 'block', fontWeight: 'var(--font-weight-medium)' }}>{item.campus}</span>
                          <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-tertiary)' }}>
                            {item.course} {item.yearOfStudy ? `(Year ${item.yearOfStudy})` : ''}
                          </span>
                        </div>
                      ) : 'N/A'}
                    </td>
                    <td style={styles.cell}>
                      <span style={{
                        ...styles.statusBadge,
                        backgroundColor: `color-mix(in srgb, ${statusColors[accountStatus] || 'var(--color-text-tertiary)'} 12%, transparent)`,
                        color: statusColors[accountStatus] || 'var(--color-text-tertiary)',
                      }}>
                        {statusLabels[accountStatus] || accountStatus}
                      </span>
                    </td>
                    <td style={styles.cell}>
                      <span style={{
                        ...styles.statusBadge,
                        backgroundColor: `color-mix(in srgb, ${statusColors[memStatus] || 'var(--color-text-tertiary)'} 12%, transparent)`,
                        color: statusColors[memStatus] || 'var(--color-text-tertiary)',
                      }}>
                        {statusLabels[memStatus] || memStatus}
                      </span>
                    </td>
                    <td style={styles.cell}>
                      {dateStr ? new Date(dateStr).toLocaleDateString() : 'N/A'}
                    </td>
                  </tr>
                );
              })
            )}
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