import React, { useEffect, useState } from 'react';
import { apiClient, handleResponse } from '../lib/apiClient';

interface AuditLog {
  id: string;
  adminUserName: string;
  action: string;
  targetType: string;
  targetId: string;
  changes?: Record<string, { before: any; after: any }>;
  createdAt: string;
}

export function AuditPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    const fetch = async () => {
      try {
        const response = await apiClient.get('/admin/audit', { params: { page, limit: 20 } });
        const data = handleResponse(response);
        setLogs(data.items);
        setTotalPages(data.totalPages);
      } catch { }
      finally { setIsLoading(false); }
    };
    fetch();
  }, [page]);

  if (isLoading) return <div style={styles.loading}>Loading...</div>;

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2 style={styles.title}>Audit Logs</h2>
      </div>

      <div style={styles.tableContainer}>
        <table style={styles.table}>
          <thead><tr style={styles.headerRow}>
            <th style={styles.headerCell}>Action</th>
            <th style={styles.headerCell}>Admin</th>
            <th style={styles.headerCell}>Target</th>
            <th style={styles.headerCell}>Changes</th>
            <th style={styles.headerCell}>Timestamp</th>
          </tr></thead>
          <tbody>
            {logs.map(l => (
              <tr key={l.id} style={styles.row}>
                <td style={styles.cell}><code style={styles.actionCode}>{l.action}</code></td>
                <td style={styles.cell}>{l.adminUserName}</td>
                <td style={styles.cell}>{l.targetType}:{l.targetId}</td>
                <td style={styles.cell}>
                  {l.changes && (
                    <pre style={styles.changesPre}>{JSON.stringify(l.changes, null, 2)}</pre>
                  )}
                </td>
                <td style={styles.cell}>{new Date(l.createdAt).toLocaleString()}</td>
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
  container:{display:'flex',flexDirection:'column',gap:'var(--spacing-lg)'},
  loading:{display:'flex',justifyContent:'center',alignItems:'center',padding:'var(--spacing-xxl)',color:'var(--color-text-secondary)'},
  header:{display:'flex',justifyContent:'space-between',alignItems:'center'},
  title:{fontSize:'var(--font-size-xxl)',fontWeight:'var(--font-weight-semibold)',color:'var(--color-text-primary)'},
  tableContainer:{overflowX:'auto',backgroundColor:'var(--color-surface)',borderRadius:'var(--border-radius-lg)',border:'1px solid var(--color-border)'},
  table:{width:'100%',borderCollapse:'collapse'},
  headerRow:{backgroundColor:'var(--color-surface-variant)'},
  headerCell:{padding:'var(--spacing-md)',textAlign:'left',fontSize:'var(--font-size-xs)',fontWeight:'var(--font-weight-semibold)',color:'var(--color-text-tertiary)',textTransform:'uppercase',letterSpacing:'0.5px',borderBottom:'1px solid var(--color-border)'},
  row:{borderBottom:'1px solid var(--color-divider)'},
  cell:{padding:'var(--spacing-md)',fontSize:'var(--font-size-sm)',color:'var(--color-text-primary)'},
  actionCode:{fontSize:'var(--font-size-xs)',backgroundColor:'var(--color-surface-variant)',padding:'var(--spacing-xs) var(--spacing-sm)',borderRadius:'var(--border-radius-sm)'},
  changesPre:{margin:0,fontSize:'var(--font-size-xs)',whiteSpace:'pre-wrap',maxHeight:100,overflow:'auto'},
  pagination:{display:'flex',justifyContent:'center',alignItems:'center',gap:'var(--spacing-md)',padding:'var(--spacing-md)'},
  pageButton:{padding:'var(--spacing-sm) var(--spacing-md)',borderRadius:'var(--border-radius-md)',backgroundColor:'var(--color-primary)',color:'var(--color-on-primary)',fontSize:'var(--font-size-sm)'},
  pageInfo:{fontSize:'var(--font-size-sm)',color:'var(--color-text-secondary)'},
};