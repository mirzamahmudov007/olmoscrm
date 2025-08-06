import { api } from './api';
import { AuthResponse, LoginCredentials, User } from '../types';
import { STORAGE_KEYS } from '../config/constants';

export const authService = {
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>('/auth/login', credentials);
    
    const { accessToken, refreshToken, accessTokenExpiry, refreshTokenExpiry } = response.data;
    
    localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, accessToken);
    localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refreshToken);
    localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN_EXPIRY, accessTokenExpiry.toString());
    localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN_EXPIRY, refreshTokenExpiry.toString());
    
    return response.data;
  },

  logout(): void {
    localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN_EXPIRY);
    localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN_EXPIRY);
    localStorage.removeItem(STORAGE_KEYS.USER);
  },

  isAuthenticated(): boolean {
    const token = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
    const expiry = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN_EXPIRY);
    
    if (!token || !expiry) return false;
    
    return Date.now() < parseInt(expiry);
  },

  getUser(): User | null {
    try {
      const token = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
      if (!token) return null;
      
      // Decode JWT payload (simple base64 decode)
      const payload = JSON.parse(atob(token.split('.')[1]));
      
      return {
        id: payload.user_id,
        username: payload.sub,
        fullName: payload.full_name,
        authorities: payload.authorities || [],
      };
    } catch {
      return null;
    }
  },
};