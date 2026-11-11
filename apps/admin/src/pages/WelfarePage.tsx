import React, { useEffect, useState } from 'react';
import { apiClient, handleResponse } from '../lib/apiClient';

interface WelfareRequest {
  id: string;
  subject: string;
  description: string;
  category: string;
  status: string;
  user: { id: string; username: string; profile?: { displayName?: string } };
  assignedOfficer?: { id: string; username: string; profile?: { displayName?: string } };
  createdAt: string;
  updates?: Array<{ message: string; createdByName: string; createdAt: string }>;
}

interface WelfareUpdateData {
  status?: string;
  assignedOfficerId?: string | null;
  updateMessage: string;
}

export function WelfarePage() {
  const [requests, setRequests] = useState<WelfareRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [viewingRequest, setViewingRequest] = useState<WelfareRequest | null>(null);
  const [updateData, setUpdateData] = useState<WelfareUpdateData>({
    status: '',
    assignedOfficerId: null,
    updateMessage: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  useEffect(() => {
    const fetch = async () => {
      try {
        const response = await apiClient.get('/admin/welfare/requests', { params: { status: statusFilter, page, limit: 20 } });
        const data: any = handleResponse(response);
        setRequests(data.items);
        setTotalPages(data.totalPages);
      } catch { }
      finally { setIsLoading(false); }
    };
    fetch();
  }, [page, statusFilter]);

  const statusColors: Record<string, string> = {
    submitted: 'var(--color-warning)',
    under_review: 'var(--color-info)',
    in_progress: 'var(--color-primary)',
    awaiting_information: 'var(--color-warning)',
    resolved: 'var(--color-success)',
    closed: 'var(--color-text-tertiary)',
  };

  const statusOptions = [
    { value: 'submitted', label: 'Submitted' },
    { value: 'under_review', label: 'Under Review' },
    { value: 'in_progress', label: 'In Progress' },
    { value: 'awaiting_information', label: 'Awaiting Information' },
    { value: 'resolved', label: 'Resolved' },
    { value: 'closed', label: 'Closed' },
  ];

  const handleOpenView = async (request: WelfareRequest) => {
    // Fetch full details with updates
    try {
      const response = await apiClient.get(`/admin/welfare/requests/${request.id}`);
      const data: any = handleResponse(response);
      setViewingRequest(data);
      setUpdateData({
        status: data.status,
        assignedOfficerId: data.assignedOfficer?.id || null,
        updateMessage: '',
      });
      setSubmitError('');
      setIsModalOpen(true);
    } catch (error: any) {
      console.error('Failed to fetch request details:', error);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setViewingRequest(null);
    setSubmitError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!viewingRequest) return;
    setIsSubmitting(true);
    setSubmitError('');

    try {
      // Update status and assigned officer
      if (updateData.status !== viewingRequest.status || updateData.assignedOfficerId !== (viewingRequest.assignedOfficer?.id || null)) {
        await apiClient.patch(`/admin/welfare/requests/${viewingRequest.id}`, {
          status: updateData.status,
          assignedOfficerId: updateData.assignedOfficerId || undefined,
        });
      }

      // Add update message if provided
      if (updateData.updateMessage.trim()) {
        await apiClient.post(`/admin/welfare/requests/${viewingRequest.id}/updates`, {
          message: updateData.updateMessage.trim(),
        });
      }

      // Refresh the request
      const response = await apiClient.get(`/admin/welfare/requests/${viewingRequest.id}`);
      const data: any = handleResponse(response);
      setViewingRequest(data);

      // Also refresh the list
      const listResponse = await apiClient.get('/admin/welfare/requests', { params: { status: statusFilter, page, limit: 20 } });
      const listData: any = handleResponse(listResponse);
      setRequests(listData.items);

      setSubmitError('Updated successfully!');
      setTimeout(() => setSubmitError(''), 3000);
    } catch (error: any) {
      setSubmitError(error.response?.data?.error?.message || error.message || 'Failed to update request');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) return <div style={styles.loading}>Loading...</div>;

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2 style={styles.title}>Welfare Requests</h2>
        <select style={styles.select} value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          <option value="all">All</option>
          <option value="submitted">Submitted</option>
          <option value="under_review">Under Review</option>
          <option value="in_progress">In Progress</option>
          <option value="awaiting_information">Awaiting Info</option>
          <option value="resolved">Resolved</option>
          <option value="closed">Closed</option>
        </select>
      </div>

      <div style={styles.tableContainer}>
        <table style={styles.table}>
          <thead><tr style={styles.headerRow}>
            <th style={styles.headerCell}>Subject</th>
            <th style={styles.headerCell}>Category</th>
            <th style={styles.headerCell}>Student</th>
            <th style={styles.headerCell}>Status</th>
            <th style={styles.headerCell}>Assigned</th>
            <th style={styles.headerCell}>Created</th>
            <th style={styles.headerCell}>Actions</th>
          </tr></thead>
          <tbody>
            {requests.map(r => (
              <tr key={r.id} style={styles.row}>
                <td style={styles.cell}><strong>{r.subject}</strong></td>
                <td style={styles.cell}>{r.category}</td>
                <td style={styles.cell}>{r.user.profile?.displayName || r.user.username}</td>
                <td style={styles.cell}><span style={{...styles.statusBadge, backgroundColor:`${statusColors[r.status]}20`, color:statusColors[r.status]}}>{r.status.replace('_',' ')}</span></td>
                <td style={styles.cell}>{r.assignedOfficer?.profile?.displayName || r.assignedOfficer?.username || '-'}</td>
                <td style={styles.cell}>{new Date(r.createdAt).toLocaleDateString()}</td>
                <td style={styles.cell}>
                  <div style={styles.actions}>
                    <button style={styles.viewButton} onClick={() => handleOpenView(r)}>View/Update</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={styles.pagination}>
        <button style={styles.pageButton} onClick={() => setPage(p => Math.max(1, p-1))} disabled={page===1}>Previous</button>
        <span style={styles.pageInfo}>Page {page} of {totalPages}</span>
        <button style={styles.pageButton} onClick={() => setPage(p => Math.min(totalPages, p+1))} disabled={page===totalPages}>Next</button>
      </div>

      {/* Welfare Request Modal */}
      {isModalOpen && viewingRequest && (
        <div style={styles.modalOverlay} onClick={handleCloseModal}>
          <div style={styles.modal} onClick={e => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}>Welfare Request: {viewingRequest.subject}</h3>
              <button style={styles.modalClose} onClick={handleCloseModal}>×</button>
            </div>
            <div style={styles.modalContent}>
              <div style={styles.detailSection}>
                <h4 style={styles.detailTitle}>Request Details</h4>
                <div style={styles.detailRow}><span style={styles.detailLabel}>Category:</span> <span>{viewingRequest.category}</span></div>
                <div style={styles.detailRow}><span style={styles.detailLabel}>Student:</span> <span>{viewingRequest.user.profile?.displayName || viewingRequest.user.username}</span></div>
                <div style={styles.detailRow}><span style={styles.detailLabel}>Created:</span> <span>{new Date(viewingRequest.createdAt).toLocaleString()}</span></div>
                <div style={styles.detailRow}><span style={styles.detailLabel}>Description:</span></div>
                <div style={styles.detailDescription}>{viewingRequest.description}</div>
              </div>

              <div style={styles.detailSection}>
                <h4 style={styles.detailTitle}>Status & Assignment</h4>
                <form onSubmit={handleSubmit} style={styles.form}>
                  <div style={styles.formRow}>
                    <label style={styles.label}>Status</label>
                    <select
                      style={styles.input}
                      value={updateData.status}
                      onChange={e => setUpdateData(prev => ({ ...prev, status: e.target.value }))}
                    >
                      {statusOptions.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </div>
                  <div style={styles.formRow}>
                    <label style={styles.label}>Assigned Officer</label>
                    <select
                      style={styles.input}
                      value={updateData.assignedOfficerId || ''}
                      onChange={e => setUpdateData(prev => ({ ...prev, assignedOfficerId: e.target.value || null }))}
                    >
                      <option value="">Unassigned</option>
                      {/* In a real app, you'd fetch available welfare officers */}
                    </select>
                  </div>
                  <div style={styles.formRow}>
                    <label style={styles.label}>Add Update (optional)</label>
                    <textarea
                      style={{ ...styles.input, minHeight: '80px' }}
                      value={updateData.updateMessage}
                      onChange={e => setUpdateData(prev => ({ ...prev, updateMessage: e.target.value }))}
                      placeholder="Add a note or update for this request..."
                    />
                  </div>
                  {submitError && <div style={{...styles.error, marginTop: 'var(--spacing-sm)'}}>{submitError}</div>}
                  <div style={styles.formActions}>
                    <button type="button" style={styles.cancelButton} onClick={handleCloseModal}>Close</button>
                    <button type="submit" style={styles.submitButton} disabled={isSubmitting}>
                      {isSubmitting ? 'Saving...' : 'Save Changes'}
                    </button>
                  </div>
                </form>
              </div>

              {viewingRequest.updates && viewingRequest.updates.length > 0 && (
                <div style={styles.detailSection}>
                  <h4 style={styles.detailTitle}>Updates</h4>
                  {viewingRequest.updates.map((update: any, index: number) => (
                    <div key={index} style={styles.updateItem}>
                      <div style={styles.updateMeta}>
                        <span style={styles.updateAuthor}>{update.createdByName || 'System'}</span>
                        <span style={styles.updateTime}>{new Date(update.createdAt).toLocaleString()}</span>
                      </div>
                      <div style={styles.updateMessage}>{update.message}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {display:'flex',flexDirection:'column',gap:'var(--spacing-lg)'},
  loading:{display:'flex',justifyContent:'center',alignItems:'center',padding:'var(--spacing-xxl)',color:'var(--color-text-secondary)'},
  header:{display:'flex',justifyContent:'space-between',alignItems:'center',gap:'var(--spacing-md)'},
  title:{fontSize:'var(--font-size-xxl)',fontWeight:'var(--font-weight-semibold)',color:'var(--color-text-primary)'},
  select:{padding:'var(--spacing-sm) var(--spacing-md)',border:'1px solid var(--color-border)',borderRadius:'var(--border-radius-md)',fontSize:'var(--font-size-sm)',backgroundColor:'var(--color-surface)'},
  tableContainer:{overflowX:'auto',backgroundColor:'var(--color-surface)',borderRadius:'var(--border-radius-lg)',border:'1px solid var(--color-border)'},
  table:{width:'100%',borderCollapse:'collapse'},
  headerRow:{backgroundColor:'var(--color-surface-variant)'},
  headerCell:{padding:'var(--spacing-md)',textAlign:'left',fontSize:'var(--font-size-xs)',fontWeight:'var(--font-weight-semibold)',color:'var(--color-text-tertiary)',textTransform:'uppercase',letterSpacing:'0.5px',borderBottom:'1px solid var(--color-border)'},
  row:{borderBottom:'1px solid var(--color-divider)'},
  cell:{padding:'var(--spacing-md)',fontSize:'var(--font-size-sm)',color:'var(--color-text-primary)'},
  statusBadge:{display:'inline-flex',padding:'var(--spacing-xs) var(--spacing-sm)',borderRadius:'var(--border-radius-full)',fontSize:'var(--font-size-xs)',fontWeight:'var(--font-weight-medium)'},
  actions:{display:'flex',gap:'var(--spacing-sm)'},
  viewButton:{padding:'var(--spacing-xs) var(--spacing-md)',borderRadius:'var(--border-radius-sm)',backgroundColor:'var(--color-primary)',color:'var(--color-on-primary)',fontSize:'var(--font-size-xs)',fontWeight:'var(--font-weight-medium)'},
  updateButton:{padding:'var(--spacing-xs) var(--spacing-md)',borderRadius:'var(--border-radius-sm)',backgroundColor:'var(--color-surface-variant)',color:'var(--color-text-secondary)',fontSize:'var(--font-size-xs)',fontWeight:'var(--font-weight-medium)',border:'1px solid var(--color-border)'},
  pagination:{display:'flex',justifyContent:'center',alignItems:'center',gap:'var(--spacing-md)',padding:'var(--spacing-md)'},
  pageButton:{padding:'var(--spacing-sm) var(--spacing-md)',borderRadius:'var(--border-radius-md)',backgroundColor:'var(--color-primary)',color:'var(--color-on-primary)',fontSize:'var(--font-size-sm)'},
  pageInfo:{fontSize:'var(--font-size-sm)',color:'var(--color-text-secondary)'},
  // Modal styles
  modalOverlay:{position:'fixed',top:0,left:0,right:0,bottom:0,backgroundColor:'rgba(0,0,0,0.5)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:1000,padding:'var(--spacing-lg)'},
  modal:{backgroundColor:'var(--color-surface)',borderRadius:'var(--border-radius-lg)',width:'100%',maxWidth:'700px',maxHeight:'90vh',overflowY:'auto',boxShadow:'var(--shadow-xl)'},
  modalHeader:{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'var(--spacing-lg)',borderBottom:'1px solid var(--color-border)'},
  modalTitle:{fontSize:'var(--font-size-xl)',fontWeight:'var(--font-weight-semibold)',color:'var(--color-text-primary)',margin:0},
  modalClose:{background:'none',border:'none',fontSize:'var(--font-size-xxl)',cursor:'pointer',color:'var(--color-text-tertiary)',lineHeight:1},
  modalContent:{padding:'var(--spacing-lg)',display:'flex',flexDirection:'column',gap:'var(--spacing-xl)'},
  detailSection:{display:'flex',flexDirection:'column',gap:'var(--spacing-md)'},
  detailTitle:{fontSize:'var(--font-size-lg)',fontWeight:'var(--font-weight-semibold)',color:'var(--color-text-primary)',margin:0,paddingBottom:'var(--spacing-sm)',borderBottom:'1px solid var(--color-divider)'},
  detailRow:{display:'flex',gap:'var(--spacing-md)',alignItems:'flex-start'},
  detailLabel:{fontWeight:'var(--font-weight-medium)',color:'var(--color-text-secondary)',minWidth:'120px'},
  detailDescription:{paddingTop:'var(--spacing-xs)',color:'var(--color-text-primary)',whiteSpace:'pre-wrap'},
  form:{display:'flex',flexDirection:'column',gap:'var(--spacing-md)'},
  formRow:{display:'flex',flexDirection:'column',gap:'var(--spacing-xs)'},
  label:{fontSize:'var(--font-size-sm)',fontWeight:'var(--font-weight-medium)',color:'var(--color-text-primary)'},
  input:{padding:'var(--spacing-sm) var(--spacing-md)',border:'1px solid var(--color-border)',borderRadius:'var(--border-radius-md)',fontSize:'var(--font-size-sm)',backgroundColor:'var(--color-background)',color:'var(--color-text-primary)'},
  error:{padding:'var(--spacing-sm)',backgroundColor:'var(--color-error-container)',color:'var(--color-on-error-container)',borderRadius:'var(--border-radius-md)',fontSize:'var(--font-size-sm)'},
  formActions:{display:'flex',justifyContent:'flex-end',gap:'var(--spacing-md)',marginTop:'var(--spacing-md)'},
  cancelButton:{padding:'var(--spacing-sm) var(--spacing-md)',borderRadius:'var(--border-radius-md)',backgroundColor:'var(--color-surface-variant)',color:'var(--color-text-secondary)',fontSize:'var(--font-size-sm)',fontWeight:'var(--font-weight-medium)',border:'1px solid var(--color-border)'},
  submitButton:{padding:'var(--spacing-sm) var(--spacing-md)',borderRadius:'var(--border-radius-md)',backgroundColor:'var(--color-primary)',color:'var(--color-on-primary)',fontSize:'var(--font-size-sm)',fontWeight:'var(--font-weight-medium)'},
  updateItem:{padding:'var(--spacing-md)',backgroundColor:'var(--color-surface-variant)',borderRadius:'var(--border-radius-md)',marginBottom:'var(--spacing-sm)'},
  updateMeta:{display:'flex',justifyContent:'space-between',fontSize:'var(--font-size-xs)',color:'var(--color-text-tertiary)',marginBottom:'var(--spacing-xs)'},
  updateAuthor:{fontWeight:'var(--font-weight-medium)'},
  updateMessage:{fontSize:'var(--font-size-sm)',color:'var(--color-text-primary)',whiteSpace:'pre-wrap'},
};