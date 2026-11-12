import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { apiClient, ApiError, setTokens } from '../lib/apiClient';

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const from = (location.state as any)?.from?.pathname || '/dashboard';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await apiClient.post('/auth/login', { identifier, password });
      const tokens = response.data?.tokens || response.data?.data?.tokens;
      if (!tokens) {
        throw new Error('Invalid response structure: tokens missing');
      }
      const { accessToken, refreshToken } = tokens;

      // Store tokens and update client state
      setTokens(accessToken, refreshToken);

      const target = from && from !== '/login' ? from : '/dashboard';
      navigate(target, { replace: true });
    } catch (err: any) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('Login failed. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.logo}>
          <span style={styles.logoIcon}>E</span>
        </div>
        <h1 style={styles.title}>EKUSA Admin</h1>
        <p style={styles.subtitle}>Sign in to access the dashboard</p>

        {error && (
          <div style={styles.error}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.inputGroup}>
            <label style={styles.label} htmlFor="identifier">Username or Email</label>
            <input
              id="identifier"
              type="text"
              style={styles.input}
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder="Enter your username or email"
              required
              autoComplete="username"
              disabled={isLoading}
            />
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label} htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              style={styles.input}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
              autoComplete="current-password"
              disabled={isLoading}
            />
          </div>

          <button type="submit" style={styles.submitButton} disabled={isLoading}>
            {isLoading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100vh',
    padding: 'var(--spacing-xl)',
    backgroundColor: 'var(--color-background)',
  },
  card: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: 'var(--color-surface)',
    borderRadius: 'var(--border-radius-xl)',
    padding: 'var(--spacing-xxl)',
    boxShadow: 'var(--shadow-sm)',
    border: '1px solid var(--color-border)',
  },
  logo: {
    display: 'flex',
    justifyContent: 'center',
    marginBottom: 'var(--spacing-lg)',
  },
  logoIcon: {
    width: 56,
    height: 56,
    borderRadius: 'var(--border-radius-full)',
    backgroundColor: 'var(--color-primary)',
    color: 'var(--color-on-primary)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: 'var(--font-display)',
    fontWeight: 'var(--font-weight-semibold)',
    fontSize: 'var(--font-size-xxl)',
    letterSpacing: '-0.5px',
  },
  title: {
    fontFamily: 'var(--font-display)',
    fontSize: 'var(--font-size-xxxl)',
    fontWeight: 'var(--font-weight-semibold)',
    letterSpacing: '-0.6px',
    textAlign: 'center',
    color: 'var(--color-text-primary)',
    marginBottom: 'var(--spacing-sm)',
  },
  subtitle: {
    fontSize: 'var(--font-size-md)',
    textAlign: 'center',
    color: 'var(--color-text-tertiary)',
    marginBottom: 'var(--spacing-xl)',
  },
  error: {
    padding: 'var(--spacing-md)',
    borderRadius: 'var(--border-radius-md)',
    backgroundColor: 'var(--color-error-container)',
    color: 'var(--color-error)',
    fontSize: 'var(--font-size-sm)',
    textAlign: 'center',
    marginBottom: 'var(--spacing-lg)',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--spacing-md)',
  },
  inputGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--spacing-xs)',
  },
  label: {
    fontSize: 'var(--font-size-sm)',
    fontWeight: 'var(--font-weight-medium)',
    color: 'var(--color-text-secondary)',
  },
  input: {
    width: '100%',
    height: 44,
    padding: '0 16px',
    border: '1px solid var(--color-border-strong)',
    borderRadius: 'var(--border-radius-full)',
    fontSize: 'var(--font-size-md)',
    color: 'var(--color-text-primary)',
    backgroundColor: 'var(--color-surface)',
  },
  submitButton: {
    width: '100%',
    height: 44,
    marginTop: 'var(--spacing-xs)',
    borderRadius: 'var(--border-radius-full)',
    backgroundColor: 'var(--color-primary)',
    color: 'var(--color-on-primary)',
    fontSize: 'var(--font-size-md)',
    fontWeight: 'var(--font-weight-medium)',
    letterSpacing: '-0.2px',
    transition: 'background-color 0.15s ease',
  },
};