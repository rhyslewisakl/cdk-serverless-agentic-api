/**
 * Authentication service with AWS Amplify integration
 */

import { Amplify } from 'aws-amplify';
import { signIn, signUp, signOut, getCurrentUser, updatePassword, resetPassword, confirmResetPassword, fetchAuthSession } from 'aws-amplify/auth';
import { AuthUser, LoginCredentials, RegisterCredentials, PasswordChangeCredentials, PasswordResetCredentials } from '../types/auth';
import { AuthConfig } from '../types/api';
import { apiService } from './apiService';

class AuthService {
  private isConfigured = false;
  private config: AuthConfig | null = null;

  /**
   * Initialize Amplify configuration
   */
  async initialize(): Promise<void> {
    console.log('[AuthService] initialize() called, isConfigured:', this.isConfigured);
    if (this.isConfigured) return;

    try {
      console.log('[AuthService] Getting configuration from API...');
      // Get configuration from the API
      this.config = await apiService.getConfig();
      console.log('[AuthService] Config received:', this.config);
      
      // Skip Amplify configuration if using development config
      if (this.config.auth?.userPoolId === 'development') {
        console.warn('[AuthService] Skipping Amplify configuration in development mode');
        this.isConfigured = true;
        return;
      }
      
      console.log('[AuthService] Configuring Amplify with config:', this.config);
      // Configure Amplify
      Amplify.configure({
        Auth: {
          Cognito: {
            userPoolId: this.config.auth.userPoolId,
            userPoolClientId: this.config.auth.userPoolWebClientId,
          },
        },
      });

      console.log('[AuthService] Amplify configured successfully');
      this.isConfigured = true;
    } catch (error) {
      console.error('[AuthService] Failed to initialize auth service:', error);
      // Don't throw error, just mark as configured to prevent infinite loops
      this.isConfigured = true;
    }
  }

  /**
   * Ensure Amplify is configured before operations
   */
  private async ensureConfigured(): Promise<void> {
    console.log('[AuthService] ensureConfigured() called, isConfigured:', this.isConfigured);
    if (!this.isConfigured) {
      console.log('[AuthService] Not configured, calling initialize()');
      await this.initialize();
    }
  }

  /**
   * Login user with email and password
   */
  async login(credentials: LoginCredentials): Promise<AuthUser> {
    await this.ensureConfigured();

    try {
      const { isSignedIn } = await signIn({
        username: credentials.email,
        password: credentials.password,
      });

      if (!isSignedIn) {
        throw new Error('Sign in failed');
      }

      // Get user information
      const user = await this.getCurrentUser();
      if (!user) {
        throw new Error('Failed to get user information after login');
      }
      return user;
    } catch (error: any) {
      console.error('Login error:', error);
      
      // Handle specific Amplify errors
      if (error.name === 'NotAuthorizedException') {
        throw new Error('Invalid email or password');
      } else if (error.name === 'UserNotConfirmedException') {
        throw new Error('Please verify your email address');
      } else if (error.name === 'PasswordResetRequiredException') {
        throw new Error('Password reset required');
      } else if (error.name === 'UserNotFoundException') {
        throw new Error('User not found');
      } else if (error.name === 'TooManyRequestsException') {
        throw new Error('Too many login attempts. Please try again later');
      }
      
      throw new Error(error.message || 'Login failed');
    }
  }

  /**
   * Register new user
   */
  async register(credentials: RegisterCredentials): Promise<AuthUser> {
    await this.ensureConfigured();

    if (credentials.password !== credentials.confirmPassword) {
      throw new Error('Passwords do not match');
    }

    try {
      const { isSignUpComplete } = await signUp({
        username: credentials.email,
        password: credentials.password,
        options: {
          userAttributes: {
            email: credentials.email,
          },
        },
      });

      if (!isSignUpComplete) {
        // Registration successful but requires email verification
        // Return a temporary user object indicating verification is needed
        return {
          userId: credentials.email,
          email: credentials.email,
          emailVerified: false,
          attributes: { requiresVerification: true },
        };
      }

      // Auto-login after successful registration (if no verification required)
      const user = await this.login({
        email: credentials.email,
        password: credentials.password,
      });
      return user;
    } catch (error: any) {
      console.error('Registration error:', error);
      
      // Handle specific Amplify errors
      if (error.name === 'UsernameExistsException') {
        throw new Error('An account with this email already exists');
      } else if (error.name === 'InvalidPasswordException') {
        throw new Error('Password does not meet requirements');
      } else if (error.name === 'InvalidParameterException') {
        throw new Error('Invalid email format');
      }
      
      throw new Error(error.message || 'Registration failed');
    }
  }

  /**
   * Logout current user
   */
  async logout(): Promise<void> {
    await this.ensureConfigured();

    try {
      await signOut();
    } catch (error: any) {
      console.error('Logout error:', error);
      // Don't throw error for logout - always clear local state
    }
  }

  /**
   * Get current authenticated user
   */
  async getCurrentUser(): Promise<AuthUser | null> {
    console.log('[AuthService] getCurrentUser() called');
    await this.ensureConfigured();

    try {
      // Check if we're in development mode using cached config
      console.log('[AuthService] Checking config for development mode:', this.config);
      if (this.config?.auth?.userPoolId === 'development') {
        console.log('[AuthService] Development mode: no authenticated user');
        return null;
      }
      
      console.log('[AuthService] Calling Amplify getCurrentUser()');
      const user = await getCurrentUser();
      console.log('[AuthService] Amplify user received:', user);
      
      // Transform Amplify user to our AuthUser type
      const authUser: AuthUser = {
        userId: user.userId,
        email: user.signInDetails?.loginId || '',
        emailVerified: true, // Assume verified if user is authenticated
        attributes: user.signInDetails || {},
      };

      console.log('[AuthService] Transformed user:', authUser);
      return authUser;
    } catch (error: any) {
      console.error('[AuthService] Get current user error:', error);
      return null;
    }
  }

  /**
   * Change user password
   */
  async changePassword(credentials: PasswordChangeCredentials): Promise<void> {
    await this.ensureConfigured();

    if (credentials.newPassword !== credentials.confirmNewPassword) {
      throw new Error('New passwords do not match');
    }

    try {
      await updatePassword({
        oldPassword: credentials.oldPassword,
        newPassword: credentials.newPassword,
      });
    } catch (error: any) {
      console.error('Change password error:', error);
      
      // Handle specific Amplify errors
      if (error.name === 'NotAuthorizedException') {
        throw new Error('Current password is incorrect');
      } else if (error.name === 'InvalidPasswordException') {
        throw new Error('New password does not meet requirements');
      } else if (error.name === 'LimitExceededException') {
        throw new Error('Too many password change attempts. Please try again later');
      }
      
      throw new Error(error.message || 'Password change failed');
    }
  }

  /**
   * Check if user is authenticated
   */
  async isAuthenticated(): Promise<boolean> {
    try {
      const user = await this.getCurrentUser();
      return user !== null;
    } catch {
      return false;
    }
  }

  /**
   * Request password reset
   */
  async requestPasswordReset(email: string): Promise<void> {
    await this.ensureConfigured();

    try {
      await resetPassword({ username: email });
    } catch (error: any) {
      console.error('Password reset request error:', error);
      
      // Handle specific Amplify errors
      if (error.name === 'UserNotFoundException') {
        throw new Error('No account found with this email address');
      } else if (error.name === 'LimitExceededException') {
        throw new Error('Too many reset requests. Please try again later');
      } else if (error.name === 'InvalidParameterException') {
        throw new Error('Invalid email format');
      }
      
      throw new Error(error.message || 'Password reset request failed');
    }
  }

  /**
   * Confirm password reset with code
   */
  async confirmPasswordReset(credentials: PasswordResetCredentials): Promise<void> {
    await this.ensureConfigured();

    if (credentials.newPassword !== credentials.confirmNewPassword) {
      throw new Error('Passwords do not match');
    }

    try {
      await confirmResetPassword({
        username: credentials.email,
        confirmationCode: credentials.code,
        newPassword: credentials.newPassword,
      });
    } catch (error: any) {
      console.error('Password reset confirmation error:', error);
      
      // Handle specific Amplify errors
      if (error.name === 'CodeMismatchException') {
        throw new Error('Invalid or expired reset code');
      } else if (error.name === 'ExpiredCodeException') {
        throw new Error('Reset code has expired. Please request a new one');
      } else if (error.name === 'InvalidPasswordException') {
        throw new Error('New password does not meet requirements');
      } else if (error.name === 'UserNotFoundException') {
        throw new Error('User not found');
      }
      
      throw new Error(error.message || 'Password reset failed');
    }
  }

  /**
   * Check if user needs forced password change
   */
  async needsForcedPasswordChange(): Promise<boolean> {
    try {
      const user = await getCurrentUser();
      if (!user) return false;

      // Check if user has temporary password or other conditions requiring password change
      // This would typically be determined by user attributes or challenge responses
      // For demo purposes, we'll check a custom attribute
      return user.signInDetails?.loginId?.includes('temp') || false;
    } catch {
      return false;
    }
  }

  /**
   * Get authentication token for API calls
   */
  async getAuthToken(): Promise<string | null> {
    await this.ensureConfigured();

    try {
      // Check if we're in development mode
      if (this.config?.auth?.userPoolId === 'development') {
        return null;
      }

      const session = await fetchAuthSession();
      return session.tokens?.accessToken?.toString() || null;
    } catch {
      return null;
    }
  }
}

// Export singleton instance
export const authService = new AuthService();