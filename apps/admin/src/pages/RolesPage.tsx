import React, { useEffect, useState } from 'react';
import { apiClient, handleResponse } from '../lib/apiClient';

interface Role {
  id: string;
  name: string;
  displayName: string;
  description?: string;
  permissions: string[];
  userCount: number;
}

export function RolesPage() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formData, setFormData] = useState({ name: '', displayName: '', description: '', permissions: [] as string[] });

  useEffect(() => {
    const fetch = async () => {
      try {
        const response = await apiClient.get('/admin/roles');
        setRoles(handleResponse(response));
      } catch { }
      finally { setIsLoading(false); }
    };
    fetch();
  }, []);

  const handleCreate = async () => {
    try {
      await apiClient.post('/admin/roles', formData);
      setShowCreateModal(false);
      setFormData({ name: '', displayName: '', description: '', permissions: [] });
      const response = await apiClient.get('/admin/roles');
      setRoles(handleResponse(response));
    } catch { alert('Failed to create role'); }
  };

  const allPermissions = [
    'publish_announcements', 'approve_membership', 'create_events', 'manage_welfare',
    'manage_finances', 'manage_admins', 'view_audit_logs', 'manage_settings',
    'manage_community', 'manage_leadership'
  ];

  if (isLoading) return <div style={styles.loading}>Loading...</div>;

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2 style={styles.title}>Roles & Permissions</h2>
        <button style={styles.createButton} onClick={() => setShowCreateModal(true)}>Create Role</button>
      </div>

      <div style={styles.grid}>
        {roles.map(r => (
          <div key={r.id} style={styles.card}>
            <h3 style={styles.cardTitle}>{r.displayName}</h3>
            <p style={styles.cardDesc}>{r.description}</p>
            <div style={styles.permissions}>
              {r.permissions.map(p => (
                <span key={p} style={styles.permissionTag}>{p}</span>
              ))}
            </div>
            <div style={styles.cardFooter}>
              <span style={styles.userCount}>{r.userCount} users</span>
            </div>
          </div>
        ))}
      </div>

      {showCreateModal && (
        <div style={styles.modalOverlay} onClick={() => setShowCreateModal(false)}>
          <div style={styles.modal} onClick={e=>e.stopPropagation()}>
            <h3 style={styles.modalTitle}>Create Role</h3>
            <div style={styles.formGroup}><label style={styles.label}>Name (slug)</label><input style={styles.input} value={formData.name} onChange={e=>setFormData({...formData, name:e.target.value})} placeholder="e.g., event_coordinator" /></div>
            <div style={styles.formGroup}><label style={styles.label}>Display Name</label><input style={styles.input} value={formData.displayName} onChange={e=>setFormData({...formData, displayName:e.target.value})} placeholder="Event Coordinator" /></div>
            <div style={styles.formGroup}><label style={styles.label}>Description</label><textarea style={styles.textarea} value={formData.description} onChange={e=>setFormData({...formData, description:e.target.value})} rows={3} /></div>
            <div style={styles.formGroup}><label style={styles.label}>Permissions</label>
              <div style={styles.permissionGrid}>
                {allPermissions.map(p => (
                  <label key={p} style={styles.permissionCheckbox}>
                    <input type="checkbox" checked={formData.permissions.includes(p)} onChange={e=>setFormData(prev=>({...prev, permissions:e.target.checked?[...prev.permissions,p]:prev.permissions.filter(x=>x!==p)]})} />
                    <span>{p}</span>
                  </label>
                ))}
              </div>
            </div>
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

const styles = {
  container:{display:'flex',flexDirection:'column',gap:'var(--spacing-lg)'},
  loading:{display:'flex',justifyContent:'center',alignItems:'center',padding:'var(--spacing-xxl)',color:'var(--color-text-secondary)'},
  header:{display:'flex',justifyContent:'space-between',alignItems:'center'},
  title:{fontSize:'var(--font-size-xxl)',fontWeight:'var(--font-weight-semibold)',color:'var(--color-text-primary)'},
  createButton:{padding:'var(--spacing-sm) var(--spacing-lg)',borderRadius:'var(--border-radius-md)',backgroundColor:'var(--color-primary)',color:'var(--color-on-primary)',fontSize:'var(--font-size-sm)',fontWeight:'var(--font-weight-medium)'},
  grid:{display:'grid',gridTemplateColumns:'repeat(auto-fill, minmax(320px, 1fr))',gap:'var(--spacing-lg)'},
  card:{backgroundColor:'var(--color-surface)',borderRadius:'var(--border-radius-lg)',border:'1px solid var(--color-border)',padding:'var(--spacing-lg)'},
  cardTitle:{fontSize:'var(--font-size-lg)',fontWeight:'var(--font-weight-semibold)',color:'var(--color-text-primary)',marginBottom:'var(--spacing-xs)'},
  cardDesc:{fontSize:'var(--font-size-sm)',color:'var(--color-text-secondary)',marginBottom:'var(--spacing-md)'},
  permissions:{display:'flex',flexWrap:'wrap',gap:'var(--spacing-xs)',marginBottom:'var(--spacing-md)'},
  permissionTag:{padding:'var(--spacing-xs) var(--spacing-sm)',borderRadius:'var(--border-radius-full)',backgroundColor:'var(--color-primary-container)',color:'var(--color-primary)',fontSize:'var(--font-size-xs)',fontWeight:'var(--font-weight-medium)'},
  cardFooter:{paddingTop:'var(--spacing-md)',borderTop:'1px solid var(--color-divider)'},
  userCount:{fontSize:'var(--font-size-xs)',color:'var(--color-text-tertiary)'},
  modalOverlay:{position:'fixed',inset:0,backgroundColor:'rgba(0,0,0,0.5)',display:'flex',justifyContent:'center',alignItems:'center',zIndex:1000,padding:'var(--spacing-lg)'},
  modal:{backgroundColor:'var(--color-surface)',borderRadius:'var(--border-radius-lg)',padding:'var(--spacing-xl)',maxWidth:600,width:'100%',maxHeight:'90vh',overflowY:'auto'},
  modalTitle:{fontSize:'var(--font-size-xl)',fontWeight:'var(--font-weight-semibold)',marginBottom:'var(--spacing-lg)',color:'var(--color-text-primary)'},
  formGroup:{marginBottom:'var(--spacing-md)'},
  label:{display:'block',fontSize:'var(--font-size-sm)',fontWeight:'var(--font-weight-medium)',marginBottom:'var(--spacing-xs)',color:'var(--color-text-primary)'},
  input:{width:'100%',padding:'var(--spacing-sm) var(--spacing-md)',border:'1px solid var(--color-border)',borderRadius:'var(--border-radius-md)',fontSize:'var(--font-size-sm)',fontFamily:'inherit'},
  textarea:{width:'100%',padding:'var(--spacing-sm) var(--spacing-md)',border:'1px solid var(--color-border)',borderRadius:'var(--border-radius-md)',fontSize:'var(--font-size-sm)',fontFamily:'inherit',resize:'vertical'},
  permissionGrid:{display:'grid',gridTemplateColumns:'repeat(auto-fill, minmax(180px, 1fr))',gap:'var(--spacing-sm)'},
  permissionCheckbox:{display:'flex',alignItems:'center',gap:'var(--spacing-sm)',cursor:'pointer',fontSize:'var(--font-size-sm)'},
  modalButtons:{display:'flex',justifyContent:'flex-end',gap:'var(--spacing-md)',marginTop:'var(--spacing-lg)'},
  cancelButton:{padding:'var(--spacing-sm) var(--spacing-lg)',borderRadius:'var(--border-radius-md)',backgroundColor:'var(--color-surface-variant)',color:'var(--color-text-secondary)',fontSize:'var(--font-size-sm)',fontWeight:'var(--font-weight-medium)',border:'1px solid var(--color-border)'},
  confirmButton:{padding:'var(--spacing-sm) var(--spacing-lg)',borderRadius:'var(--border-radius-md)',backgroundColor:'var(--color-primary)',color:'var(--color-on-primary)',fontSize:'var(--font-size-sm)',fontWeight:'var(--font-weight-medium)'},
};