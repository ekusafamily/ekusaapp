import React, { useEffect, useState } from 'react';
import { apiClient, handleResponse } from '../lib/apiClient';

interface MembershipApplication {
  id: string;
  userId: string;
  registrationNumber: string;
  campus: string;
  course: string;
  yearOfStudy: number;
  contactInfo?: string;
  membershipStatus: string;
  submittedAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
  rejectionReason?: string;
  user: {
    id: string;
    username: string;
    email?: string;
    profile?: { displayName?: string; avatarObjectKey?: string };
  };
}

export function MembershipPage() {
  const [applications, setApplications] = useState<MembershipApplication[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState('pending');
  const [selectedApp, setSelectedApp] = useState<MembershipApplication | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [reviewData, setReviewData] = useState({ action: 'approve', rejectionReason: '' });

  useEffect(() => {
    const fetchApplications = async () => {
      try {
        const response = await apiClient.get('/admin/memberships', {
          params: { status: statusFilter, page, limit: 20 },
        });
        const data = handleResponse(response);
        setApplications(data.items);
        setTotalPages(data.totalPages);
      } catch (err: any) {
        setError('Failed to load applications');
      } finally {
        setIsLoading(false);
      }
    };
    fetchApplications();
  }, [page, statusFilter]);

  const handleReview = async (app: MembershipApplication, action: 'approve' | 'reject') => {
    setSelectedApp(app);
    setReviewData({ action, rejectionReason: '' });
    setShowModal(true);
  };

  const confirmReview = async () => {
    if (!selectedApp) return;
    try {
      if (reviewData.action === 'approve') {
        await apiClient.patch(`/admin/memberships/${selectedApp.id}/approve`);
      } else {
        if (!reviewData.rejectionReason.trim()) {
          alert('Rejection reason is required');
          return;
        }
        await apiClient.patch(`/admin/memberships/${selectedApp.id}/reject`, {
          rejectionReason: reviewData.rejectionReason,
        });
      }
      setShowModal(false);
      setSelectedApp(null);
      // Refresh
      const response = await apiClient.get('/admin/memberships', {
        params: { status: statusFilter, page, limit: 20 },
      });
      setApplications(handleResponse(response).items);
    } catch (err: any) {
      alert('Failed to process application');
    }
  };

  const statusColors: Record<string, string> = {
    pending: 'var(--color-warning)',
    verified: 'var(--color-success)',
    rejected: 'var(--color-error)',
    suspended: 'var(--color-warning)',
  };

  if (isLoading) return <div style={styles.loading}>Loading applications...</div>;
  if (error) return <div style={styles.error}>{error}</div>;

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2 style={styles.title}>Membership Applications</h2>
        <select style={styles.select} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="pending">Pending</option>
          <option value="verified">Verified</option>
          <option value="rejected">Rejected</option>
          <option value="all">All</option>
        </select>
      </div>

      <div style={styles.tableContainer}>
        <table style={styles.table}>
          <thead>
            <tr style={styles.headerRow}>
              <th style={styles.headerCell}>Applicant</th>
              <th style={styles.headerCell}>Reg. Number</th>
              <th style={styles.headerCell}>Campus</th>
              <th style={styles.headerCell}>Course</th>
              <th style={styles.headerCell}>Year</th>
              <th style={styles.headerCell}>Submitted</th>
              <th style={styles.headerCell}>Status</th>
              <th style={styles.headerCell}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {applications.map(app => (
              <tr key={app.id} style={styles.row}>
                <td style={styles.cell}>
                  <div style={styles.userInfo}>
                    <div style={{ ...styles.avatar, backgroundColor: 'var(--color-primary-container)' }}>
                      {app.user.profile?.displayName?.[0]?.toUpperCase() || app.user.username[0].toUpperCase()}
                    </div>
                    <div>
                      <span style={styles.userName}>{app.user.profile?.displayName || app.user.username}</span>
                      <span style={styles.userUsername}>@{app.user.username}</span>
                    </div>
                  </div>
                </td>
                <td style={styles.cell}>{app.registrationNumber}</td>
                <td style={styles.cell}>{app.campus}</td>
                <td style={styles.cell}>{app.course}</td>
                <td style={styles.cell}>Year {app.yearOfStudy}</td>
                <td style={styles.cell}>{new Date(app.submittedAt).toLocaleDateString()}</td>
                <td style={styles.cell}>
                  <span style={{
                    ...styles.statusBadge,
                    backgroundColor: `${statusColors[app.membershipStatus] || 'var(--color-text-tertiary)'}20`,
                    color: statusColors[app.membershipStatus] || 'var(--color-text-tertiary)',
                  }}>
                    {app.membershipStatus}
                  </span>
                </td>
                <td style={styles.cell}>
                  {app.membershipStatus === 'pending' && (
                    <div style={styles.actions}>
                      <button style={styles.approveButton} onClick={() => handleReview(app, 'approve')}>
                        Approve
                      </button>
                      <button style={styles.rejectButton} onClick={() => handleReview(app, 'reject')}>
                        Reject
                      </button>
                    </div>
                  )}
                  {app.membershipStatus !== 'pending' && (
                    <span style={styles.reviewedBy}>
                      Reviewed by {app.reviewedBy}
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={styles.pagination}>
        <button style={styles.pageButton} onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>
          Previous
        </button>
        <span style={styles.pageInfo}>Page {page} of {totalPages}</span>
        <button style={styles.pageButton} onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>
          Next
        </button>
      </div>

      {/* Review Modal */}
      {showModal && selectedApp && (
        <div style={styles.modalOverlay} onClick={() => setShowModal(false)}>
          <div style={styles.modal} onClick={e => e.stopPropagation()}>
            <h3 style={styles.modalTitle}>Review Application</h3>
            <p style={styles.modalText}>
              <strong>{selectedApp.user.profile?.displayName || selectedApp.user.username}</strong> ({selectedApp.registrationNumber})
            </p>
            <p style={styles.modalText}>{selectedApp.campus} • {selectedApp.course} • Year {selectedApp.yearOfStudy}</p>

            <div style={styles.modalActions}>
              <label style={styles.radioLabel}>
                <input
                  type="radio"
                  name="action"
                  value="approve"
                  checked={reviewData.action === 'approve'}
                  onChange={(e) => setReviewData(prev => ({ ...prev, action: e.target.value as 'approve' | 'reject' }))}
                />
                <span style={styles.radioTextApprove}>Approve</span>
              </label>
              <label style={styles.radioLabel}>
                <input
                  type="radio"
                  name="action"
                  value="reject"
                  checked={reviewData.action === 'reject'}
                  onChange={(e) => setReviewData(prev => ({ ...prev, action: e.target.value as 'approve' | 'reject' }))}
                />
                <span style={styles.radioTextReject}>Reject</span>
              </label>
            </div>

            {reviewData.action === 'reject' && (
              <div style={styles.rejectionReasonGroup}>
                <label style={styles.label}>Rejection Reason *</label>
                <textarea
                  style={styles.textarea}
                  value={reviewData.rejectionReason}
                  onChange={(e) => setReviewData(prev => ({ ...prev, rejectionReason: e.target.value }))}
                  placeholder="Explain why this application is being rejected..."
                  rows={4}
                  required
                />
              </div>
            )}

            <div style={styles.modalButtons}>
              <button style={styles.cancelButton} onClick={() => setShowModal(false)}>Cancel</button>
              <button style={{ ...styles.confirmButton, backgroundColor: reviewData.action === 'approve' ? 'var(--color-success)' : 'var(--color-error)' }}
                onClick={confirmReview}>
                {reviewData.action === 'approve' ? 'Approve' : 'Reject'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: { display: 'flex', flexDirection: 'column', gap: 'var(--spacing-lg)' },
  loading: { display: 'flex', justifyContent: 'center', alignItems: 'center', padding: 'var(--spacing-xxl)', color: 'var(--color-text-secondary)' },
  error: { padding: 'var(--spacing-lg)', borderRadius: 'var(--border-radius-md)', backgroundColor: 'var(--color-error-container)', color: 'var(--color-error)' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 'var(--spacing-md)' },
  title: { fontSize: 'var(--font-size-xxl)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--color-text-primary)' },
  select: { padding: 'var(--spacing-sm) var(--spacing-md)', border: '1px solid var(--color-border)', borderRadius: 'var(--border-radius-md)', fontSize: 'var(--font-size-sm)', backgroundColor: 'var(--color-surface)' },
  tableContainer: { overflowX: 'auto', backgroundColor: 'var(--color-surface)', borderRadius: 'var(--border-radius-lg)', border: '1px solid var(--color-border)' },
  table: { width: '100%', borderCollapse: 'collapse' },
  headerRow: { backgroundColor: 'var(--color-surface-variant)' },
  headerCell: { padding: 'var(--spacing-md)', textAlign: 'left', fontSize: 'var(--font-size-xs)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--color-text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '1px solid var(--color-border)' },
  row: { borderBottom: '1px solid var(--color-divider)' },
  cell: { padding: 'var(--spacing-md)', fontSize: 'var(--font-size-sm)', color: 'var(--color-text-primary)' },
  userInfo: { display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)' },
  avatar: { width: 36, height: 36, borderRadius: 'var(--border-radius-full)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'var(--font-weight-semibold)', fontSize: 'var(--font-size-sm)', color: 'var(--color-primary)' },
  userName: { display: 'block', fontWeight: 'var(--font-weight-medium)' },
  userUsername: { display: 'block', fontSize: 'var(--font-size-xs)', color: 'var(--color-text-tertiary)' },
  statusBadge: { display: 'inline-flex', padding: 'var(--spacing-xs) var(--spacing-sm)', borderRadius: 'var(--border-radius-full)', fontSize: 'var(--font-size-xs)', fontWeight: 'var(--font-weight-medium)' },
  actions: { display: 'flex', gap: 'var(--spacing-sm)' },
  approveButton: { padding: 'var(--spacing-xs) var(--spacing-md)', borderRadius: 'var(--border-radius-sm)', backgroundColor: 'var(--color-success)', color: 'var(--color-on-primary)', fontSize: 'var(--font-size-xs)', fontWeight: 'var(--font-weight-medium)' },
  rejectButton: { padding: 'var(--spacing-xs) var(--spacing-md)', borderRadius: 'var(--border-radius-sm)', backgroundColor: 'var(--color-error)', color: 'var(--color-on-primary)', fontSize: 'var(--font-size-xs)', fontWeight: 'var(--font-weight-medium)' },
  reviewedBy: { fontSize: 'var(--font-size-xs)', color: 'var(--color-text-tertiary)' },
  pagination: { display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 'var(--spacing-md)', padding: 'var(--spacing-md)' },
  pageButton: { padding: 'var(--spacing-sm) var(--spacing-md)', borderRadius: 'var(--border-radius-md)', backgroundColor: 'var(--color-primary)', color: 'var(--color-on-primary)', fontSize: 'var(--font-size-sm)' },
  pageInfo: { fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' },
  modalOverlay: { position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, padding: 'var(--spacing-lg)' },
  modal: { backgroundColor: 'var(--color-surface)', borderRadius: 'var(--border-radius-lg)', padding: 'var(--spacing-xl)', maxWidth: 500, width: '100%', maxHeight: '90vh', overflowY: 'auto' },
  modalTitle: { fontSize: 'var(--font-size-xl)', fontWeight: 'var(--font-weight-semibold)', marginBottom: 'var(--spacing-md)', color: 'var(--color-text-primary)' },
  modalText: { color: 'var(--color-text-secondary)', marginBottom: 'var(--spacing-xs)' },
  modalActions: { display: 'flex', gap: 'var(--spacing-lg)', marginBottom: 'var(--spacing-lg)' },
  radioLabel: { display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)', cursor: 'pointer' },
  radioTextApprove: { color: 'var(--color-success)', fontWeight: 'var(--font-weight-medium)' },
  radioTextReject: { color: 'var(--color-error)', fontWeight: 'var(--font-weight-medium)' },
  rejectionReasonGroup: { marginBottom: 'var(--spacing-lg)' },
  label: { display: 'block', fontSize: 'var(--font-size-sm)', fontWeight: 'var(--font-weight-medium)', marginBottom: 'var(--spacing-xs)', color: 'var(--color-text-primary)' },
  textarea: { width: '100%', padding: 'var(--spacing-md)', border: '1px solid var(--color-border)', borderRadius: 'var(--border-radius-md)', fontSize: 'var(--font-size-sm)', fontFamily: 'inherit', resize: 'vertical' },
  modalButtons: { display: 'flex', justifyContent: 'flex-end', gap: 'var(--spacing-md)' },
  cancelButton: { padding: 'var(--spacing-sm) var(--spacing-lg)', borderRadius: 'var(--border-radius-md)', backgroundColor: 'var(--color-surface-variant)', color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)', fontWeight: 'var(--font-weight-medium)', border: '1px solid var(--color-border)' },
  confirmButton: { padding: 'var(--spacing-sm) var(--spacing-lg)', borderRadius: 'var(--border-radius-md)', color: 'var(--color-on-primary)', fontSize: 'var(--font-size-sm)', fontWeight: 'var(--font-weight-medium)' },
};