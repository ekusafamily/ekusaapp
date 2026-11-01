import React, { useEffect, useState } from 'react';
import { apiClient, handleResponse } from '../lib/apiClient';

interface Announcement {
  id: string;
  title: string;
  body: string;
  category: string;
  priority: string;
  publisherId: string;
  status: string;
  publishedAt?: string;
  scheduledAt?: string;
  expiresAt?: string;
  pinned: boolean;
  targets: Array<{ type: string; value: string }>;
  publisherName: string;
  readCount: number;
}

export function AnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formData, setFormData] = useState({
    title: '', body: '', category: 'general', priority: 'normal',
    targets: [{ type: 'everyone', value: '' }],
    scheduledAt: '', expiresAt: '', pinned: false
  });

  useEffect(() => {
    const fetch = async () => {
      try {
        const response = await apiClient.get('/admin/announcements', {
          params: { status: statusFilter, page, limit: 20 }
        });
        const data = handleResponse(response);
        setAnnouncements(data.items);
        setTotalPages(data.totalPages);
      } catch { setError('Failed to load announcements'); }
      finally { setIsLoading(false); }
    };
    fetch();
  }, [page, statusFilter]);

  const handleCreate = async () => {
    try {
      await apiClient.post('/admin/announcements', formData);
      setShowCreateModal(false);
      setFormData({ title: '', body: '', category: 'general', priority: 'normal', targets: [{ type: 'everyone', value: '' }], scheduledAt: '', expiresAt: '', pinned: false });
      const response = await apiClient.get('/admin/announcements', { params: { status: statusFilter, page, limit: 20 } });
      setAnnouncements(handleResponse(response).items);
    } catch { alert('Failed to create announcement'); }
  };

  const handlePublish = async (id: string) => {
    try { await apiClient.post(`/admin/announcements/${id}/publish`); } catch { alert('Failed to publish'); }
  };

  const priorityColors: Record<string, string> = { normal: 'var(--color-text-tertiary)', important: 'var(--color-warning)', urgent: 'var(--color-error)' };
  const statusColors: Record<string, string> = { draft: 'var(--color-text-tertiary)', scheduled: 'var(--color-info)', published: 'var(--color-success)', archived: 'var(--color-text-tertiary)' };

  if (isLoading) return <div style={styles.loading}>Loading...</div>;

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2 style={styles.title}>Announcements</h2>
        <div style={styles.headerActions}>
          <select style={styles.select} value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
            <option value="all">All</option>
            <option value="published">Published</option>
            <option value="draft">Draft</option>
            <option value="scheduled">Scheduled</option>
            <option value="archived">Archived</option>
          </select>
          <button style={styles.createButton} onClick={() => setShowCreateModal(true)}>Create Announcement</button>
        </div>
      </div>

      <div style={styles.tableContainer}>
        <table style={styles.table}>
          <thead><tr style={styles.headerRow}>
            <th style={styles.headerCell}>Title</th>
            <th style={styles.headerCell}>Category</th>
            <th style={styles.headerCell}>Priority</th>
            <th style={styles.headerCell}>Status</th>
            <th style={styles.headerCell}>Publisher</th>
            <th style={styles.headerCell}>Published</th>
            <th style={styles.headerCell}>Reads</th>
            <th style={styles.headerCell}>Actions</th>
          </tr></thead>
          <tbody>
            {announcements.map(a => (
              <tr key={a.id} style={styles.row}>
                <td style={styles.cell}><strong>{a.title}</strong></td>
                <td style={styles.cell}>{a.category}</td>
                <td style={styles.cell}><span style={{...styles.priorityBadge, backgroundColor:`${priorityColors[a.priority]}20`, color:priorityColors[a.priority]}}>{a.priority}</span></td>
                <td style={styles.cell}><span style={{...styles.statusBadge, backgroundColor:`${statusColors[a.status]}20`, color:statusColors[a.status]}}>{a.status}</span></td>
                <td style={styles.cell}>{a.publisherName}</td>
                <td style={styles.cell}>{a.publishedAt ? new Date(a.publishedAt).toLocaleDateString() : '-'}</td>
                <td style={styles.cell}>{a.readCount}</td>
                <td style={styles.cell}>
                  <div style={styles.actions}>
                    {a.status === 'draft' && <button style={styles.publishButton} onClick={() => handlePublish(a.id)}>Publish</button>}
                    {a.status === 'published' && <button style={styles.archiveButton} onClick={() => alert('Archive not implemented')}>Archive</button>}
                    <button style={styles.viewButton}>View</button>
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

      {/* Create Modal */}
      {showCreateModal && (
        <div style={styles.modalOverlay} onClick={() => setShowCreateModal(false)}>
          <div style={styles.modal} onClick={e=>e.stopPropagation()}>
            <h3 style={styles.modalTitle}>Create Announcement</h3>
            <div style={styles.formGroup}><label style={styles.label}>Title</label><input style={styles.input} value={formData.title} onChange={e=>setFormData({...formData, title:e.target.value})} placeholder="Announcement title" /></div>
            <div style={styles.formGroup}><label style={styles.label}>Body</label><textarea style={styles.textarea} value={formData.body} onChange={e=>setFormData({...formData, body:e.target.value})} placeholder="Full announcement text" rows={6} /></div>
            <div style={styles.formRow}>
              <div style={styles.formGroup}><label style={styles.label}>Category</label><select style={styles.select} value={formData.category} onChange={e=>setFormData({...formData, category:e.target.value})}><option value="general">General</option><option value="urgent">Urgent</option><option value="meeting">Meeting</option><option value="event">Event</option><option value="leadership">Leadership</option><option value="welfare">Welfare</option><option value="election">Election</option><option value="administrative">Administrative</option></select></div>
              <div style={styles.formGroup}><label style={styles.label}>Priority</label><select style={styles.select} value={formData.priority} onChange={e=>setFormData({...formData, priority:e.target.value})}><option value="normal">Normal</option><option value="important">Important</option><option value="urgent">Urgent</option></select></div>
            </div>
            <div style={styles.formGroup}><label style={styles.label}>Target Audience</label>
              <select style={styles.select} value={formData.targets[0].type} onChange={e=>setFormData({...formData, targets:[{type:e.target.value, value:''}]})}>
                <option value="everyone">Everyone</option>
                <option value="verified_members">Verified Members</option>
                <option value="unverified_users">Unverified Users</option>
              </select>
            </div>
            <div style={styles.formRow}>
              <div style={styles.formGroup}><label style={styles.label}>Schedule For</label><input type="datetime-local" style={styles.input} value={formData.scheduledAt} onChange={e=>setFormData({...formData, scheduledAt:e.target.value})} /></div>
              <div style={styles.formGroup}><label style={styles.label}>Expires At</label><input type="datetime-local" style={styles.input} value={formData.expiresAt} onChange={e=>setFormData({...formData, expiresAt:e.target.value})} /></div>
            </div>
            <label style={styles.checkboxLabel}><input type="checkbox" checked={formData.pinned} onChange={e=>setFormData({...formData, pinned:e.target.checked})} /> Pin to top</label>
            <div style={styles.modalButtons}>
              <button style={styles.cancelButton} onClick={()=>setShowCreateModal(false)}>Cancel</button>
              <button style={styles.confirmButton} onClick={handleCreate}>Create</button>
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
  header:{display:'flex',justifyContent:'space-between',alignItems:'center',gap:'var(--spacing-md)',flexWrap:'wrap'},
  title:{fontSize:'var(--font-size-xxl)',fontWeight:'var(--font-weight-semibold)',color:'var(--color-text-primary)'},
  headerActions:{display:'flex',gap:'var(--spacing-md)'},
  select:{padding:'var(--spacing-sm) var(--spacing-md)',border:'1px solid var(--color-border)',borderRadius:'var(--border-radius-md)',fontSize:'var(--font-size-sm)',backgroundColor:'var(--color-surface)'},
  createButton:{padding:'var(--spacing-sm) var(--spacing-lg)',borderRadius:'var(--border-radius-md)',backgroundColor:'var(--color-primary)',color:'var(--color-on-primary)',fontSize:'var(--font-size-sm)',fontWeight:'var(--font-weight-medium)'},
  tableContainer:{overflowX:'auto',backgroundColor:'var(--color-surface)',borderRadius:'var(--border-radius-lg)',border:'1px solid var(--color-border)'},
  table:{width:'100%',borderCollapse:'collapse'},
  headerRow:{backgroundColor:'var(--color-surface-variant)'},
  headerCell:{padding:'var(--spacing-md)',textAlign:'left',fontSize:'var(--font-size-xs)',fontWeight:'var(--font-weight-semibold)',color:'var(--color-text-tertiary)',textTransform:'uppercase',letterSpacing:'0.5px',borderBottom:'1px solid var(--color-border)'},
  row:{borderBottom:'1px solid var(--color-divider)'},
  cell:{padding:'var(--spacing-md)',fontSize:'var(--font-size-sm)',color:'var(--color-text-primary)'},
  priorityBadge:{display:'inline-flex',padding:'var(--spacing-xs) var(--spacing-sm)',borderRadius:'var(--border-radius-full)',fontSize:'var(--font-size-xs)',fontWeight:'var(--font-weight-medium)'},
  statusBadge:{display:'inline-flex',padding:'var(--spacing-xs) var(--spacing-sm)',borderRadius:'var(--border-radius-full)',fontSize:'var(--font-size-xs)',fontWeight:'var(--font-weight-medium)'},
  actions:{display:'flex',gap:'var(--spacing-sm)'},
  publishButton:{padding:'var(--spacing-xs) var(--spacing-md)',borderRadius:'var(--border-radius-sm)',backgroundColor:'var(--color-primary)',color:'var(--color-on-primary)',fontSize:'var(--font-size-xs)',fontWeight:'var(--font-weight-medium)'},
  archiveButton:{padding:'var(--spacing-xs) var(--spacing-md)',borderRadius:'var(--border-radius-sm)',backgroundColor:'var(--color-text-tertiary)',color:'var(--color-on-primary)',fontSize:'var(--font-size-xs)',fontWeight:'var(--font-weight-medium)'},
  viewButton:{padding:'var(--spacing-xs) var(--spacing-md)',borderRadius:'var(--border-radius-sm)',backgroundColor:'var(--color-surface-variant)',color:'var(--color-text-secondary)',fontSize:'var(--font-size-xs)',fontWeight:'var(--font-weight-medium)',border:'1px solid var(--color-border)'},
  pagination:{display:'flex',justifyContent:'center',alignItems:'center',gap:'var(--spacing-md)',padding:'var(--spacing-md)'},
  pageButton:{padding:'var(--spacing-sm) var(--spacing-md)',borderRadius:'var(--border-radius-md)',backgroundColor:'var(--color-primary)',color:'var(--color-on-primary)',fontSize:'var(--font-size-sm)'},
  pageInfo:{fontSize:'var(--font-size-sm)',color:'var(--color-text-secondary)'},
  modalOverlay:{position:'fixed',inset:0,backgroundColor:'rgba(0,0,0,0.5)',display:'flex',justifyContent:'center',alignItems:'center',zIndex:1000,padding:'var(--spacing-lg)'},
  modal:{backgroundColor:'var(--color-surface)',borderRadius:'var(--border-radius-lg)',padding:'var(--spacing-xl)',maxWidth:700,width:'100%',maxHeight:'90vh',overflowY:'auto'},
  modalTitle:{fontSize:'var(--font-size-xl)',fontWeight:'var(--font-weight-semibold)',marginBottom:'var(--spacing-lg)',color:'var(--color-text-primary)'},
  formGroup:{marginBottom:'var(--spacing-md)'},
  label:{display:'block',fontSize:'var(--font-size-sm)',fontWeight:'var(--font-weight-medium)',marginBottom:'var(--spacing-xs)',color:'var(--color-text-primary)'},
  input:{width:'100%',padding:'var(--spacing-sm) var(--spacing-md)',border:'1px solid var(--color-border)',borderRadius:'var(--border-radius-md)',fontSize:'var(--font-size-sm)',fontFamily:'inherit'},
  textarea:{width:'100%',padding:'var(--spacing-sm) var(--spacing-md)',border:'1px solid var(--color-border)',borderRadius:'var(--border-radius-md)',fontSize:'var(--size-sm)',fontFamily:'inherit',resize:'vertical'},
  formRow:{display:'flex',gap:'var(--spacing-md)'},
  checkboxLabel:{display:'flex',alignItems:'center',gap:'var(--spacing-sm)',marginBottom:'var(--spacing-lg)',cursor:'pointer'},
  modalButtons:{display:'flex',justifyContent:'flex-end',gap:'var(--spacing-md)'},
  cancelButton:{padding:'var(--spacing-sm) var(--spacing-lg)',borderRadius:'var(--border-radius-md)',backgroundColor:'var(--color-surface-variant)',color:'var(--color-text-secondary)',fontSize:'var(--font-size-sm)',fontWeight:'var(--font-weight-medium)',border:'1px solid var(--color-border)'},
  confirmButton:{padding:'var(--spacing-sm) var(--spacing-lg)',borderRadius:'var(--border-radius-md)',backgroundColor:'var(--color-primary)',color:'var(--color-on-primary)',fontSize:'var(--font-size-sm)',fontWeight:'var(--font-weight-medium)'},
};