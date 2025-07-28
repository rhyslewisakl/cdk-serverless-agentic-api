/**
 * Token management utility for handling JWT tokens
 */

import { storage } from './helpers';

const TOKEN_KEY = 'auth_token';
const REFRESH_TOKEN_KEY = 'refresh_token';
const TOKEN_EXPIRY_KEY = 'token_expiry';

export class TokenManager {
  /**
   * Store authentication token
   */
  static setToken(token: string, expiresIn?: number): void {
    storage.set(TOKEN_KEY, token);
    
    if (expiresIn) {
      const expiryTime = Date.now() + (expiresIn * 1000);
      storage.set(TOKEN_EXPIRY_KEY, expiryTime);
    }
  }

  /**
   * Get authentication token
   */
  static getToken(): string | null {
    const token = storage.get<string>(TOKEN_KEY);
    
    if (!token) {
      return null;
    }

    // Check if token is expired
    if (this.isTokenExpired()) {
      this.clearTokens();
      return null;
    }

    return token;
  }

  /**
   * Store refresh token
   */
  static setRefreshToken(refreshToken: string): void {
    storage.set(REFRESH_TOKEN_KEY, refreshToken);
  }

  /**
   * Get refresh token
   */
  static getRefreshToken(): string | null {
    return storage.get<string>(REFRESH_TOKEN_KEY);
  }

  /**
   * Check if token is expired
   */
  static isTokenExpired(): boolean {
    const expiryTime = storage.get<number>(TOKEN_EXPIRY_KEY);
    
    if (!expiryTime) {
      return false; // If no expiry time, assume token is valid
    }

    return Date.now() >= expiryTime;
  }

  /**
   * Check if token will expire soon (within 5 minutes)
   */
  static isTokenExpiringSoon(): boolean {
    const expiryTime = storage.get<number>(TOKEN_EXPIRY_KEY);
    
    if (!expiryTime) {
      return false;
    }

    const fiveMinutesFromNow = Date.now() + (5 * 60 * 1000);
    return fiveMinutesFromNow >= expiryTime;
  }

  /**
   * Clear all tokens
   */
  static clearTokens(): void {
    storage.remove(TOKEN_KEY);
    storage.remove(REFRESH_TOKEN_KEY);
    storage.remove(TOKEN_EXPIRY_KEY);
  }

  /**
   * Decode JWT token payload (without verification)
   */
  static decodeToken(token: string): any {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      return JSON.parse(jsonPayload);
    } catch (error) {
      console.error('Error decoding token:', error);
      return null;
    }
  }

  /**
   * Get token expiration time
   */
  static getTokenExpiration(): Date | null {
    const token = this.getToken();
    
    if (!token) {
      return null;
    }

    const payload = this.decodeToken(token);
    
    if (!payload || !payload.exp) {
      return null;
    }

    return new Date(payload.exp * 1000);
  }

  /**
   * Get user ID from token
   */
  static getUserIdFromToken(): string | null {
    const token = this.getToken();
    
    if (!token) {
      return null;
    }

    const payload = this.decodeToken(token);
    return payload?.sub || payload?.userId || null;
  }

  /**
   * Get user email from token
   */
  static getUserEmailFromToken(): string | null {
    const token = this.getToken();
    
    if (!token) {
      return null;
    }

    const payload = this.decodeToken(token);
    return payload?.email || null;
  }
}