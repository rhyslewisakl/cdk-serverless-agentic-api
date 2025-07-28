/**
 * API response and request types for the React Example Application
 */

// Base API response structure
export interface ApiResponse<T = any> {
  data?: T;
  error?: string;
  message?: string;
  timestamp?: string;
  requestId?: string;
}

// Error response structure
export interface ErrorResponse {
  error: string;
  message: string;
  timestamp: string;
  requestId?: string;
  details?: any;
}

// Pagination parameters
export interface PaginationParams {
  limit?: number;
  nextToken?: string;
}

// Paginated response structure
export interface PaginatedResponse<T> {
  items: T[];
  nextToken?: string;
  count: number;
}

// Authentication related types
export interface AuthConfig {
  region: string;
  userPoolId: string;
  userPoolWebClientId: string;
  apiEndpoint: string;
}

export interface UserInfo {
  userId: string;
  email: string;
  emailVerified: boolean;
  groups?: string[];
  attributes?: Record<string, any>;
}

export interface PasswordChangeRequest {
  oldPassword: string;
  newPassword: string;
}

export interface PasswordChangeResponse {
  success: boolean;
  message: string;
}