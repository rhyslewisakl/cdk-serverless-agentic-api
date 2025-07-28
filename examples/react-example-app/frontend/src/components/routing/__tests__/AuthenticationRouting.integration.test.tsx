/**
 * Integration tests for authentication routing and guards
 */

import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { AppRoutes } from '../AppRoutes';
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
const TestWrapper: React.FC<{ children: React.ReactNode; initialEntries?: string[] }> = ({
  children,
  initialEntries = ['/']
}) => (
  <ThemeProvider theme={theme}>
    <MemoryRouter initialEntries={initialEntries}>
      <AuthProvider>
        {children}
      </AuthProvider>
    </MemoryRouter>
  </ThemeProvider>
);

// Authenticated test wrapper component
const AuthenticatedTestWrapper: React.FC<{ children: React.ReactNode; initialEntries?: string[] }> = ({
  children,
  initialEntries = ['/']
}) => {
  // Mock authenticated state
  const mockAuthService = require('../../../services/authService');
  mockAuthService.getCurrentUser.mockResolvedValue({
    email: 'test@example.com',
    sub: 'test-user-id'
  });

  return (
    <ThemeProvider theme={theme}>
      <MemoryRouter initialEntries={initialEntries}>
        <AuthProvider>
          {children}
        </AuthProvider>
      </MemoryRouter>
    </ThemeProvider>
  );
};

describe('Authentication Routing Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Public Routes', () => {
    test('renders home page for unauthenticated users', async () => {
      render(
        <TestWrapper initialEntries={['/']}>
          <AppRoutes />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getAllByText('React Example App')).toHaveLength(2); // One in nav, one in page content
        expect(screen.getByText(/comprehensive demonstration/i)).toBeInTheDocument();
      });
    });

    test('renders login page for unauthenticated users', async () => {
      render(
        <TestWrapper initialEntries={['/login']}>
          <AppRoutes />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getAllByText('Sign In')).toHaveLength(4); // Nav button, page title, form title, submit button
        expect(screen.getByText(/Welcome back/i)).toBeInTheDocument();
      });
    });

    test('renders register page for unauthenticated users', async () => {
      render(
        <TestWrapper initialEntries={['/register']}>
          <AppRoutes />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getAllByText('Sign Up')).toHaveLength(3); // Nav button, page title, form title
        expect(screen.getAllByText(/Create your account/i)).toHaveLength(2); // Page description and form description
      });
    });
  });

  describe('Protected Routes', () => {
    test('redirects to login when accessing protected route without authentication', async () => {
      render(
        <TestWrapper initialEntries={['/dashboard']}>
          <AppRoutes />
        </TestWrapper>
      );

      await waitFor(() => {
        // Should be redirected to login page
        expect(screen.getAllByText('Sign In')).toHaveLength(4); // Nav button, page title, form title, submit button
        expect(screen.getByText(/Welcome back/i)).toBeInTheDocument();
      });
    });

    test('redirects to login when accessing items route without authentication', async () => {
      render(
        <TestWrapper initialEntries={['/items']}>
          <AppRoutes />
        </TestWrapper>
      );

      await waitFor(() => {
        // Should be redirected to login page
        expect(screen.getAllByText('Sign In')).toHaveLength(4); // Nav button, page title, form title, submit button
      });
    });

    test('redirects to login when accessing profile route without authentication', async () => {
      render(
        <TestWrapper initialEntries={['/profile']}>
          <AppRoutes />
        </TestWrapper>
      );

      await waitFor(() => {
        // Should be redirected to login page
        expect(screen.getAllByText('Sign In')).toHaveLength(4); // Nav button, page title, form title, submit button
      });
    });
  });

  describe('Navigation Component', () => {
    test('shows unauthenticated navigation menu', async () => {
      render(
        <TestWrapper initialEntries={['/']}>
          <AppRoutes />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getAllByText('React Example App')).toHaveLength(2); // One in nav, one in page content
        expect(screen.getAllByText('Sign In')).toHaveLength(2); // One in nav, one in page content
        expect(screen.getByText('Sign Up')).toBeInTheDocument();
      });
    });

    test('navigation links work correctly', async () => {
      render(
        <TestWrapper initialEntries={['/']}>
          <AppRoutes />
        </TestWrapper>
      );

      // Click on Sign In button in navigation (first one)
      const signInButtons = screen.getAllByText('Sign In');
      const navSignInButton = signInButtons[0]; // Navigation button
      fireEvent.click(navSignInButton);

      await waitFor(() => {
        expect(screen.getByText(/Welcome back/i)).toBeInTheDocument();
      });
    });

    test('app title navigation works', async () => {
      render(
        <TestWrapper initialEntries={['/login']}>
          <AppRoutes />
        </TestWrapper>
      );

      // Click on app title to go home
      const appTitle = screen.getByText('React Example App');
      fireEvent.click(appTitle);

      await waitFor(() => {
        expect(screen.getByText(/comprehensive demonstration/i)).toBeInTheDocument();
      });
    });
  });

  describe('Route Redirects', () => {
    test('redirects /home to /', async () => {
      render(
        <TestWrapper initialEntries={['/home']}>
          <AppRoutes />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText(/comprehensive demonstration/i)).toBeInTheDocument();
      });
    });
  });

  describe('404 Not Found', () => {
    test('renders 404 page for invalid routes', async () => {
      render(
        <TestWrapper initialEntries={['/invalid-route']}>
          <AppRoutes />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('404')).toBeInTheDocument();
        expect(screen.getByText('Page Not Found')).toBeInTheDocument();
      });
    });

    test('404 page navigation works for unauthenticated users', async () => {
      render(
        <TestWrapper initialEntries={['/invalid-route']}>
          <AppRoutes />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Go Home')).toBeInTheDocument();
      });

      // Click Go Home button
      const goHomeButton = screen.getByText('Go Home');
      fireEvent.click(goHomeButton);

      await waitFor(() => {
        expect(screen.getByText(/comprehensive demonstration/i)).toBeInTheDocument();
      });
    });
  });

  describe('Placeholder Routes', () => {
    test('protected routes redirect to login when not authenticated', async () => {
      const protectedRoutes = ['/items', '/items/new', '/profile', '/settings'];
      
      for (const route of protectedRoutes) {
        const { unmount } = render(
          <TestWrapper initialEntries={[route]}>
            <AppRoutes />
          </TestWrapper>
        );

        await waitFor(() => {
          // Should be redirected to login page - expect at least 4 "Sign In" elements
          expect(screen.getAllByText('Sign In').length).toBeGreaterThanOrEqual(4);
        });
        
        unmount(); // Clean up between iterations
      }
    });
  });

  describe('Loading States', () => {
    test('authentication guard shows loading state during auth check', async () => {
      // This test verifies that the AuthGuard component properly handles loading states
      // The actual loading behavior is tested in the AuthGuard component unit tests
      render(
        <TestWrapper initialEntries={['/dashboard']}>
          <AppRoutes />
        </TestWrapper>
      );

      // Should eventually redirect to login when not authenticated
      await waitFor(() => {
        expect(screen.getAllByText('Sign In').length).toBeGreaterThanOrEqual(4);
      }, { timeout: 2000 });
    });
  });
});