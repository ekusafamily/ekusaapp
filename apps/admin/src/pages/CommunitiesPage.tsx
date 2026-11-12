import React, { useEffect, useState } from 'react';
import { apiClient, handleResponse } from '../lib/apiClient';

interface Community {
  id: string;
  name: string;
  description: string;
  type: string;
  isPublic: boolean;
  memberCount: number;
  createdBy: string;
  createdAt: string;
}

export function CommunitiesPage() {
  const [communities, setCommunities] = useState<Community[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    const fetch = async () => {
      setIsLoading(true);
      setError('');
      try {
        const response = await apiClient.get('/communities', { params: { page, limit: 20 } });
        const data = handleResponse(response);
        setCommunities(data.items);
        setTotalPages(data.totalPages);
      } catch {
        setError('Failed to load communities');
      } finally { setIsLoading(false); }
    };
    fetch();
  }, [page]);

  if (isLoading) return <div style={styles.loading}>Loading...</div>;

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
        <h2 style={styles.title}>Communities</h2>
      </div>

      <div style={styles.tableContainer}>
        <table style={styles.table}>
          <thead><tr style={styles.headerRow}>
            <th style={styles.headerCell}>Name</th>
            <th style={styles.headerCell}>Type</th>
            <th style={styles.headerCell}>Visibility</th>
            <th style={styles.headerCell}>Members</th>
            <th style={styles.headerCell}>Created</th>
            <th style={styles.headerCell}>Actions</th>
          </tr></thead>
          <tbody>
            {communities.map(c => (
              <tr key={c.id} style={styles.row}>
                <td style={styles.cell}><strong>{c.name}</strong></td>
                <td style={styles.cell}>{c.type}</td>
                <td style={styles.cell}>{c.isPublic ? 'Public' : 'Private'}</td>
                <td style={styles.cell}>{c.memberCount}</td>
                <td style={styles.cell}>{new Date(c.createdAt).toLocaleDateString()}</td>
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
  error:{padding:'var(--spacing-lg)',borderRadius:'var(--border-radius-md)',backgroundColor:'var(--color-error-container)',color:'var(--color-error)'},
  header:{display:'flex',justifyContent:'space-between',alignItems:'center',gap:'var(--spacing-md)'},
  title:{fontSize:'var(--font-size-xxl)',fontWeight:'var(--font-weight-semibold)',color:'var(--color-text-primary)'},
  tableContainer:{overflowX:'auto',backgroundColor:'var(--color-surface)',borderRadius:'var(--border-radius-lg)',border:'1px solid var(--color-border)'},
  table:{width:'100%',borderCollapse:'collapse'},
  headerRow:{backgroundColor:'var(--color-surface-variant)'},
  headerCell:{padding:'var(--spacing-md)',textAlign:'left',fontSize:'var(--font-size-xs)',fontWeight:'var(--font-weight-semibold)',color:'var(--color-text-tertiary)',textTransform:'uppercase',letterSpacing:'0.5px',borderBottom:'1px solid var(--color-border)'},
  row:{borderBottom:'1px solid var(--color-divider)'},
  cell:{padding:'var(--spacing-md)',fontSize:'var(--font-size-sm)',color:'var(--color-text-primary)'},
  actions:{display:'flex',gap:'var(--spacing-sm)'},
  viewButton:{padding:'var(--spacing-xs) var(--spacing-md)',borderRadius:'var(--border-radius-sm)',backgroundColor:'var(--color-primary)',color:'var(--color-on-primary)',fontSize:'var(--font-size-xs)',fontWeight:'var(--font-weight-medium)'},
  editButton:{padding:'var(--spacing-xs) var(--spacing-md)',borderRadius:'var(--border-radius-sm)',backgroundColor:'var(--color-surface-variant)',color:'var(--color-text-secondary)',fontSize:'var(--font-size-xs)',fontWeight:'var(--font-weight-medium)',border:'1px solid var(--color-border)'},
  pagination:{display:'flex',justifyContent:'center',alignItems:'center',gap:'var(--spacing-md)',padding:'var(--spacing-md)'},
  pageButton:{padding:'var(--spacing-sm) var(--spacing-md)',borderRadius:'var(--border-radius-md)',backgroundColor:'var(--color-primary)',color:'var(--color-on-primary)',fontSize:'var(--font-size-sm)'},
  pageInfo:{fontSize:'var(--font-size-sm)',color:'var(--color-text-secondary)'},
};