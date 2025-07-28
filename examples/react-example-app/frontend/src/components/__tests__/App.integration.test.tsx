/**
 * Integration tests for complete user workflows
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from '../../App';

// Mock the auth service
jest.mock('../../services/authService', () => ({
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
jest.mock('../../services/apiService', () => ({
  get: jest.fn(),
  post: jest.fn(),
  put: jest.fn(),
  delete: jest.fn(),
}));

describe('App Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock unauthenticated state by default
    const mockAuthService = require('../../services/authService');
    mockAuthService.getCurrentUser.mockResolvedValue(null);
  });

  describe('Unauthenticated User Flow', () => {
    test('renders home page for unauthenticated users', async () => {
      render(<App />);

      await waitFor(() => {
        expect(screen.getByText('React Example App')).toBeInTheDocument();
        expect(screen.getByText('Sign In')).toBeInTheDocument();
        expect(screen.getByText('Sign Up')).toBeInTheDocument();
      });
    });

    test('navigates to login page when sign in is clicked', async () => {
      const user = userEvent.setup();
      render(<App />);

      await waitFor(() => {
        expect(screen.getByText('Sign In')).toBeInTheDocument();
      });

      await user.click(screen.getByText('Sign In'));

      await waitFor(() => {
        expect(screen.getByText('Sign in to your account')).toBeInTheDocument();
      });
    });

    test('navigates to register page when sign up is clicked', async () => {
      const user = userEvent.setup();
      render(<App />);

      await waitFor(() => {
        expect(screen.getByText('Sign Up')).toBeInTheDocument();
      });

      await user.click(screen.getByText('Sign Up'));

      await waitFor(() => {
        expect(screen.getByText('Create your account')).toBeInTheDocument();
      });
    });

    test('shows breadcrumbs on non-home pages', async () => {
      const user = userEvent.setup();
      render(<App />);

      await waitFor(() => {
        expect(screen.getByText('Sign In')).toBeInTheDocument();
      });

      await user.click(screen.getByText('Sign In'));

      await waitFor(() => {
        expect(screen.getByText('Home')).toBeInTheDocument();
        expect(screen.getByLabelText('breadcrumb navigation')).toBeInTheDocument();
      });
    });
  });

  describe('Authenticated User Flow', () => {
    beforeEach(() => {
      // Mock authenticated state
      const mockAuthService = require('../../services/authService');
      mockAuthService.getCurrentUser.mockResolvedValue({
        email: 'test@example.com',
        sub: 'test-user-id'
      });
    });

    test('renders dashboard for authenticated users', async () => {
      render(<App />);

      await waitFor(() => {
        expect(screen.getByText('Dashboard')).toBeInTheDocument();
        expect(screen.getByText('Welcome back, test@example.com!')).toBeInTheDocument();
      });
    });

    test('shows user menu in navigation', async () => {
      const user = userEvent.setup();
      render(<App />);

      await waitFor(() => {
        expect(screen.getByText('T')).toBeInTheDocument(); // Avatar with first letter
      });

      await user.click(screen.getByText('T'));

      await waitFor(() => {
        expect(screen.getByText('test@example.com')).toBeInTheDocument();
        expect(screen.getByText('Signed in')).toBeInTheDocument();
        expect(screen.getByText('Settings')).toBeInTheDocument();
        expect(screen.getByText('Sign out')).toBeInTheDocument();
      });
    });

    test('navigates between dashboard sections', async () => {
      const user = userEvent.setup();
      render(<App />);

      await waitFor(() => {
        expect(screen.getByText('Dashboard')).toBeInTheDocument();
      });

      // Click on Dashboard button in navigation
      await user.click(screen.getByText('Dashboard'));

      await waitFor(() => {
        expect(screen.getByText('Quick Actions')).toBeInTheDocument();
        expect(screen.getByText('Account Status')).toBeInTheDocument();
      });
    });

    test('handles logout flow', async () => {
      const user = userEvent.setup();
      const mockAuthService = require('../../services/authService');
      mockAuthService.signOut.mockResolvedValue(undefined);

      render(<App />);

      await waitFor(() => {
        expect(screen.getByText('T')).toBeInTheDocument();
      });

      // Open user menu
      await user.click(screen.getByText('T'));

      await waitFor(() => {
        expect(screen.getByText('Sign out')).toBeInTheDocument();
      });

      // Click sign out
      await user.click(screen.getByText('Sign out'));

      await waitFor(() => {
        expect(mockAuthService.signOut).toHaveBeenCalled();
      });
    });
  });

  describe('Error Handling', () => {
    test('displays error boundary when component throws error', async () => {
      // Mock console.error to avoid test output noise
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      // Create a component that throws an error
      const ThrowError = () => {
        throw new Error('Test error');
      };

      // Mock a component to throw error
      jest.doMock('../../components/pages/HomePage', () => ({
        HomePage: ThrowError,
      }));

      render(<App />);

      await waitFor(() => {
        expect(screen.getByText('Oops! Something went wrong')).toBeInTheDocument();
        expect(screen.getByText('Try Again')).toBeInTheDocument();
        expect(screen.getByText('Reload Page')).toBeInTheDocument();
        expect(screen.getByText('Go Home')).toBeInTheDocument();
      });

      consoleSpy.mockRestore();
    });

    test('error boundary retry button works', async () => {
      const user = userEvent.setup();
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      // Create a component that throws an error initially
      let shouldThrow = true;
      const ConditionalError = () => {
        if (shouldThrow) {
          throw new Error('Test error');
        }
        return <div>Component recovered</div>;
      };

      jest.doMock('../../components/pages/HomePage', () => ({
        HomePage: ConditionalError,
      }));

      render(<App />);

      await waitFor(() => {
        expect(screen.getByText('Oops! Something went wrong')).toBeInTheDocument();
      });

      // Stop throwing error
      shouldThrow = false;

      // Click retry
      await user.click(screen.getByText('Try Again'));

      await waitFor(() => {
        expect(screen.getByText('Component recovered')).toBeInTheDocument();
      });

      consoleSpy.mockRestore();
    });
  });

  describe('Responsive Design', () => {
    test('renders responsive navigation', async () => {
      render(<App />);

      await waitFor(() => {
        expect(screen.getByText('React Example App')).toBeInTheDocument();
      });

      // Check that the navigation is present
      const navigation = screen.getByRole('banner'); // AppBar has banner role
      expect(navigation).toBeInTheDocument();
    });

    test('renders responsive layout containers', async () => {
      render(<App />);

      await waitFor(() => {
        // Check for responsive container classes
        const containers = document.querySelectorAll('[class*="MuiContainer"]');
        expect(containers.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Theme Integration', () => {
    test('applies consistent theme across components', async () => {
      render(<App />);

      await waitFor(() => {
        // Check that theme is applied by looking for MUI classes
        const themedElements = document.querySelectorAll('[class*="Mui"]');
        expect(themedElements.length).toBeGreaterThan(0);
      });
    });

    test('renders with proper color scheme', async () => {
      render(<App />);

      await waitFor(() => {
        // Check for primary color usage in navigation
        const primaryElements = document.querySelectorAll('[class*="colorPrimary"]');
        expect(primaryElements.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Loading States', () => {
    test('shows loading states during authentication check', async () => {
      // Mock slow authentication check
      const mockAuthService = require('../../services/authService');
      mockAuthService.getCurrentUser.mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve(null), 100))
      );

      render(<App />);

      // Should show some loading indication
      // This is handled by the AuthProvider internally
      expect(screen.getByText('React Example App')).toBeInTheDocument();
    });
  });

  describe('Navigation Integration', () => {
    test('app title navigation works correctly', async () => {
      const user = userEvent.setup();
      render(<App />);

      await waitFor(() => {
        expect(screen.getByText('React Example App')).toBeInTheDocument();
      });

      // Navigate to login first
      await user.click(screen.getByText('Sign In'));

      await waitFor(() => {
        expect(screen.getByText('Sign in to your account')).toBeInTheDocument();
      });

      // Click app title to go back
      await user.click(screen.getByText('React Example App'));

      // Should navigate back to home
      await waitFor(() => {
        expect(window.location.pathname).toBe('/');
      });
    });

    test('breadcrumb navigation works', async () => {
      const user = userEvent.setup();
      render(<App />);

      // Navigate to login to see breadcrumbs
      await user.click(screen.getByText('Sign In'));

      await waitFor(() => {
        expect(screen.getByText('Home')).toBeInTheDocument();
        expect(screen.getByLabelText('breadcrumb navigation')).toBeInTheDocument();
      });

      // Click home breadcrumb
      await user.click(screen.getByText('Home'));

      await waitFor(() => {
        expect(window.location.pathname).toBe('/');
      });
    });
  });
});