/**
 * Authentication related types
 */

export interface AuthUser {
  userId: string;
  email: string;
  emailVerified: boolean;
  groups?: string[];
  attributes?: Record<string, any>;
}

export interface AuthState {
  isAuthenticated: boolean;
  user: AuthUser | null;
  isLoading: boolean;
  error: string | null;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  email: string;
  password: string;
  confirmPassword: string;
}

export interface PasswordChangeCredentials {
  oldPassword: string;
  newPassword: string;
  confirmNewPassword: string;
}

export interface PasswordResetCredentials {
  email: string;
  code: string;
  newPassword: string;
  confirmNewPassword: string;
}

export interface AuthContextType {
  authState: AuthState;
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (credentials: RegisterCredentials) => Promise<void>;
  logout: () => Promise<void>;
  changePassword: (credentials: PasswordChangeCredentials) => Promise<void>;
  requestPasswordReset: (email: string) => Promise<void>;
  confirmPasswordReset: (credentials: PasswordResetCredentials) => Promise<void>;
  needsForcedPasswordChange: () => Promise<boolean>;
  refreshAuth: () => Promise<void>;
}

// Form validation types
export interface LoginFormErrors {
  email?: string;
  password?: string;
  general?: string;
}

export interface RegisterFormErrors {
  email?: string;
  password?: string;
  confirmPassword?: string;
  general?: string;
}

export interface PasswordChangeFormErrors {
  oldPassword?: string;
  newPassword?: string;
  confirmNewPassword?: string;
  general?: string;
}

export interface PasswordResetFormErrors {
  email?: string;
  code?: string;
  newPassword?: string;
  confirmNewPassword?: string;
  general?: string;
}