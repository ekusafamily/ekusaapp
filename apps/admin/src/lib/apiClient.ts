/**
 * EKUSA Admin - API Client
 * Axios-based API client with auth handling
 */

import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';

const STORAGE_KEYS = {
  ACCESS_TOKEN: 'ekusa_admin_access_token',
  REFRESH_TOKEN: 'ekusa_admin_refresh_token',
} as const;

let accessToken: string | null = null;
let refreshToken: string | null = null;
let isRefreshing = false;
let refreshSubscribers: Array<(token: string) => void> = [];

function getStoredTokens(): { accessToken: string | null; refreshToken: string | null } {
  return {
    accessToken: localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN),
    refreshToken: localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN),
  };
}

function setStoredTokens(newAccessToken: string | null, newRefreshToken: string | null): void {
  if (newAccessToken) localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, newAccessToken);
  else localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
  if (newRefreshToken) localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, newRefreshToken);
  else localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
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

export const apiClient = axios.create({
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
          window.location.href = '/login';
          return Promise.reject(refreshError);
        }
      } else {
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

// Helper functions
export function handleResponse<T = any>(response: { data: { success: boolean; data?: T; error?: { code: string; message: string } } }): T {
  if (!response.data.success) {
    throw new ApiError(
      response.data.error?.code || 'API_ERROR',
      response.data.error?.message || 'Request failed',
      0
    );
  }
  if (response.data.data === undefined) {
    throw new ApiError('NO_DATA', 'Response contains no data', 0);
  }
  return response.data.data;
}

export class ApiError extends Error {
  constructor(
    public readonly code: string,
    public readonly message: string,
    public readonly status: number
  ) {
    super(message);
    this.name = 'ApiError';
  }

  static fromAxiosError(error: AxiosError): ApiError {
    if (error.response?.data) {
      const data = error.response.data as { error?: { code: string; message: string } };
      if (data.error) {
        return new ApiError(data.error.code, data.error.message, error.response.status);
      }
    }
    return new ApiError(
      'UNKNOWN_ERROR',
      error.message || 'An unknown error occurred',
      error.response?.status || 0
    );
  }
}

export function setAccessToken(token: string | null) {
  accessToken = token;
  setStoredTokens(token, refreshToken);
}

export function getAccessToken() { return accessToken; }

export function isAuthenticated() { return !!accessToken; }

export function clearAuth() { clearTokens(); }