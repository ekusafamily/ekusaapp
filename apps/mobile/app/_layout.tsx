/**
 * EKUSA Mobile App - Root Layout
 * Expo Router root layout with providers and global configuration
 */

import { Stack } from 'expo-router';
import { Providers } from '@/providers/Providers';
import { useAuthStore } from '@/stores/authStore';
import { useEffect } from 'react';


export default function RootLayout() {
  const { initialize } = useAuthStore();

  useEffect(() => {
    initialize();
  }, [initialize]);

  return (
    <Providers>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(auth)" options={{ presentation: 'modal' }} />
        <Stack.Screen name="(tabs)" />
      </Stack>
    </Providers>
  );
}