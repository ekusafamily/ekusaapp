/**
 * EKUSA Mobile App - Auth Store
 * Zustand store for authentication state management
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authApi, userApi, clearAuth, isAuthenticated } from '@ekusa/api-client';
import type { User } from '@ekusa/shared-types';

interface AuthState {
  user: User | null;
  isInitialized: boolean;
  isLoading: boolean;
  error: string | null;

  // Actions
  initialize: () => Promise<void>;
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  login: (identifier: string, password: string) => Promise<void>;
  register: (data: { username: string; email?: string; phoneNumber?: string; password: string }) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (data: Partial<User>) => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isInitialized: false,
      isLoading: false,
      error: null,

      initialize: async () => {
        if (get().isInitialized) return;

        set({ isLoading: true });
        try {
          if (isAuthenticated()) {
            const response = await authApi.getCurrentUser();
            set({ user: response as User, isInitialized: true, isLoading: false });
          } else {
            set({ isInitialized: true, isLoading: false });
          }
        } catch {
          clearAuth();
          set({ user: null, isInitialized: true, isLoading: false, error: 'Session expired. Please log in again.' });
        }
      },

      setUser: (user) => set({ user }),

      setLoading: (isLoading) => set({ isLoading }),

      setError: (error) => set({ error }),

      login: async (identifier, password) => {
        set({ isLoading: true, error: null });
        try {
          await authApi.login({ identifier, password });
          const response = await authApi.getCurrentUser();
          set({ user: response as User, isLoading: false, error: null });
        } catch (error: any) {
          set({ isLoading: false, error: error.message || 'Login failed' });
          throw error;
        }
      },

      register: async (data) => {
        set({ isLoading: true, error: null });
        try {
          await authApi.register(data);
          const response = await authApi.getCurrentUser();
          set({ user: response as User, isLoading: false, error: null });
        } catch (error: any) {
          set({ isLoading: false, error: error.message || 'Registration failed' });
          throw error;
        }
      },

      logout: async () => {
        set({ isLoading: true });
        try {
          await authApi.logout();
        } catch {
          // Ignore logout errors
        } finally {
          clearAuth();
          set({ user: null, isLoading: false });
        }
      },

      updateProfile: async (data) => {
        set({ isLoading: true });
        try {
          const response = await userApi.updateProfile(data as any);
          set({ user: response as User, isLoading: false });
        } catch (error: any) {
          set({ isLoading: false, error: error.message || 'Failed to update profile' });
          throw error;
        }
      },
    }),
    {
      name: 'ekusa-auth-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ user: state.user }),
    }
  )
);