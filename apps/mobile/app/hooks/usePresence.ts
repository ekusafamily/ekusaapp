/**
 * EKUSA Mobile App - Presence Hook
 * Reports connectivity / API reachability for the top status strip.
 */

import { useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { apiClient } from '@ekusa/api-client';

export type PresenceState = 'online' | 'offline' | 'checking';

const PING_INTERVAL_MS = 30000;
const PING_TIMEOUT_MS = 8000;

async function pingApi(): Promise<PresenceState> {
  try {
    await apiClient.get('/health', { timeout: PING_TIMEOUT_MS });
    return 'online';
  } catch (error: any) {
    // Any HTTP response (even 404) means the server is reachable
    if (error?.response) return 'online';
    return 'offline';
  }
}

export function usePresence(): PresenceState {
  const [presence, setPresence] = useState<PresenceState>('checking');
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;

    const check = async () => {
      const state = await pingApi();
      if (mounted.current) setPresence(state);
    };

    check();
    const interval = setInterval(check, PING_INTERVAL_MS);

    const subscription = AppState.addEventListener('change', (status) => {
      if (status === 'active') check();
    });

    return () => {
      mounted.current = false;
      clearInterval(interval);
      subscription.remove();
    };
  }, []);

  return presence;
}
