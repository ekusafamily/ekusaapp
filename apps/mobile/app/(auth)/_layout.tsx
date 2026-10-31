/**
 * EKUSA Mobile App - Auth Stack Layout
 * Stack navigator for authentication screens
 */

import { Stack } from 'expo-router';
import { useAuthStore } from '@/stores/authStore';
import { useEffect } from 'react';

export default function AuthLayout() {
  const { isInitialized } = useAuthStore();

  // Don't render auth screens until auth is initialized
  if (!isInitialized) {
    return null;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="login" />
      <Stack.Screen name="register" />
      <Stack.Screen name="forgot-password" />
      <Stack.Screen name="membership-apply" />
    </Stack>
  );
}