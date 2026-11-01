import React, { useEffect, useState } from 'react';
import { apiClient, handleResponse } from '../lib/apiClient';

interface Event {
  id: string;
  title: string;
  description: string;
  category: string;
  venue: string;
  startAt: string;
  endAt: string;
  registrationDeadline: string;
  capacity?: number;
  registrationFee: number;
  status: string;
  createdByName: string;
  registrationCount: number;
}

export function EventsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState('published');

  useEffect(() => {
    const fetch = async () => {
      try {
        const response = await apiClient.get('/admin/events', { params: { status: statusFilter, page, limit: 20 } });
        const data = handleResponse(response);
        setEvents(data.items);
        setTotalPages(data.totalPages);
      } catch { }
      finally { setIsLoading(false); }
    };
    fetch();
  }, [page, statusFilter]);

  const statusColors: Record<string, string> = {
    draft: 'var(--color-text-tertiary)',
    published: 'var(--color-success)',
    cancelled: 'var(--color-error)',
    completed: 'var(--color-info)',
    archived: 'var(--color-text-tertiary)',
  };

  if (isLoading) return <div style={styles.loading}>Loading events...</div>;

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2 style={styles.title}>Events</h2>
        <select style={styles.select} value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          <option value="all">All</option>
          <option value="published">Published</option>
          <option value="draft">Draft</option>
          <option value="cancelled">Cancelled</option>
          <option value="completed">Completed</option>
        </select>
      </div>

      <div style={styles.tableContainer}>
        <table style={styles.table}>
          <thead><tr style={styles.headerRow}>
            <th style={styles.headerCell}>Event</th>
            <th style={styles.headerCell}>Category</th>
            <th style={styles.headerCell}>Date</th>
            <th style={styles.headerCell}>Venue</th>
            <th style={styles.headerCell}>Registrations</th>
            <th style={styles.headerCell}>Status</th>
            <th style={styles.headerCell}>Actions</th>
          </tr></thead>
          <tbody>
            {events.map(e => (
              <tr key={e.id} style={styles.row}>
                <td style={styles.cell}><strong>{e.title}</strong></td>
                <td style={styles.cell}>{e.category}</td>
                <td style={styles.cell}>{new Date(e.startAt).toLocaleDateString()}</td>
                <td style={styles.cell}>{e.venue}</td>
                <td style={styles.cell}>{e.registrationCount}/{e.capacity || '∞'}</td>
                <td style={styles.cell}><span style={{...styles.statusBadge, backgroundColor:`${statusColors[e.status]}20`, color:statusColors[e.status]}}>{e.status}</span></td>
                <td style={styles.cell}>
                  <div style={styles.actions}>
                    <button style={styles.viewButton}>View</button>
                    <button style={styles.editButton}>Edit</button>
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
  editButton:{padding:'var(--spacing-xs) var(--spacing-md)',borderRadius:'var(--border-radius-sm)',backgroundColor:'var(--color-surface-variant)',color:'var(--color-text-secondary)',fontSize:'var(--font-size-xs)',fontWeight:'var(--font-weight-medium)',border:'1px solid var(--color-border)'},
  pagination:{display:'flex',justifyContent:'center',alignItems:'center',gap:'var(--spacing-md)',padding:'var(--spacing-md)'},
  pageButton:{padding:'var(--spacing-sm) var(--spacing-md)',borderRadius:'var(--border-radius-md)',backgroundColor:'var(--color-primary)',color:'var(--color-on-primary)',fontSize:'var(--font-size-sm)'},
  pageInfo:{fontSize:'var(--font-size-sm)',color:'var(--color-text-secondary)'},
};