/**
 * Tests for password management functionality in AuthService
 */

import { authService } from '../authService';

// Mock AWS Amplify
jest.mock('aws-amplify', () => ({
  Amplify: {
    configure: jest.fn(),
  },
}));

jest.mock('aws-amplify/auth', () => ({
  signIn: jest.fn(),
  signUp: jest.fn(),
  signOut: jest.fn(),
  getCurrentUser: jest.fn(),
  updatePassword: jest.fn(),
  resetPassword: jest.fn(),
  confirmResetPassword: jest.fn(),
}));

// Mock API service
jest.mock('../apiService', () => ({
  apiService: {
    getConfig: jest.fn().mockResolvedValue({
      region: 'us-east-1',
      userPoolId: 'us-east-1_test',
      userPoolWebClientId: 'test-client-id',
      apiEndpoint: 'https://api.example.com',
    }),
  },
}));

describe('AuthService - Password Management', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('requestPasswordReset', () => {
    it('successfully requests password reset', async () => {
      const { resetPassword } = require('aws-amplify/auth');
      resetPassword.mockResolvedValueOnce({} as any);

      await authService.requestPasswordReset('test@example.com');

      expect(resetPassword).toHaveBeenCalledWith({
        username: 'test@example.com',
      });
    });

    it('handles UserNotFoundException', async () => {
      const { resetPassword } = require('aws-amplify/auth');
      const error = new Error('User not found');
      error.name = 'UserNotFoundException';
      resetPassword.mockRejectedValueOnce(error);

      await expect(authService.requestPasswordReset('test@example.com'))
        .rejects.toThrow('No account found with this email address');
    });

    it('handles LimitExceededException', async () => {
      const { resetPassword } = require('aws-amplify/auth');
      const error = new Error('Too many requests');
      error.name = 'LimitExceededException';
      resetPassword.mockRejectedValueOnce(error);

      await expect(authService.requestPasswordReset('test@example.com'))
        .rejects.toThrow('Too many reset requests. Please try again later');
    });

    it('handles InvalidParameterException', async () => {
      const { resetPassword } = require('aws-amplify/auth');
      const error = new Error('Invalid parameter');
      error.name = 'InvalidParameterException';
      resetPassword.mockRejectedValueOnce(error);

      await expect(authService.requestPasswordReset('invalid-email'))
        .rejects.toThrow('Invalid email format');
    });

    it('handles generic errors', async () => {
      const { resetPassword } = require('aws-amplify/auth');
      const error = new Error('Network error');
      resetPassword.mockRejectedValueOnce(error);

      await expect(authService.requestPasswordReset('test@example.com'))
        .rejects.toThrow('Network error');
    });

    it('handles errors without message', async () => {
      const { resetPassword } = require('aws-amplify/auth');
      const error = new Error();
      error.name = 'UnknownError';
      resetPassword.mockRejectedValueOnce(error);

      await expect(authService.requestPasswordReset('test@example.com'))
        .rejects.toThrow('Password reset request failed');
    });
  });

  describe('confirmPasswordReset', () => {
    const validCredentials = {
      email: 'test@example.com',
      code: '123456',
      newPassword: 'NewPassword123!',
      confirmNewPassword: 'NewPassword123!',
    };

    it('successfully confirms password reset', async () => {
      const { confirmResetPassword } = require('aws-amplify/auth');
      confirmResetPassword.mockResolvedValueOnce({} as any);

      await authService.confirmPasswordReset(validCredentials);

      expect(confirmResetPassword).toHaveBeenCalledWith({
        username: 'test@example.com',
        confirmationCode: '123456',
        newPassword: 'NewPassword123!',
      });
    });

    it('validates password confirmation match', async () => {
      const { confirmResetPassword } = require('aws-amplify/auth');
      const invalidCredentials = {
        ...validCredentials,
        confirmNewPassword: 'DifferentPassword123!',
      };

      await expect(authService.confirmPasswordReset(invalidCredentials))
        .rejects.toThrow('Passwords do not match');

      expect(confirmResetPassword).not.toHaveBeenCalled();
    });

    it('handles CodeMismatchException', async () => {
      const { confirmResetPassword } = require('aws-amplify/auth');
      const error = new Error('Invalid code');
      error.name = 'CodeMismatchException';
      confirmResetPassword.mockRejectedValueOnce(error);

      await expect(authService.confirmPasswordReset(validCredentials))
        .rejects.toThrow('Invalid or expired reset code');
    });

    it('handles ExpiredCodeException', async () => {
      const { confirmResetPassword } = require('aws-amplify/auth');
      const error = new Error('Code expired');
      error.name = 'ExpiredCodeException';
      confirmResetPassword.mockRejectedValueOnce(error);

      await expect(authService.confirmPasswordReset(validCredentials))
        .rejects.toThrow('Reset code has expired. Please request a new one');
    });

    it('handles InvalidPasswordException', async () => {
      const { confirmResetPassword } = require('aws-amplify/auth');
      const error = new Error('Invalid password');
      error.name = 'InvalidPasswordException';
      confirmResetPassword.mockRejectedValueOnce(error);

      await expect(authService.confirmPasswordReset(validCredentials))
        .rejects.toThrow('New password does not meet requirements');
    });

    it('handles UserNotFoundException', async () => {
      const { confirmResetPassword } = require('aws-amplify/auth');
      const error = new Error('User not found');
      error.name = 'UserNotFoundException';
      confirmResetPassword.mockRejectedValueOnce(error);

      await expect(authService.confirmPasswordReset(validCredentials))
        .rejects.toThrow('User not found');
    });

    it('handles generic errors', async () => {
      const { confirmResetPassword } = require('aws-amplify/auth');
      const error = new Error('Network error');
      confirmResetPassword.mockRejectedValueOnce(error);

      await expect(authService.confirmPasswordReset(validCredentials))
        .rejects.toThrow('Network error');
    });

    it('handles errors without message', async () => {
      const { confirmResetPassword } = require('aws-amplify/auth');
      const error = new Error();
      error.name = 'UnknownError';
      confirmResetPassword.mockRejectedValueOnce(error);

      await expect(authService.confirmPasswordReset(validCredentials))
        .rejects.toThrow('Password reset failed');
    });
  });

  describe('needsForcedPasswordChange', () => {
    it('returns true for users with temporary password indicator', async () => {
      const { getCurrentUser } = require('aws-amplify/auth');
      getCurrentUser.mockResolvedValueOnce({
        userId: '123',
        signInDetails: {
          loginId: 'temp@example.com',
        },
      } as any);

      const result = await authService.needsForcedPasswordChange();
      expect(result).toBe(true);
    });

    it('returns false for regular users', async () => {
      const { getCurrentUser } = require('aws-amplify/auth');
      getCurrentUser.mockResolvedValueOnce({
        userId: '123',
        signInDetails: {
          loginId: 'user@example.com',
        },
      } as any);

      const result = await authService.needsForcedPasswordChange();
      expect(result).toBe(false);
    });

    it('returns false when user has no signInDetails', async () => {
      const { getCurrentUser } = require('aws-amplify/auth');
      getCurrentUser.mockResolvedValueOnce({
        userId: '123',
      } as any);

      const result = await authService.needsForcedPasswordChange();
      expect(result).toBe(false);
    });

    it('returns false when getCurrentUser fails', async () => {
      const { getCurrentUser } = require('aws-amplify/auth');
      getCurrentUser.mockRejectedValueOnce(new Error('Not authenticated'));

      const result = await authService.needsForcedPasswordChange();
      expect(result).toBe(false);
    });

    it('returns false when no user is found', async () => {
      const { getCurrentUser } = require('aws-amplify/auth');
      getCurrentUser.mockResolvedValueOnce(null as any);

      const result = await authService.needsForcedPasswordChange();
      expect(result).toBe(false);
    });
  });

  describe('initialization', () => {
    it('initializes service before password reset operations', async () => {
      const { resetPassword } = require('aws-amplify/auth');
      const { apiService } = require('../apiService');
      
      // Reset the service to uninitialized state
      (authService as any).isConfigured = false;
      
      resetPassword.mockResolvedValueOnce({} as any);

      await authService.requestPasswordReset('test@example.com');

      expect(apiService.getConfig).toHaveBeenCalled();
      expect(resetPassword).toHaveBeenCalled();
    });

    it('does not reinitialize if already configured', async () => {
      const { resetPassword } = require('aws-amplify/auth');
      const { apiService } = require('../apiService');
      
      // Ensure service is configured
      await authService.initialize();
      apiService.getConfig.mockClear();
      
      resetPassword.mockResolvedValueOnce({} as any);

      await authService.requestPasswordReset('test@example.com');

      expect(apiService.getConfig).not.toHaveBeenCalled();
      expect(resetPassword).toHaveBeenCalled();
    });
  });
});