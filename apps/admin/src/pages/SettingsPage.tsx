import React, { useEffect, useState } from 'react';
import { apiClient, handleResponse } from '../lib/apiClient';

interface Settings {
  appName: string;
  maintenanceMode: boolean;
  registrationEnabled: boolean;
  maxFileUploadSize: number;
  allowedImageTypes: string[];
  membershipAutoApprove: boolean;
  eventRegistrationEnabled: boolean;
  welfareEnabled: boolean;
  messagingEnabled: boolean;
}

export function SettingsPage() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const fetch = async () => {
      try {
        const response = await apiClient.get('/admin/settings');
        setSettings(handleResponse(response));
      } catch { }
      finally { setIsLoading(false); }
    };
    fetch();
  }, []);

  const handleChange = (key: string, value: any) => {
    setSettings(prev => prev ? { ...prev, [key]: value } : null);
  };

  const handleSave = async () => {
    try {
      await apiClient.patch('/admin/settings', settings);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch { alert('Failed to save settings'); }
  };

  if (isLoading) return <div style={styles.loading}>Loading...</div>;

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2 style={styles.title}>Platform Settings</h2>
        {saved && <span style={styles.savedBadge}>Saved</span>}
      </div>

      <div style={styles.card}>
        <h3 style={styles.sectionTitle}>General</h3>
        <div style={styles.formGroup}><label style={styles.label}>App Name</label><input style={styles.input} value={settings?.appName} onChange={e=>handleChange('appName', e.target.value)} /></div>
        <label style={styles.checkboxLabel}><input type="checkbox" checked={settings?.maintenanceMode} onChange={e=>handleChange('maintenanceMode', e.target.checked)} /> Maintenance Mode</label>
        <label style={styles.checkboxLabel}><input type="checkbox" checked={settings?.registrationEnabled} onChange={e=>handleChange('registrationEnabled', e.target.checked)} /> Enable Registration</label>
      </div>

      <div style={styles.card}>
        <h3 style={styles.sectionTitle}>File Upload</h3>
        <div style={styles.formGroup}><label style={styles.label}>Max File Size (MB)</label><input type="number" style={styles.input} value={(settings?.maxFileUploadSize || 0) / (1024*1024)} onChange={e=>handleChange('maxFileUploadSize', parseInt(e.target.value) * 1024 * 1024)} min="1" /></div>
      </div>

      <div style={styles.card}>
        <h3 style={styles.sectionTitle}>Features</h3>
        <label style={styles.checkboxLabel}><input type="checkbox" checked={settings?.membershipAutoApprove} onChange={e=>handleChange('membershipAutoApprove', e.target.checked)} /> Auto-approve membership</label>
        <label style={styles.checkboxLabel}><input type="checkbox" checked={settings?.eventRegistrationEnabled} onChange={e=>handleChange('eventRegistrationEnabled', e.target.checked)} /> Event Registration</label>
        <label style={styles.checkboxLabel}><input type="checkbox" checked={settings?.welfareEnabled} onChange={e=>handleChange('welfareEnabled', e.target.checked)} /> Welfare Module</label>
        <label style={styles.checkboxLabel}><input type="checkbox" checked={settings?.messagingEnabled} onChange={e=>handleChange('messagingEnabled', e.target.checked)} /> Private Messaging</label>
      </div>

      <div style={styles.saveBar}>
        <button style={styles.saveButton} onClick={handleSave}>Save Changes</button>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container:{display:'flex',flexDirection:'column',gap:'var(--spacing-lg)'},
  loading:{display:'flex',justifyContent:'center',alignItems:'center',padding:'var(--spacing-xxl)',color:'var(--color-text-secondary)'},
  header:{display:'flex',justifyContent:'space-between',alignItems:'center',gap:'var(--spacing-md)'},
  title:{fontSize:'var(--font-size-xxl)',fontWeight:'var(--font-weight-semibold)',color:'var(--color-text-primary)'},
  savedBadge:{padding:'var(--spacing-xs) var(--spacing-sm)',borderRadius:'var(--border-radius-full)',backgroundColor:'var(--color-success-container)',color:'var(--color-success)',fontSize:'var(--font-size-xs)',fontWeight:'var(--font-weight-medium)'},
  card:{backgroundColor:'var(--color-surface)',borderRadius:'var(--border-radius-lg)',border:'1px solid var(--color-border)',padding:'var(--spacing-lg)'},
  sectionTitle:{fontSize:'var(--font-size-lg)',fontWeight:'var(--font-weight-semibold)',marginBottom:'var(--spacing-lg)',color:'var(--color-text-primary)'},
  formGroup:{marginBottom:'var(--spacing-md)'},
  label:{display:'block',fontSize:'var(--font-size-sm)',fontWeight:'var(--font-weight-medium)',marginBottom:'var(--spacing-xs)',color:'var(--color-text-primary)'},
  input:{width:'100%',padding:'var(--spacing-sm) var(--spacing-md)',border:'1px solid var(--color-border)',borderRadius:'var(--border-radius-md)',fontSize:'var(--font-size-sm)',fontFamily:'inherit'},
  checkboxLabel:{display:'flex',alignItems:'center',gap:'var(--spacing-sm)',marginBottom:'var(--spacing-sm)',cursor:'pointer'},
  saveBar:{paddingTop:'var(--spacing-lg)',borderTop:'1px solid var(--color-divider)',display:'flex',justifyContent:'flex-end'},
  saveButton:{padding:'var(--spacing-sm) var(--spacing-lg)',borderRadius:'var(--border-radius-md)',backgroundColor:'var(--color-primary)',color:'var(--color-on-primary)',fontSize:'var(--font-size-sm)',fontWeight:'var(--font-weight-medium)'},
};