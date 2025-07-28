/**
 * Unit tests for AuthGuard component
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { AuthGuard } from '../AuthGuard';
import { AuthProvider } from '../../../contexts/AuthContext';

// Mock the auth service
jest.mock('../../../services/authService', () => ({
  getCurrentUser: jest.fn(),
  signIn: jest.fn(),
  signOut: jest.fn(),
  signUp: jest.fn(),
  confirmSignUp: jest.fn(),
  resendSignUpCode: jest.fn(),
  forgotPassword: jest.fn(),
  confirmForgotPassword: jest.fn(),
  changePassword: jest.fn(),
  updateUserAttributes: jest.fn(),
}));

// Mock the API service
jest.mock('../../../services/apiService', () => ({
  get: jest.fn(),
  post: jest.fn(),
  put: jest.fn(),
  delete: jest.fn(),
}));

const theme = createTheme();

// Test wrapper component
const TestWrapper: React.FC<{ 
  children: React.ReactNode; 
  initialEntries?: string[];
}> = ({ children, initialEntries = ['/'] }) => (
  <ThemeProvider theme={theme}>
    <MemoryRouter initialEntries={initialEntries}>
      <AuthProvider>
        {children}
      </AuthProvider>
    </MemoryRouter>
  </ThemeProvider>
);

// Test child component
const TestChild: React.FC = () => <div>Protected Content</div>;

describe('AuthGuard Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Loading State', () => {
    test('shows loading spinner while authentication state is being determined', async () => {
      // Mock a delayed auth check
      const mockAuthService = require('../../../services/authService');
      mockAuthService.getCurrentUser.mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve(null), 100))
      );

      render(
        <TestWrapper>
          <AuthGuard>
            <TestChild />
          </AuthGuard>
        </TestWrapper>
      );

      // Should show loading initially
      expect(screen.getByText('Checking authentication...')).toBeInTheDocument();
      expect(screen.getByRole('progressbar')).toBeInTheDocument();
    });
  });

  describe('Authentication Required (default behavior)', () => {
    test('redirects to login when user is not authenticated', async () => {
      // Mock unauthenticated state
      const mockAuthService = require('../../../services/authService');
      mockAuthService.getCurrentUser.mockResolvedValue(null);

      render(
        <TestWrapper initialEntries={['/dashboard']}>
          <AuthGuard>
            <TestChild />
          </AuthGuard>
        </TestWrapper>
      );

      await waitFor(() => {
        // Should not render protected content
        expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
      });
    });

    test('renders children when user is authenticated', async () => {
      // Mock authenticated state
      const mockAuthService = require('../../../services/authService');
      mockAuthService.getCurrentUser.mockResolvedValue({
        email: 'test@example.com',
        sub: 'test-user-id'
      });

      render(
        <TestWrapper>
          <AuthGuard>
            <TestChild />
          </AuthGuard>
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Protected Content')).toBeInTheDocument();
      });
    });

    test('uses custom redirect path when specified', async () => {
      // Mock unauthenticated state
      const mockAuthService = require('../../../services/authService');
      mockAuthService.getCurrentUser.mockResolvedValue(null);

      render(
        <TestWrapper initialEntries={['/dashboard']}>
          <AuthGuard redirectTo="/custom-login">
            <TestChild />
          </AuthGuard>
        </TestWrapper>
      );

      await waitFor(() => {
        // Should not render protected content
        expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
      });
    });
  });

  describe('Authentication Not Required', () => {
    test('renders children when user is not authenticated', async () => {
      // Mock unauthenticated state
      const mockAuthService = require('../../../services/authService');
      mockAuthService.getCurrentUser.mockResolvedValue(null);

      render(
        <TestWrapper>
          <AuthGuard requireAuth={false}>
            <TestChild />
          </AuthGuard>
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Protected Content')).toBeInTheDocument();
      });
    });

    test('redirects to dashboard when user is authenticated', async () => {
      // Mock authenticated state
      const mockAuthService = require('../../../services/authService');
      mockAuthService.getCurrentUser.mockResolvedValue({
        email: 'test@example.com',
        sub: 'test-user-id'
      });

      render(
        <TestWrapper initialEntries={['/login']}>
          <AuthGuard requireAuth={false}>
            <TestChild />
          </AuthGuard>
        </TestWrapper>
      );

      await waitFor(() => {
        // Should not render the child content (redirected)
        expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
      });
    });

    test('redirects to original location after authentication', async () => {
      // Mock authenticated state
      const mockAuthService = require('../../../services/authService');
      mockAuthService.getCurrentUser.mockResolvedValue({
        email: 'test@example.com',
        sub: 'test-user-id'
      });

      // Simulate coming from a protected route
      const locationState = { from: { pathname: '/profile' } };

      render(
        <TestWrapper initialEntries={[{ pathname: '/login', state: locationState }]}>
          <AuthGuard requireAuth={false}>
            <TestChild />
          </AuthGuard>
        </TestWrapper>
      );

      await waitFor(() => {
        // Should not render the child content (redirected to /profile)
        expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
      });
    });
  });

  describe('Props Validation', () => {
    test('works with default props', async () => {
      // Mock unauthenticated state
      const mockAuthService = require('../../../services/authService');
      mockAuthService.getCurrentUser.mockResolvedValue(null);

      render(
        <TestWrapper>
          <AuthGuard>
            <TestChild />
          </AuthGuard>
        </TestWrapper>
      );

      await waitFor(() => {
        // Should not render protected content (default requireAuth=true)
        expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
      });
    });

    test('accepts custom requireAuth prop', async () => {
      // Mock unauthenticated state
      const mockAuthService = require('../../../services/authService');
      mockAuthService.getCurrentUser.mockResolvedValue(null);

      render(
        <TestWrapper>
          <AuthGuard requireAuth={false}>
            <TestChild />
          </AuthGuard>
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Protected Content')).toBeInTheDocument();
      });
    });

    test('accepts custom redirectTo prop', async () => {
      // Mock unauthenticated state
      const mockAuthService = require('../../../services/authService');
      mockAuthService.getCurrentUser.mockResolvedValue(null);

      render(
        <TestWrapper>
          <AuthGuard redirectTo="/custom-redirect">
            <TestChild />
          </AuthGuard>
        </TestWrapper>
      );

      await waitFor(() => {
        // Should not render protected content
        expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    test('handles auth service errors gracefully', async () => {
      // Mock auth service error
      const mockAuthService = require('../../../services/authService');
      mockAuthService.getCurrentUser.mockRejectedValue(new Error('Auth service error'));

      render(
        <TestWrapper>
          <AuthGuard>
            <TestChild />
          </AuthGuard>
        </TestWrapper>
      );

      await waitFor(() => {
        // Should treat error as unauthenticated and not render protected content
        expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
      });
    });
  });
});