import React, { useEffect, useState } from 'react';
import { apiClient, handleResponse } from '../lib/apiClient';

interface Leader {
  id: string;
  positionTitle: string;
  order: number;
  userName: string;
  userAvatarUrl?: string;
  contactInfo?: string;
  startDate: string;
  endDate?: string;
}

export function LeadershipPage() {
  const [leaders, setLeaders] = useState<Leader[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const response = await apiClient.get('/leadership');
        setLeaders(handleResponse(response));
      } catch { }
      finally { setIsLoading(false); }
    };
    fetch();
  }, []);

  if (isLoading) return <div style={styles.loading}>Loading...</div>;

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2 style={styles.title}>Leadership Directory</h2>
      </div>

      <div style={styles.grid}>
        {leaders.map(l => (
          <div key={l.id} style={styles.card}>
            <div style={styles.cardHeader}>
              <div style={{...styles.avatar, backgroundColor: 'var(--color-primary-container)'}}>
                {l.userAvatarUrl ? <img src={l.userAvatarUrl} style={styles.avatarImg} /> : l.userName[0].toUpperCase()}
              </div>
              <div>
                <div style={styles.leaderName}>{l.userName}</div>
                <div style={styles.leaderPosition}>{l.positionTitle}</div>
              </div>
            </div>
            {l.contactInfo && <div style={styles.contactInfo}>{l.contactInfo}</div>}
            <div style={styles.term}>
              Since {new Date(l.startDate).toLocaleDateString()}
              {l.endDate && ` - ${new Date(l.endDate).toLocaleDateString()}`}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

const styles = {
  container: {display:'flex',flexDirection:'column',gap:'var(--spacing-lg)'},
  loading:{display:'flex',justifyContent:'center',alignItems:'center',padding:'var(--spacing-xxl)',color:'var(--color-text-secondary)'},
  header:{display:'flex',justifyContent:'space-between',alignItems:'center'},
  title:{fontSize:'var(--font-size-xxl)',fontWeight:'var(--font-weight-semibold)',color:'var(--color-text-primary)'},
  grid:{display:'grid',gridTemplateColumns:'repeat(auto-fill, minmax(280px, 1fr))',gap:'var(--spacing-lg)'},
  card:{backgroundColor:'var(--color-surface)',borderRadius:'var(--border-radius-lg)',border:'1px solid var(--color-border)',padding:'var(--spacing-lg)'},
  cardHeader:{display:'flex',alignItems:'center',gap:'var(--spacing-md)',marginBottom:'var(--spacing-md)'},
  avatar:{width:56,height:56,borderRadius:'var(--border-radius-full)',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:'var(--font-weight-semibold)',fontSize:'var(--font-size-xl)',color:'var(--color-primary)'},
  avatarImg:{width:56,height:56,borderRadius:'var(--border-radius-full)',objectFit:'cover'},
  leaderName:{fontWeight:'var(--font-weight-semibold)',color:'var(--color-text-primary)'},
  leaderPosition:{fontSize:'var(--font-size-sm)',color:'var(--color-primary)',fontWeight:'var(--font-weight-medium)'},
  contactInfo:{fontSize:'var(--font-size-sm)',color:'var(--color-text-secondary)',marginBottom:'var(--spacing-sm)'},
  term:{fontSize:'var(--font-size-xs)',color:'var(--color-text-tertiary)'},
};