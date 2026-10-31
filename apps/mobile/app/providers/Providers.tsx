/**
 * EKUSA Mobile App - Providers
 * Global providers for React Query, Theme, etc.
 */

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { ReactNativeAsyncStoragePersistence } from '@tanstack/query-async-storage-persist';
import { persistQueryClient } from '@tanstack/query-persist-client-core';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ReactNode, useMemo, useEffect } from 'react';
import { queryClient as apiQueryClient } from '@ekusa/api-client';

export function Providers({ children }: { children: ReactNode }) {
  const queryClient = useMemo(() => {
    const client = new QueryClient({
      defaultOptions: {
        queries: {
          staleTime: 5 * 60 * 1000,
          gcTime: 10 * 60 * 1000,
          retry: (failureCount, error: any) => {
            if (error?.status === 401) return false;
            return failureCount < 3;
          },
          refetchOnWindowFocus: false,
        },
      },
    });

    // Persist query cache for offline support
    persistQueryClient({
      queryClient: client,
      persister: new ReactNativeAsyncStoragePersistence(AsyncStorage),
      maxAge: 1000 * 60 * 60 * 24, // 24 hours
      dehydrateOptions: { shouldDehydrate: () => true },
    });

    return client;
  }, []);

  // Sync auth token with apiClient
  useEffect(() => {
    const unsubscribe = apiQueryClient.subscribeToTokenChanges((token) => {
      // Token changes are handled by the apiClient internally
    });
    return unsubscribe;
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}