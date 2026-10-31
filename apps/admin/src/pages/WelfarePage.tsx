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
}

export function WelfarePage() {
  const [requests, setRequests] = useState<WelfareRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    const fetch = async () => {
      try {
        const response = await apiClient.get('/admin/welfare/requests', { params: { status: statusFilter, page, limit: 20 } });
        const data = handleResponse(response);
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
                    <button style={styles.viewButton}>View</button>
                    <button style={styles.updateButton}>Update</button>
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
    </div>
  );
}

const styles = {
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
};