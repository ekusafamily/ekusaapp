/**
 * EKUSA Mobile App - Root Layout
 * Expo Router root layout with providers and global configuration
 */

import { View, StyleSheet } from 'react-native';
import { Stack } from 'expo-router';
import { Providers } from '@/providers/Providers';
import { StatusStrip } from '@/components/StatusStrip';
import { useAuthStore } from '@/stores/authStore';
import { useEffect } from 'react';


export default function RootLayout() {
  const { initialize } = useAuthStore();

  useEffect(() => {
    initialize();
  }, [initialize]);

  return (
    <Providers>
      <View style={styles.root}>
        <StatusStrip />
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(auth)" options={{ presentation: 'modal' }} />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="chats/[id]" options={{ headerShown: false }} />
          <Stack.Screen name="announcements" options={{ headerShown: false }} />
        </Stack>
      </View>
    </Providers>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});