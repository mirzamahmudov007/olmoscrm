import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { API_BASE_URL, DEV_API_BASE_URL, STORAGE_KEYS } from '../config/constants';
import { AuthResponse, ApiError } from '../types';

const api = axios.create({
  baseURL: API_BASE_URL,
});

const devApi = axios.create({
  baseURL: DEV_API_BASE_URL,
});

// Request interceptor to add auth token
const addAuthInterceptor = (instance: typeof api) => {
  instance.interceptors.request.use((config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });
};

// Response interceptor to handle token refresh
const addRefreshInterceptor = (instance: typeof api) => {
  instance.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
      const originalRequest = error.config as InternalAxiosRequestConfig & {
        _retry?: boolean;
      };

      if (error.response?.status === 401 && !originalRequest._retry) {
        originalRequest._retry = true;

        try {
          const refreshToken = localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
          if (!refreshToken) {
            throw new Error('No refresh token available');
          }

          const response = await api.get<AuthResponse>(
            `/auth/refresh-token?refreshToken=${refreshToken}`
          );

          const { accessToken, refreshToken: newRefreshToken, accessTokenExpiry, refreshTokenExpiry } = response.data;

          localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, accessToken);
          localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, newRefreshToken);
          localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN_EXPIRY, accessTokenExpiry.toString());
          localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN_EXPIRY, refreshTokenExpiry.toString());

          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          return instance(originalRequest);
        } catch (refreshError) {
          // Refresh failed, redirect to login
          localStorage.clear();
          window.location.href = '/login';
          return Promise.reject(refreshError);
        }
      }

      return Promise.reject(error);
    }
  );
};

addAuthInterceptor(api);
addAuthInterceptor(devApi);
addRefreshInterceptor(api);
addRefreshInterceptor(devApi);

export const handleApiError = (error: unknown): ApiError => {
  if (error instanceof AxiosError) {
    return {
      message: error.response?.data?.message || error.message || 'An error occurred',
      status: error.response?.status || 500,
    };
  }
  
  return {
    message: error instanceof Error ? error.message : 'An unknown error occurred',
    status: 500,
  };
};

export { api, devApi };