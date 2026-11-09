/**
 * EKUSA Mobile App - Auth Store
 * Zustand store for authentication state management with persisted tokens
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authApi, userApi, clearAuth, setAuthTokens, isAuthenticated } from '@ekusa/api-client';
import type { User } from '@ekusa/shared-types';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
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
      accessToken: null,
      refreshToken: null,
      isInitialized: false,
      isLoading: false,
      error: null,

      initialize: async () => {
        const state = get();
        if (state.accessToken) {
          setAuthTokens(state.accessToken, state.refreshToken);
        }

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
          set({ user: null, accessToken: null, refreshToken: null, isInitialized: true, isLoading: false, error: 'Session expired. Please log in again.' });
        }
      },

      setUser: (user) => set({ user }),

      setLoading: (isLoading) => set({ isLoading }),

      setError: (error) => set({ error }),

      login: async (identifier, password) => {
        set({ isLoading: true, error: null });
        try {
          const res: any = await authApi.login({ identifier, password });
          const userObj = res.user || res.data?.user;
          const tokens = res.tokens || res.data?.tokens;

          if (tokens?.accessToken) {
            setAuthTokens(tokens.accessToken, tokens.refreshToken);
            set({
              user: userObj as User,
              accessToken: tokens.accessToken,
              refreshToken: tokens.refreshToken,
              isLoading: false,
              error: null,
            });
          } else {
            const current = await authApi.getCurrentUser();
            set({ user: current as User, isLoading: false, error: null });
          }
        } catch (error: any) {
          const is401 =
            error?.response?.status === 401 ||
            error?.status === 401 ||
            error?.response?.data?.statusCode === 401 ||
            error?.message?.includes('401');
          const errorMessage = is401
            ? 'Wrong password or username. Please check your credentials and try again.'
            : error?.response?.data?.message ||
              error?.response?.data?.error?.message ||
              error?.message ||
              'Login failed. Please try again.';
          set({ isLoading: false, error: errorMessage });
          throw new Error(errorMessage);
        }
      },

      register: async (data) => {
        set({ isLoading: true, error: null });
        try {
          await authApi.register(data);
          // Auto-login to obtain JWT tokens
          const res: any = await authApi.login({ identifier: data.username, password: data.password });
          const userObj = res.user || res.data?.user;
          const tokens = res.tokens || res.data?.tokens;

          if (tokens?.accessToken) {
            setAuthTokens(tokens.accessToken, tokens.refreshToken);
            set({
              user: userObj as User,
              accessToken: tokens.accessToken,
              refreshToken: tokens.refreshToken,
              isLoading: false,
              error: null,
            });
          } else {
            const current = await authApi.getCurrentUser();
            set({ user: current as User, isLoading: false, error: null });
          }
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
          set({ user: null, accessToken: null, refreshToken: null, isLoading: false });
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
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
      }),
      onRehydrateStorage: () => (state) => {
        if (state?.accessToken) {
          setAuthTokens(state.accessToken, state.refreshToken);
        }
      },
    }
  )
);