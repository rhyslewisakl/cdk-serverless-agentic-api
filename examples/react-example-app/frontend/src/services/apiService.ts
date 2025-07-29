/**
 * API service layer with Axios configuration and interceptors
 */

import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { ApiResponse, ErrorResponse, AuthConfig, UserInfo } from '../types/api';
import { API_ENDPOINTS } from '../utils/constants';
import { getErrorMessage } from '../utils/helpers';
import { errorService } from './errorService';
import { networkRetryService } from '../utils/networkRetry';

class ApiService {
  private axiosInstance: AxiosInstance;
  private baseURL: string;

  constructor() {
    // Initialize with empty base URL to use relative paths
    this.baseURL = '';
    
    this.axiosInstance = axios.create({
      baseURL: this.baseURL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  /**
   * Set up request and response interceptors
   */
  private setupInterceptors(): void {
    // Request interceptor
    this.axiosInstance.interceptors.request.use(
      async (config) => {
        // Skip auth token for config endpoint to avoid circular dependency
        if (!config.url?.includes(API_ENDPOINTS.CONFIG)) {
          // Add authentication token if available
          const token = await this.getAuthToken();
          if (token) {
            config.headers.Authorization = `Bearer ${token}`;
          }
        }

        // Add request timestamp for debugging
        (config as any).metadata = { startTime: new Date() };
        
        console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`);
        return config;
      },
      (error) => {
        console.error('Request interceptor error:', error);
        return Promise.reject(error);
      }
    );

    // Response interceptor
    this.axiosInstance.interceptors.response.use(
      (response: AxiosResponse) => {
        // Log response time for debugging
        const config = response.config as any;
        if (config.metadata?.startTime) {
          const duration = new Date().getTime() - config.metadata.startTime.getTime();
          console.log(`API Response: ${config.method?.toUpperCase()} ${config.url} (${duration}ms)`);
        }

        return response;
      },
      async (error) => {
        const originalRequest = error.config;

        // Handle 401 Unauthorized errors
        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;

          try {
            // Try to refresh the token
            await this.refreshAuthToken();
            
            // Retry the original request with new token
            const token = await this.getAuthToken();
            if (token) {
              originalRequest.headers.Authorization = `Bearer ${token}`;
              return this.axiosInstance(originalRequest);
            }
          } catch (refreshError) {
            // If refresh fails, redirect to login
            console.error('Token refresh failed:', refreshError);
            this.handleAuthenticationFailure();
            return Promise.reject(error);
          }
        }

        // Handle network errors
        if (!error.response) {
          const networkError = {
            url: originalRequest.url || 'unknown',
            method: originalRequest.method?.toUpperCase() || 'unknown',
          };
          
          errorService.logNetworkError(networkError, {
            originalError: error.message,
          });
          
          console.error('Network error:', error.message);
          return Promise.reject(new Error('Network error. Please check your connection.'));
        }

        // Handle API errors
        const errorResponse: ErrorResponse = error.response.data || {
          error: 'Unknown error',
          message: error.message || 'An unexpected error occurred',
          timestamp: new Date().toISOString(),
        };

        // Log API errors
        errorService.logNetworkError({
          url: originalRequest.url || 'unknown',
          method: originalRequest.method?.toUpperCase() || 'unknown',
          status: error.response.status,
          statusText: error.response.statusText,
          responseData: errorResponse,
          requestData: originalRequest.data,
        });

        console.error('API Error:', errorResponse);
        return Promise.reject(errorResponse);
      }
    );
  }

  /**
   * Get authentication token
   */
  private async getAuthToken(): Promise<string | null> {
    try {
      // Import authService dynamically to avoid circular dependency
      const { authService } = await import('./authService');
      return await authService.getAuthToken();
    } catch (error) {
      console.error('Error getting auth token:', error);
      return null;
    }
  }

  /**
   * Refresh authentication token
   */
  private async refreshAuthToken(): Promise<void> {
    try {
      // Import authService dynamically to avoid circular dependency
      const { authService } = await import('./authService');
      const user = await authService.getCurrentUser();
      if (!user) {
        throw new Error('No authenticated user');
      }
    } catch (error) {
      console.error('Error refreshing auth token:', error);
      throw error;
    }
  }

  /**
   * Handle authentication failure
   */
  private handleAuthenticationFailure(): void {
    // Clear any stored tokens and redirect to login
    console.log('Authentication failure - redirecting to login');
    
    // Clear tokens
    try {
      const { TokenManager } = require('../utils/tokenManager');
      TokenManager.clearTokens();
    } catch (error) {
      console.error('Error clearing tokens:', error);
    }

    // Redirect to login page
    if (window.location.pathname !== '/login') {
      window.location.href = '/login';
    }
  }

  /**
   * Update base URL after configuration is loaded
   */
  updateBaseURL(baseURL: string): void {
    this.baseURL = baseURL;
    this.axiosInstance.defaults.baseURL = baseURL;
  }

  /**
   * Generic GET request with retry logic
   */
  async get<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    return networkRetryService.execute(async () => {
      try {
        const response = await this.axiosInstance.get<ApiResponse<T>>(url, config);
        return (response.data as any).data || response.data;
      } catch (error) {
        throw this.handleError(error);
      }
    });
  }

  /**
   * Generic POST request with retry logic for safe operations
   */
  async post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    // Only retry POST requests for idempotent operations (like authentication)
    const shouldRetry = url.includes('/auth/') || url.includes('/config') || url.includes('/whoami');
    
    if (shouldRetry) {
      return networkRetryService.execute(async () => {
        try {
          const response = await this.axiosInstance.post<ApiResponse<T>>(url, data, config);
          return (response.data as any).data || response.data;
        } catch (error) {
          throw this.handleError(error);
        }
      });
    } else {
      try {
        const response = await this.axiosInstance.post<ApiResponse<T>>(url, data, config);
        return (response.data as any).data || response.data;
      } catch (error) {
        throw this.handleError(error);
      }
    }
  }

  /**
   * Generic PUT request (no retry for data modification)
   */
  async put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    try {
      const response = await this.axiosInstance.put<ApiResponse<T>>(url, data, config);
      return (response.data as any).data || response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Generic DELETE request (no retry for data modification)
   */
  async delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    try {
      const response = await this.axiosInstance.delete<ApiResponse<T>>(url, config);
      return (response.data as any).data || response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Handle and normalize errors
   */
  private handleError(error: any): Error {
    if (error.error && error.message) {
      // Already an ErrorResponse
      return new Error(error.message);
    }
    
    return new Error(getErrorMessage(error));
  }

  /**
   * Get application configuration
   */
  async getConfig(): Promise<AuthConfig> {
    console.log('[ApiService] getConfig() called, making request to:', API_ENDPOINTS.CONFIG);
    try {
      console.log('[ApiService] Calling this.get() for config...');
      const config = await this.get<AuthConfig>(API_ENDPOINTS.CONFIG);
      console.log('[ApiService] Config received from API:', config);
      
      return config;
    } catch (error) {
      console.error('[ApiService] Failed to get config:', error);
      
      // Return a default config for development/testing
      const defaultConfig: AuthConfig = {
        auth: {
          userPoolId: 'development',
          userPoolWebClientId: 'development',
          region: 'us-east-1',
        },
        version: '1.0.0',
      };
      
      console.warn('[ApiService] Using default configuration for development:', defaultConfig);
      return defaultConfig;
    }
  }

  /**
   * Get current user information
   */
  async getCurrentUserInfo(): Promise<UserInfo> {
    return this.get<UserInfo>(API_ENDPOINTS.WHOAMI);
  }

  /**
   * Change user password
   */
  async changePassword(oldPassword: string, newPassword: string): Promise<void> {
    return this.post(API_ENDPOINTS.AUTH.CHANGE_PASSWORD, {
      oldPassword,
      newPassword,
    });
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<{ status: string; timestamp: string }> {
    return this.get('/health');
  }
}

// Export singleton instance
export const apiService = new ApiService();