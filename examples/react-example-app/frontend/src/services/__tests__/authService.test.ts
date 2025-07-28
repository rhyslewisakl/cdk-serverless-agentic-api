/**
 * Unit tests for AuthService
 */

import { authService } from '../authService';
import { LoginCredentials, RegisterCredentials } from '../../types/auth';

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
  changePassword: jest.fn(),
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

describe('AuthService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('initialize', () => {
    it('should configure Amplify with correct settings', async () => {
      const { Amplify } = require('aws-amplify');
      
      await authService.initialize();
      
      expect(Amplify.configure).toHaveBeenCalledWith({
        Auth: {
          Cognito: {
            region: 'us-east-1',
            userPoolId: 'us-east-1_test',
            userPoolClientId: 'test-client-id',
          },
        },
      });
    });

    it('should not configure Amplify multiple times', async () => {
      const { Amplify } = require('aws-amplify');
      
      await authService.initialize();
      await authService.initialize();
      
      expect(Amplify.configure).toHaveBeenCalledTimes(1);
    });
  });

  describe('login', () => {
    const mockCredentials: LoginCredentials = {
      email: 'test@example.com',
      password: 'password123',
    };

    it('should login successfully with valid credentials', async () => {
      const { signIn, getCurrentUser } = require('aws-amplify/auth');
      
      signIn.mockResolvedValue({ isSignedIn: true });
      getCurrentUser.mockResolvedValue({
        userId: 'user-123',
        signInDetails: { loginId: 'test@example.com' },
      });

      const result = await authService.login(mockCredentials);

      expect(signIn).toHaveBeenCalledWith({
        username: 'test@example.com',
        password: 'password123',
      });
      expect(result).toEqual({
        userId: 'user-123',
        email: 'test@example.com',
        emailVerified: true,
        attributes: { loginId: 'test@example.com' },
      });
    });

    it('should throw error for invalid credentials', async () => {
      const { signIn } = require('aws-amplify/auth');
      
      signIn.mockRejectedValue({ name: 'NotAuthorizedException' });

      await expect(authService.login(mockCredentials)).rejects.toThrow('Invalid email or password');
    });

    it('should handle unconfirmed user error', async () => {
      const { signIn } = require('aws-amplify/auth');
      
      signIn.mockRejectedValue({ name: 'UserNotConfirmedException' });

      await expect(authService.login(mockCredentials)).rejects.toThrow('Please verify your email address');
    });
  });

  describe('register', () => {
    const mockCredentials: RegisterCredentials = {
      email: 'test@example.com',
      password: 'password123',
      confirmPassword: 'password123',
    };

    it('should register successfully with valid credentials', async () => {
      const { signUp, signIn, getCurrentUser } = require('aws-amplify/auth');
      
      signUp.mockResolvedValue({ isSignUpComplete: true });
      signIn.mockResolvedValue({ isSignedIn: true });
      getCurrentUser.mockResolvedValue({
        userId: 'user-123',
        signInDetails: { loginId: 'test@example.com' },
      });

      const result = await authService.register(mockCredentials);

      expect(signUp).toHaveBeenCalledWith({
        username: 'test@example.com',
        password: 'password123',
        options: {
          userAttributes: {
            email: 'test@example.com',
          },
        },
      });
      expect(result).toEqual({
        userId: 'user-123',
        email: 'test@example.com',
        emailVerified: true,
        attributes: { loginId: 'test@example.com' },
      });
    });

    it('should throw error for mismatched passwords', async () => {
      const invalidCredentials = {
        ...mockCredentials,
        confirmPassword: 'different-password',
      };

      await expect(authService.register(invalidCredentials)).rejects.toThrow('Passwords do not match');
    });

    it('should handle existing user error', async () => {
      const { signUp } = require('aws-amplify/auth');
      
      signUp.mockRejectedValue({ name: 'UsernameExistsException' });

      await expect(authService.register(mockCredentials)).rejects.toThrow('An account with this email already exists');
    });
  });

  describe('logout', () => {
    it('should logout successfully', async () => {
      const { signOut } = require('aws-amplify/auth');
      
      signOut.mockResolvedValue(undefined);

      await expect(authService.logout()).resolves.toBeUndefined();
      expect(signOut).toHaveBeenCalled();
    });

    it('should not throw error if logout fails', async () => {
      const { signOut } = require('aws-amplify/auth');
      
      signOut.mockRejectedValue(new Error('Logout failed'));

      await expect(authService.logout()).resolves.toBeUndefined();
    });
  });

  describe('getCurrentUser', () => {
    it('should return current user when authenticated', async () => {
      const { getCurrentUser } = require('aws-amplify/auth');
      
      getCurrentUser.mockResolvedValue({
        userId: 'user-123',
        signInDetails: { loginId: 'test@example.com' },
      });

      const result = await authService.getCurrentUser();

      expect(result).toEqual({
        userId: 'user-123',
        email: 'test@example.com',
        emailVerified: true,
        attributes: { loginId: 'test@example.com' },
      });
    });

    it('should return null when not authenticated', async () => {
      const { getCurrentUser } = require('aws-amplify/auth');
      
      getCurrentUser.mockRejectedValue(new Error('Not authenticated'));

      const result = await authService.getCurrentUser();

      expect(result).toBeNull();
    });
  });

  describe('isAuthenticated', () => {
    it('should return true when user is authenticated', async () => {
      const { getCurrentUser } = require('aws-amplify/auth');
      
      getCurrentUser.mockResolvedValue({
        userId: 'user-123',
        signInDetails: { loginId: 'test@example.com' },
      });

      const result = await authService.isAuthenticated();

      expect(result).toBe(true);
    });

    it('should return false when user is not authenticated', async () => {
      const { getCurrentUser } = require('aws-amplify/auth');
      
      getCurrentUser.mockRejectedValue(new Error('Not authenticated'));

      const result = await authService.isAuthenticated();

      expect(result).toBe(false);
    });
  });
});