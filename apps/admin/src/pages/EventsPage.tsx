import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';
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

interface EventFormData {
  title: string;
  description: string;
  category: string;
  venue: string;
  startAt: string;
  endAt: string;
  registrationDeadline: string;
  capacity: number;
  eligibility: string;
  registrationFee: number;
}

export function EventsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState('published');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [formData, setFormData] = useState<EventFormData>({
    title: '',
    description: '',
    category: '',
    venue: '',
    startAt: '',
    endAt: '',
    registrationDeadline: '',
    capacity: 0,
    eligibility: '',
    registrationFee: 0,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  useEffect(() => {
    const fetch = async () => {
      setIsLoading(true);
      setError('');
      try {
        const response = await apiClient.get('/admin/events', { params: { status: statusFilter, page, limit: 20 } });
        const data = handleResponse(response);
        setEvents(data.items);
        setTotalPages(data.totalPages);
      } catch {
        setError('Failed to load events');
      } finally { setIsLoading(false); }
    };
    fetch();
  }, [page, statusFilter]);

  // Populate form when editing
  useEffect(() => {
    if (editingEvent) {
      setFormData({
        title: editingEvent.title,
        description: editingEvent.description,
        category: editingEvent.category,
        venue: editingEvent.venue,
        startAt: editingEvent.startAt.slice(0, 16),
        endAt: editingEvent.endAt.slice(0, 16),
        registrationDeadline: editingEvent.registrationDeadline.slice(0, 16),
        capacity: editingEvent.capacity || 0,
        eligibility: '',
        registrationFee: editingEvent.registrationFee,
      });
    } else {
      setFormData({
        title: '',
        description: '',
        category: '',
        venue: '',
        startAt: '',
        endAt: '',
        registrationDeadline: '',
        capacity: 0,
        eligibility: '',
        registrationFee: 0,
      });
    }
  }, [editingEvent]);

  const statusColors: Record<string, string> = {
    draft: 'var(--color-text-tertiary)',
    published: 'var(--color-success)',
    cancelled: 'var(--color-error)',
    completed: 'var(--color-info)',
    archived: 'var(--color-text-tertiary)',
  };

  const handleOpenCreate = () => {
    setEditingEvent(null);
    setSubmitError('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (event: Event) => {
    setEditingEvent(event);
    setSubmitError('');
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingEvent(null);
    setSubmitError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitError('');

    try {
      const payload = {
        title: formData.title,
        description: formData.description,
        category: formData.category,
        venue: formData.venue,
        startAt: new Date(formData.startAt).toISOString(),
        endAt: new Date(formData.endAt).toISOString(),
        registrationDeadline: new Date(formData.registrationDeadline).toISOString(),
        capacity: formData.capacity || undefined,
        eligibility: formData.eligibility,
        registrationFee: formData.registrationFee,
        status: 'published', // Auto-publish on create
      };

      if (editingEvent) {
        await apiClient.patch(`/admin/events/${editingEvent.id}`, payload);
      } else {
        await apiClient.post('/admin/events', payload);
      }

      // Refresh events list
      const response = await apiClient.get('/admin/events', { params: { status: statusFilter, page, limit: 20 } });
      const data = handleResponse(response);
      setEvents(data.items);
      setTotalPages(data.totalPages);

      handleCloseModal();
    } catch (error: any) {
      setSubmitError(error.response?.data?.error?.message || error.message || 'Failed to save event');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: keyof EventFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (isLoading) return <div style={styles.loading}>Loading events...</div>;

  if (error) {
    return (
      <div style={styles.container}>
        <div style={{ ...styles.error, padding: 'var(--spacing-lg)' }}>{error}</div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2 style={styles.title}>Events</h2>
        <div style={{ display: 'flex', gap: 'var(--spacing-md)', alignItems: 'center' }}>
          <select style={styles.select} value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
            <option value="all">All</option>
            <option value="published">Published</option>
            <option value="cancelled">Cancelled</option>
            <option value="completed">Completed</option>
          </select>
          <button style={styles.createButton} onClick={handleOpenCreate}>Create Event</button>
        </div>
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
            {events.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ ...styles.cell, textAlign: 'center', padding: 'var(--spacing-xl)', color: 'var(--color-text-tertiary)' }}>
                  No events found for this filter
                </td>
              </tr>
            ) : (
            events.map(e => (
              <tr key={e.id} style={styles.row}>
                <td style={styles.cell}><strong>{e.title}</strong></td>
                <td style={styles.cell}>{e.category}</td>
                <td style={styles.cell}>{new Date(e.startAt).toLocaleDateString()}</td>
                <td style={styles.cell}>{e.venue}</td>
                <td style={styles.cell}>{e.registrationCount}/{e.capacity || 'Unlimited'}</td>
                <td style={styles.cell}><span style={{...styles.statusBadge, backgroundColor:`color-mix(in srgb, ${statusColors[e.status]} 12%, transparent)`, color:statusColors[e.status]}}>{e.status}</span></td>
                <td style={styles.cell}>
                  <div style={styles.actions}>
                    <button style={styles.viewButton} onClick={() => handleOpenEdit(e)}>View/Edit</button>
                  </div>
                </td>
              </tr>
            ))
            )}
          </tbody>
        </table>
      </div>

      <div style={styles.pagination}>
        <button style={styles.pageButton} onClick={() => setPage(p => Math.max(1, p-1))} disabled={page===1}>Previous</button>
        <span style={styles.pageInfo}>Page {page} of {totalPages}</span>
        <button style={styles.pageButton} onClick={() => setPage(p => Math.min(totalPages, p+1))} disabled={page===totalPages}>Next</button>
      </div>

      {/* Event Modal */}
      {isModalOpen && (
        <div style={styles.modalOverlay} onClick={handleCloseModal}>
          <div style={styles.modal} onClick={e => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}>{editingEvent ? 'Edit Event' : 'Create Event'}</h3>
              <button style={styles.modalClose} onClick={handleCloseModal} aria-label="Close"><X size={18} /></button>
            </div>
            <form onSubmit={handleSubmit} style={styles.form}>
              {submitError && <div style={styles.error}>{submitError}</div>}
              <div style={styles.formRow}>
                <label style={styles.label}>Title *</label>
                <input
                  style={styles.input}
                  type="text"
                  value={formData.title}
                  onChange={e => handleInputChange('title', e.target.value)}
                  required
                />
              </div>
              <div style={styles.formRow}>
                <label style={styles.label}>Description</label>
                <textarea
                  style={{ ...styles.input, minHeight: '80px' }}
                  value={formData.description}
                  onChange={e => handleInputChange('description', e.target.value)}
                />
              </div>
              <div style={styles.formRow}>
                <label style={styles.label}>Category *</label>
                <select
                  style={styles.input}
                  value={formData.category}
                  onChange={e => handleInputChange('category', e.target.value)}
                  required
                >
                  <option value="">Select category</option>
                  <option value="academic">Academic</option>
                  <option value="social">Social</option>
                  <option value="sports">Sports</option>
                  <option value="cultural">Cultural</option>
                  <option value="workshop">Workshop</option>
                  <option value="conference">Conference</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div style={styles.formRow}>
                <label style={styles.label}>Venue *</label>
                <input
                  style={styles.input}
                  type="text"
                  value={formData.venue}
                  onChange={e => handleInputChange('venue', e.target.value)}
                  required
                />
              </div>
              <div style={styles.formRow}>
                <label style={styles.label}>Start Date/Time *</label>
                <input
                  style={styles.input}
                  type="datetime-local"
                  value={formData.startAt}
                  onChange={e => handleInputChange('startAt', e.target.value)}
                  required
                />
              </div>
              <div style={styles.formRow}>
                <label style={styles.label}>End Date/Time *</label>
                <input
                  style={styles.input}
                  type="datetime-local"
                  value={formData.endAt}
                  onChange={e => handleInputChange('endAt', e.target.value)}
                  required
                />
              </div>
              <div style={styles.formRow}>
                <label style={styles.label}>Registration Deadline *</label>
                <input
                  style={styles.input}
                  type="datetime-local"
                  value={formData.registrationDeadline}
                  onChange={e => handleInputChange('registrationDeadline', e.target.value)}
                  required
                />
              </div>
              <div style={styles.formRow}>
                <label style={styles.label}>Capacity</label>
                <input
                  style={styles.input}
                  type="number"
                  value={formData.capacity}
                  onChange={e => handleInputChange('capacity', parseInt(e.target.value) || 0)}
                  min="0"
                />
              </div>
              <div style={styles.formRow}>
                <label style={styles.label}>Eligibility</label>
                <input
                  style={styles.input}
                  type="text"
                  value={formData.eligibility}
                  onChange={e => handleInputChange('eligibility', e.target.value)}
                  placeholder="e.g., All students, Final year only, etc."
                />
              </div>
              <div style={styles.formRow}>
                <label style={styles.label}>Registration Fee</label>
                <input
                  style={styles.input}
                  type="number"
                  value={formData.registrationFee}
                  onChange={e => handleInputChange('registrationFee', parseFloat(e.target.value) || 0)}
                  min="0"
                  step="0.01"
                />
              </div>
              <div style={styles.formActions}>
                <button type="button" style={styles.cancelButton} onClick={handleCloseModal}>Cancel</button>
                <button type="submit" style={styles.submitButton} disabled={isSubmitting}>
                  {isSubmitting ? 'Saving...' : (editingEvent ? 'Update' : 'Create')}
                </button>
              </div>
            </form>
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
  createButton:{padding:'var(--spacing-sm) var(--spacing-md)',borderRadius:'var(--border-radius-md)',backgroundColor:'var(--color-primary)',color:'var(--color-on-primary)',fontSize:'var(--font-size-sm)',fontWeight:'var(--font-weight-medium)'},
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
  // Modal styles
  modalOverlay:{position:'fixed',top:0,left:0,right:0,bottom:0,backgroundColor:'rgba(0,0,0,0.5)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:1000,padding:'var(--spacing-lg)'},
  modal:{backgroundColor:'var(--color-surface)',borderRadius:'var(--border-radius-lg)',width:'100%',maxWidth:'600px',maxHeight:'90vh',overflowY:'auto',boxShadow:'var(--shadow-lg)'},
  modalHeader:{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'var(--spacing-lg)',borderBottom:'1px solid var(--color-border)'},
  modalTitle:{fontSize:'var(--font-size-xl)',fontWeight:'var(--font-weight-semibold)',color:'var(--color-text-primary)',margin:0},
  modalClose:{background:'none',border:'none',fontSize:'var(--font-size-xxl)',cursor:'pointer',color:'var(--color-text-tertiary)',lineHeight:1},
  form:{padding:'var(--spacing-lg)',display:'flex',flexDirection:'column',gap:'var(--spacing-md)'},
  formRow:{display:'flex',flexDirection:'column',gap:'var(--spacing-xs)'},
  label:{fontSize:'var(--font-size-sm)',fontWeight:'var(--font-weight-medium)',color:'var(--color-text-primary)'},
  input:{padding:'var(--spacing-sm) var(--spacing-md)',border:'1px solid var(--color-border)',borderRadius:'var(--border-radius-md)',fontSize:'var(--font-size-sm)',backgroundColor:'var(--color-background)',color:'var(--color-text-primary)'},
  error:{padding:'var(--spacing-sm)',backgroundColor:'var(--color-error-container)',color:'var(--color-error)',borderRadius:'var(--border-radius-md)',fontSize:'var(--font-size-sm)'},
  formActions:{display:'flex',justifyContent:'flex-end',gap:'var(--spacing-md)',marginTop:'var(--spacing-md)'},
  cancelButton:{padding:'var(--spacing-sm) var(--spacing-md)',borderRadius:'var(--border-radius-md)',backgroundColor:'var(--color-surface-variant)',color:'var(--color-text-secondary)',fontSize:'var(--font-size-sm)',fontWeight:'var(--font-weight-medium)',border:'1px solid var(--color-border)'},
  submitButton:{padding:'var(--spacing-sm) var(--spacing-md)',borderRadius:'var(--border-radius-md)',backgroundColor:'var(--color-primary)',color:'var(--color-on-primary)',fontSize:'var(--font-size-sm)',fontWeight:'var(--font-weight-medium)'},
};