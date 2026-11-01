/**
 * EKUSA Digital Platform - API Client
 * TanStack Query + Axios based API client with type-safe endpoints
 */

import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import { QueryClient } from '@tanstack/react-query';
import type { ApiResponse, PaginatedResponse } from '@ekusa/shared-types';

// ============================================
// Configuration
// ============================================

declare const __DEV__: boolean;

const API_BASE_URL = typeof __DEV__ !== 'undefined' && __DEV__ ? 'http://10.0.2.2:3000/api/v1' : 'https://api.ekusa.example.com/api/v1';

const STORAGE_KEYS = {
  ACCESS_TOKEN: 'ekusa_access_token',
  REFRESH_TOKEN: 'ekusa_refresh_token',
  USER_ID: 'ekusa_user_id',
} as const;

// ============================================
// Token Management
// ============================================

let accessToken: string | null = null;
let refreshToken: string | null = null;
let isRefreshing = false;
let refreshSubscribers: Array<(token: string) => void> = [];

function getStoredTokens(): { accessToken: string | null; refreshToken: string | null } {
  if (typeof window !== 'undefined') {
    return {
      accessToken: localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN),
      refreshToken: localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN),
    };
  }
  // For React Native, use AsyncStorage or SecureStore
  return { accessToken: null, refreshToken: null };
}

function setStoredTokens(newAccessToken: string | null, newRefreshToken: string | null): void {
  if (typeof window !== 'undefined') {
    if (newAccessToken) localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, newAccessToken);
    else localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
    if (newRefreshToken) localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, newRefreshToken);
    else localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
  }
}

function subscribeToTokenRefresh(callback: (token: string) => void): void {
  refreshSubscribers.push(callback);
}

function onTokenRefreshed(newToken: string): void {
  refreshSubscribers.forEach((callback) => callback(newToken));
  refreshSubscribers = [];
}

function clearTokens(): void {
  accessToken = null;
  refreshToken = null;
  setStoredTokens(null, null);
}

// Initialize from storage
const stored = getStoredTokens();
accessToken = stored.accessToken;
refreshToken = stored.refreshToken;

// ============================================
// Axios Instance
// ============================================

export const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - add auth token
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    if (accessToken && config.headers) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - handle token refresh
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    if (error.response?.status === 401 && !originalRequest._retry && refreshToken) {
      originalRequest._retry = true;

      if (!isRefreshing) {
        isRefreshing = true;
        try {
          const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
            refreshToken,
          });
          const { accessToken: newAccessToken, refreshToken: newRefreshToken } = response.data.data;
          accessToken = newAccessToken;
          refreshToken = newRefreshToken;
          setStoredTokens(newAccessToken, newRefreshToken);
          onTokenRefreshed(newAccessToken);
          isRefreshing = false;

          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
          }
          return apiClient(originalRequest);
        } catch (refreshError) {
          isRefreshing = false;
          clearTokens();
          // Redirect to login
          if (typeof window !== 'undefined') {
            window.location.href = '/login';
          }
          return Promise.reject(refreshError);
        }
      } else {
        // Wait for token refresh
        return new Promise((resolve) => {
          subscribeToTokenRefresh((newToken: string) => {
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${newToken}`;
            }
            resolve(apiClient(originalRequest));
          });
        });
      }
    }

    return Promise.reject(error);
  }
);

// ============================================
// Query Client
// ============================================

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes
      retry: (failureCount, error) => {
        if (error instanceof AxiosError && error.response?.status === 401) return false;
        return failureCount < 3;
      },
      refetchOnWindowFocus: false,
    },
  },
});

// ============================================
// Error Handling
// ============================================

export class ApiError extends Error {
  constructor(
    public readonly code: string,
    public readonly message: string,
    public readonly status: number,
    public readonly details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'ApiError';
  }

  static fromAxiosError(error: AxiosError): ApiError {
    if (error.response?.data) {
      const data = error.response.data as { error?: { code: string; message: string; details?: Record<string, unknown> } };
      if (data.error) {
        return new ApiError(data.error.code, data.error.message, error.response.status, data.error.details);
      }
    }
    return new ApiError(
      'UNKNOWN_ERROR',
      error.message || 'An unknown error occurred',
      error.response?.status || 0
    );
  }
}

// ============================================
// Helper Functions
// ============================================

function handleResponse<T>(response: { data: ApiResponse<T> }): T {
  if (!response.data.success) {
    throw new ApiError(
      response.data.error?.code || 'API_ERROR',
      response.data.error?.message || 'Request failed',
      0,
      response.data.error?.details
    );
  }
  if (response.data.data === undefined) {
    throw new ApiError('NO_DATA', 'Response contains no data', 0);
  }
  return response.data.data;
}

function handlePaginatedResponse<T>(response: { data: ApiResponse<PaginatedResponse<T>> }): PaginatedResponse<T> {
  return handleResponse(response);
}

// ============================================
// Auth API
// ============================================

export const authApi = {
  register: async (data: { username: string; email?: string; phoneNumber?: string; password: string }) => {
    const response = await apiClient.post<ApiResponse<{ user: unknown; tokens: { accessToken: string; refreshToken: string; expiresIn: number } }>>('/auth/register', data);
    const result = handleResponse(response);
    accessToken = result.tokens.accessToken;
    refreshToken = result.tokens.refreshToken;
    setStoredTokens(accessToken, refreshToken);
    return result;
  },

  login: async (data: { identifier: string; password: string }) => {
    const response = await apiClient.post<ApiResponse<{ user: unknown; tokens: { accessToken: string; refreshToken: string; expiresIn: number } }>>('/auth/login', data);
    const result = handleResponse(response);
    accessToken = result.tokens.accessToken;
    refreshToken = result.tokens.refreshToken;
    setStoredTokens(accessToken, refreshToken);
    return result;
  },

  logout: async () => {
    await apiClient.post('/auth/logout');
    clearTokens();
  },

  refresh: async () => {
    const response = await apiClient.post<ApiResponse<{ accessToken: string; refreshToken: string; expiresIn: number }>>('/auth/refresh', { refreshToken });
    const result = handleResponse(response);
    accessToken = result.accessToken;
    refreshToken = result.refreshToken;
    setStoredTokens(accessToken, refreshToken);
    return result;
  },

  forgotPassword: async (email: string) => {
    const response = await apiClient.post<ApiResponse<void>>('/auth/password/forgot', { email });
    return handleResponse(response);
  },

  resetPassword: async (token: string, password: string) => {
    const response = await apiClient.post<ApiResponse<void>>('/auth/password/reset', { token, password });
    return handleResponse(response);
  },

  getCurrentUser: async () => {
    const response = await apiClient.get<ApiResponse<unknown>>('/users/me');
    return handleResponse(response);
  },
};

// ============================================
// User & Profile API
// ============================================

export const userApi = {
  updateProfile: async (data: { displayName?: string; bio?: string; avatarUrl?: string | null; campus?: string; course?: string; yearOfStudy?: number | null }) => {
    const response = await apiClient.patch<ApiResponse<unknown>>('/users/me', data);
    return handleResponse(response);
  },

  getProfile: async (username: string) => {
    const response = await apiClient.get<ApiResponse<unknown>>(`/users/${encodeURIComponent(username)}`);
    return handleResponse(response);
  },

  searchUsers: async (query: string, limit = 20, offset = 0) => {
    const response = await apiClient.post<ApiResponse<PaginatedResponse<unknown>>>('/users/search', { query, limit, offset });
    return handlePaginatedResponse(response);
  },

  uploadAvatar: async (file: File) => {
    const formData = new FormData();
    formData.append('avatar', file);
    const response = await apiClient.post<ApiResponse<{ avatarUrl: string }>>('/users/me/avatar', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return handleResponse(response);
  },
};

// ============================================
// Membership API
// ============================================

export const membershipApi = {
  apply: async (data: { registrationNumber: string; campus: string; course: string; yearOfStudy: number; contactInfo?: string }) => {
    const response = await apiClient.post<ApiResponse<unknown>>('/membership/apply', data);
    return handleResponse(response);
  },

  getMyStatus: async () => {
    const response = await apiClient.get<ApiResponse<unknown>>('/membership/me');
    return handleResponse(response);
  },

  // Admin
  listApplications: async (params: { status?: string; campus?: string; page?: number; limit?: number; sortBy?: string; sortOrder?: string }) => {
    const response = await apiClient.get<ApiResponse<PaginatedResponse<unknown>>>('/admin/memberships', { params });
    return handlePaginatedResponse(response);
  },

  getApplication: async (id: string) => {
    const response = await apiClient.get<ApiResponse<unknown>>(`/admin/memberships/${id}`);
    return handleResponse(response);
  },

  approve: async (id: string) => {
    const response = await apiClient.patch<ApiResponse<unknown>>(`/admin/memberships/${id}/approve`);
    return handleResponse(response);
  },

  reject: async (id: string, rejectionReason: string) => {
    const response = await apiClient.patch<ApiResponse<unknown>>(`/admin/memberships/${id}/reject`, { rejectionReason });
    return handleResponse(response);
  },
};

// ============================================
// Announcements API
// ============================================

export const announcementsApi = {
  list: async (params: { category?: string; status?: string; priority?: string; page?: number; limit?: number; sortBy?: string; sortOrder?: string }) => {
    const response = await apiClient.get<ApiResponse<PaginatedResponse<unknown>>>('/announcements', { params });
    return handlePaginatedResponse(response);
  },

  get: async (id: string) => {
    const response = await apiClient.get<ApiResponse<unknown>>(`/announcements/${id}`);
    return handleResponse(response);
  },

  markRead: async (id: string) => {
    const response = await apiClient.post<ApiResponse<void>>(`/announcements/${id}/read`);
    return handleResponse(response);
  },

  // Admin
  create: async (data: { title: string; body: string; category: string; priority: string; targets: Array<{ type: string; value: string }>; scheduledAt?: string; expiresAt?: string; pinned?: boolean }) => {
    const response = await apiClient.post<ApiResponse<unknown>>('/admin/announcements', data);
    return handleResponse(response);
  },

  update: async (id: string, data: Partial<{ title: string; body: string; category: string; priority: string; targets: Array<{ type: string; value: string }>; scheduledAt?: string; expiresAt?: string; pinned?: boolean }>) => {
    const response = await apiClient.patch<ApiResponse<unknown>>(`/admin/announcements/${id}`, data);
    return handleResponse(response);
  },

  publish: async (id: string) => {
    const response = await apiClient.post<ApiResponse<void>>(`/admin/announcements/${id}/publish`);
    return handleResponse(response);
  },

  archive: async (id: string) => {
    const response = await apiClient.post<ApiResponse<void>>(`/admin/announcements/${id}/archive`);
    return handleResponse(response);
  },

  getStats: async (id: string) => {
    const response = await apiClient.get<ApiResponse<unknown>>(`/admin/announcements/${id}/stats`);
    return handleResponse(response);
  },

  listAdmin: async (params: { status?: string; page?: number; limit?: number }) => {
    const response = await apiClient.get<ApiResponse<PaginatedResponse<unknown>>>('/admin/announcements', { params });
    return handlePaginatedResponse(response);
  },
};

// ============================================
// Events API
// ============================================

export const eventsApi = {
  list: async (params: { category?: string; status?: string; campus?: string; upcoming?: boolean; page?: number; limit?: number; sortBy?: string; sortOrder?: string }) => {
    const response = await apiClient.get<ApiResponse<PaginatedResponse<unknown>>>('/events', { params });
    return handlePaginatedResponse(response);
  },

  get: async (id: string) => {
    const response = await apiClient.get<ApiResponse<unknown>>(`/events/${id}`);
    return handleResponse(response);
  },

  register: async (eventId: string) => {
    const response = await apiClient.post<ApiResponse<unknown>>(`/events/${eventId}/register`);
    return handleResponse(response);
  },

  cancelRegistration: async (eventId: string) => {
    const response = await apiClient.delete<ApiResponse<void>>(`/events/${eventId}/register`);
    return handleResponse(response);
  },

  // Admin
  create: async (data: { title: string; description: string; category: string; venue: string; startAt: string; endAt: string; registrationDeadline: string; capacity?: number; eligibility?: string; registrationFee: number }) => {
    const response = await apiClient.post<ApiResponse<unknown>>('/admin/events', data);
    return handleResponse(response);
  },

  update: async (id: string, data: Partial<{ title: string; description: string; category: string; venue: string; startAt: string; endAt: string; registrationDeadline: string; capacity?: number; eligibility?: string; registrationFee: number }>) => {
    const response = await apiClient.patch<ApiResponse<unknown>>(`/admin/events/${id}`, data);
    return handleResponse(response);
  },

  getParticipants: async (id: string) => {
    const response = await apiClient.get<ApiResponse<PaginatedResponse<unknown>>>(`/admin/events/${id}/participants`);
    return handlePaginatedResponse(response);
  },

  recordAttendance: async (eventId: string, userId: string, attendanceStatus: 'present' | 'absent' | 'excused') => {
    const response = await apiClient.patch<ApiResponse<void>>(`/admin/events/${eventId}/attendance`, { userId, attendanceStatus });
    return handleResponse(response);
  },
};

// ============================================
// Welfare API
// ============================================

export const welfareApi = {
  submit: async (data: { category: string; subject: string; description: string }) => {
    const response = await apiClient.post<ApiResponse<unknown>>('/welfare/requests', data);
    return handleResponse(response);
  },

  getMyRequests: async (params: { status?: string; page?: number; limit?: number }) => {
    const response = await apiClient.get<ApiResponse<PaginatedResponse<unknown>>>('/welfare/requests/me', { params });
    return handlePaginatedResponse(response);
  },

  // Admin
  list: async (params: { status?: string; category?: string; page?: number; limit?: number }) => {
    const response = await apiClient.get<ApiResponse<PaginatedResponse<unknown>>>('/admin/welfare/requests', { params });
    return handlePaginatedResponse(response);
  },

  update: async (id: string, data: { status?: string; assignedOfficerId?: string | null }) => {
    const response = await apiClient.patch<ApiResponse<unknown>>(`/admin/welfare/requests/${id}`, data);
    return handleResponse(response);
  },

  addUpdate: async (id: string, message: string) => {
    const response = await apiClient.post<ApiResponse<unknown>>(`/admin/welfare/requests/${id}/updates`, { message });
    return handleResponse(response);
  },
};

// ============================================
// Messaging API
// ============================================

export const messagingApi = {
  listConversations: async () => {
    const response = await apiClient.get<ApiResponse<unknown[]>>('/conversations');
    return handleResponse(response);
  },

  createConversation: async (data: { recipientId?: string; name?: string; description?: string; memberIds?: string[] }) => {
    const response = await apiClient.post<ApiResponse<unknown>>('/conversations', data);
    return handleResponse(response);
  },

  getConversation: async (id: string) => {
    const response = await apiClient.get<ApiResponse<unknown>>(`/conversations/${id}`);
    return handleResponse(response);
  },

  sendMessage: async (data: { conversationId: string; ciphertext: string; protocolMetadata: string; messageType?: string }) => {
    const response = await apiClient.post<ApiResponse<unknown>>('/messages', data);
    return handleResponse(response);
  },

  getPendingMessages: async (params: { limit?: number; beforeMessageId?: string }) => {
    const response = await apiClient.get<ApiResponse<unknown[]>>('/messages/pending', { params });
    return handleResponse(response);
  },

  acknowledgeMessage: async (messageId: string, conversationId: string) => {
    const response = await apiClient.post<ApiResponse<void>>('/messages/acknowledge', { messageId, conversationId });
    return handleResponse(response);
  },

  deleteMessage: async (messageId: string, deleteForEveryone: boolean) => {
    const response = await apiClient.post<ApiResponse<void>>(`/messages/${messageId}/delete`, { deleteForEveryone });
    return handleResponse(response);
  },

  blockUser: async (userId: string) => {
    const response = await apiClient.post<ApiResponse<void>>(`/users/${userId}/block`);
    return handleResponse(response);
  },

  registerDevice: async (data: { deviceName: string; identityPublicKey: string; registrationId: number; pushToken?: string }) => {
    const response = await apiClient.post<ApiResponse<unknown>>('/devices', data);
    return handleResponse(response);
  },

  getPreKeyBundle: async (userId: string) => {
    const response = await apiClient.get<ApiResponse<unknown>>(`/devices/${userId}/prekey-bundle`);
    return handleResponse(response);
  },
};

// ============================================
// Community API
// ============================================

export const communityApi = {
  list: async (params: { type?: string; isPublic?: boolean; page?: number; limit?: number }) => {
    const response = await apiClient.get<ApiResponse<PaginatedResponse<unknown>>>('/communities', { params });
    return handlePaginatedResponse(response);
  },

  get: async (id: string) => {
    const response = await apiClient.get<ApiResponse<unknown>>(`/communities/${id}`);
    return handleResponse(response);
  },

  join: async (id: string) => {
    const response = await apiClient.post<ApiResponse<void>>(`/communities/${id}/join`);
    return handleResponse(response);
  },

  leave: async (id: string) => {
    const response = await apiClient.post<ApiResponse<void>>(`/communities/${id}/leave`);
    return handleResponse(response);
  },

  // Admin
  create: async (data: { name: string; description: string; type: string; isPublic: boolean; avatarUrl?: string | null }) => {
    const response = await apiClient.post<ApiResponse<unknown>>('/admin/communities', data);
    return handleResponse(response);
  },

  update: async (id: string, data: Partial<{ name: string; description: string; type: string; isPublic: boolean; avatarUrl?: string | null }>) => {
    const response = await apiClient.patch<ApiResponse<unknown>>(`/admin/communities/${id}`, data);
    return handleResponse(response);
  },
};

// ============================================
// Leadership API
// ============================================

export const leadershipApi = {
  getDirectory: async () => {
    const response = await apiClient.get<ApiResponse<unknown[]>>('/leadership');
    return handleResponse(response);
  },

  getPositions: async () => {
    const response = await apiClient.get<ApiResponse<unknown[]>>('/leadership/positions');
    return handleResponse(response);
  },

  // Admin
  createPosition: async (data: { title: string; description?: string; order: number; isActive: boolean }) => {
    const response = await apiClient.post<ApiResponse<unknown>>('/admin/leadership/positions', data);
    return handleResponse(response);
  },

  assignLeader: async (data: { userId: string; positionId: string; startDate: string; endDate?: string | null; contactInfo?: string | null }) => {
    const response = await apiClient.post<ApiResponse<unknown>>('/admin/leadership', data);
    return handleResponse(response);
  },
};

// ============================================
// Roles & Permissions API
// ============================================

export const rolesApi = {
  list: async () => {
    const response = await apiClient.get<ApiResponse<unknown[]>>('/admin/roles');
    return handleResponse(response);
  },

  create: async (data: { name: string; displayName: string; description?: string; permissions: string[] }) => {
    const response = await apiClient.post<ApiResponse<unknown>>('/admin/roles', data);
    return handleResponse(response);
  },

  assign: async (userId: string, roleId: string) => {
    const response = await apiClient.post<ApiResponse<void>>('/admin/user-roles', { userId, roleId });
    return handleResponse(response);
  },

  revoke: async (userId: string, roleId: string) => {
    const response = await apiClient.delete<ApiResponse<void>>(`/admin/user-roles/${userId}/${roleId}`);
    return handleResponse(response);
  },
};

// ============================================
// Notifications API
// ============================================

export const notificationsApi = {
  list: async (params: { category?: string; unreadOnly?: boolean; page?: number; limit?: number }) => {
    const response = await apiClient.get<ApiResponse<PaginatedResponse<unknown>>>('/notifications', { params });
    return handlePaginatedResponse(response);
  },

  markRead: async (id: string) => {
    const response = await apiClient.post<ApiResponse<void>>(`/notifications/${id}/read`);
    return handleResponse(response);
  },

  markAllRead: async () => {
    const response = await apiClient.post<ApiResponse<void>>('/notifications/read-all');
    return handleResponse(response);
  },
};

// ============================================
// Audit API
// ============================================

export const auditApi = {
  list: async (params: { adminUserId?: string; action?: string; targetType?: string; targetId?: string; startDate?: string; endDate?: string; page?: number; limit?: number; sortOrder?: string }) => {
    const response = await apiClient.get<ApiResponse<PaginatedResponse<unknown>>>('/admin/audit', { params });
    return handlePaginatedResponse(response);
  },
};

// ============================================
// Admin Dashboard API
// ============================================

export const adminApi = {
  getDashboardStats: async () => {
    const response = await apiClient.get<ApiResponse<unknown>>('/admin/dashboard');
    return handleResponse(response);
  },

  getSettings: async () => {
    const response = await apiClient.get<ApiResponse<unknown>>('/admin/settings');
    return handleResponse(response);
  },

  updateSettings: async (data: Record<string, unknown>) => {
    const response = await apiClient.patch<ApiResponse<unknown>>('/admin/settings', data);
    return handleResponse(response);
  },
};

// ============================================
// Utility Exports
// ============================================

export const setAccessToken = (token: string | null) => {
  accessToken = token;
  setStoredTokens(token, refreshToken);
};

export const getAccessToken = () => accessToken;

export const isAuthenticated = () => !!accessToken;

export const clearAuth = () => clearTokens();