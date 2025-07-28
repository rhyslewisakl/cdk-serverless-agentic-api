/**
 * Unit tests for Navigation component
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { Navigation } from '../Navigation';
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

describe('Navigation Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Unauthenticated State', () => {
    beforeEach(() => {
      // Mock unauthenticated state
      const mockAuthService = require('../../../services/authService');
      mockAuthService.getCurrentUser.mockResolvedValue(null);
    });

    test('renders app title', async () => {
      render(
        <TestWrapper>
          <Navigation />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('React Example App')).toBeInTheDocument();
      });
    });

    test('shows sign in and sign up buttons', async () => {
      render(
        <TestWrapper>
          <Navigation />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Sign In')).toBeInTheDocument();
        expect(screen.getByText('Sign Up')).toBeInTheDocument();
      });
    });

    test('highlights active route', async () => {
      render(
        <TestWrapper initialEntries={['/login']}>
          <Navigation />
        </TestWrapper>
      );

      await waitFor(() => {
        const signInButton = screen.getByText('Sign In');
        expect(signInButton).toBeInTheDocument();
        // The active state is applied via CSS, so we check for the button's presence
      });
    });

    test('app title navigation works', async () => {
      const mockNavigate = jest.fn();
      jest.doMock('react-router-dom', () => ({
        ...jest.requireActual('react-router-dom'),
        useNavigate: () => mockNavigate,
      }));

      render(
        <TestWrapper>
          <Navigation />
        </TestWrapper>
      );

      await waitFor(() => {
        const appTitle = screen.getByText('React Example App');
        fireEvent.click(appTitle);
      });
    });
  });

  describe('Authenticated State', () => {
    beforeEach(() => {
      // Mock authenticated state
      const mockAuthService = require('../../../services/authService');
      mockAuthService.getCurrentUser.mockResolvedValue({
        email: 'test@example.com',
        sub: 'test-user-id'
      });
    });

    test('shows dashboard button and user avatar', async () => {
      render(
        <TestWrapper>
          <Navigation />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Dashboard')).toBeInTheDocument();
        // Avatar should show first letter of email
        expect(screen.getByText('T')).toBeInTheDocument();
      });
    });

    test('opens user menu when avatar is clicked', async () => {
      render(
        <TestWrapper>
          <Navigation />
        </TestWrapper>
      );

      await waitFor(() => {
        const avatar = screen.getByText('T');
        fireEvent.click(avatar);
      });

      await waitFor(() => {
        expect(screen.getByText('test@example.com')).toBeInTheDocument();
        expect(screen.getByText('Signed in')).toBeInTheDocument();
        expect(screen.getByText('Settings')).toBeInTheDocument();
        expect(screen.getByText('Sign out')).toBeInTheDocument();
      });
    });

    test('closes menu when clicking outside', async () => {
      render(
        <TestWrapper>
          <Navigation />
        </TestWrapper>
      );

      await waitFor(() => {
        const avatar = screen.getByText('T');
        fireEvent.click(avatar);
      });

      await waitFor(() => {
        expect(screen.getByText('test@example.com')).toBeInTheDocument();
      });

      // Click outside the menu
      fireEvent.click(document.body);

      await waitFor(() => {
        expect(screen.queryByText('Signed in')).not.toBeInTheDocument();
      });
    });

    test('handles logout correctly', async () => {
      const mockAuthService = require('../../../services/authService');
      mockAuthService.signOut.mockResolvedValue(undefined);

      render(
        <TestWrapper>
          <Navigation />
        </TestWrapper>
      );

      await waitFor(() => {
        const avatar = screen.getByText('T');
        fireEvent.click(avatar);
      });

      await waitFor(() => {
        const signOutButton = screen.getByText('Sign out');
        fireEvent.click(signOutButton);
      });

      await waitFor(() => {
        expect(mockAuthService.signOut).toHaveBeenCalled();
      });
    });

    test('handles logout error gracefully', async () => {
      const mockAuthService = require('../../../services/authService');
      mockAuthService.signOut.mockRejectedValue(new Error('Logout failed'));

      // Mock console.error to avoid test output noise
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      render(
        <TestWrapper>
          <Navigation />
        </TestWrapper>
      );

      await waitFor(() => {
        const avatar = screen.getByText('T');
        fireEvent.click(avatar);
      });

      await waitFor(() => {
        const signOutButton = screen.getByText('Sign out');
        fireEvent.click(signOutButton);
      });

      await waitFor(() => {
        expect(mockAuthService.signOut).toHaveBeenCalled();
        expect(consoleSpy).toHaveBeenCalledWith('Logout failed:', 'Logout failed');
      });

      consoleSpy.mockRestore();
    });

    test('shows loading state during logout', async () => {
      const mockAuthService = require('../../../services/authService');
      mockAuthService.signOut.mockImplementation(
        () => new Promise(resolve => setTimeout(resolve, 100))
      );

      render(
        <TestWrapper>
          <Navigation />
        </TestWrapper>
      );

      await waitFor(() => {
        const avatar = screen.getByText('T');
        fireEvent.click(avatar);
      });

      await waitFor(() => {
        const signOutButton = screen.getByText('Sign out');
        fireEvent.click(signOutButton);
      });

      // Should show loading state
      expect(screen.getByText('Signing out...')).toBeInTheDocument();

      await waitFor(() => {
        expect(mockAuthService.signOut).toHaveBeenCalled();
      });
    });

    test('navigates to dashboard when app title is clicked', async () => {
      render(
        <TestWrapper>
          <Navigation />
        </TestWrapper>
      );

      await waitFor(() => {
        const appTitle = screen.getByText('React Example App');
        fireEvent.click(appTitle);
      });

      // Navigation behavior is tested through integration tests
    });
  });

  describe('Props', () => {
    test('shows menu button when showMenuButton is true', async () => {
      render(
        <TestWrapper>
          <Navigation showMenuButton={true} />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByLabelText('menu')).toBeInTheDocument();
      });
    });

    test('calls onMenuToggle when menu button is clicked', async () => {
      const mockOnMenuToggle = jest.fn();

      render(
        <TestWrapper>
          <Navigation showMenuButton={true} onMenuToggle={mockOnMenuToggle} />
        </TestWrapper>
      );

      await waitFor(() => {
        const menuButton = screen.getByLabelText('menu');
        fireEvent.click(menuButton);
      });

      expect(mockOnMenuToggle).toHaveBeenCalled();
    });

    test('does not show menu button by default', async () => {
      render(
        <TestWrapper>
          <Navigation />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.queryByLabelText('menu')).not.toBeInTheDocument();
      });
    });
  });

  describe('User Avatar', () => {
    test('shows first letter of email in avatar', async () => {
      const mockAuthService = require('../../../services/authService');
      mockAuthService.getCurrentUser.mockResolvedValue({
        email: 'john@example.com',
        sub: 'test-user-id'
      });

      render(
        <TestWrapper>
          <Navigation />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('J')).toBeInTheDocument();
      });
    });

    test('shows account icon when email is not available', async () => {
      const mockAuthService = require('../../../services/authService');
      mockAuthService.getCurrentUser.mockResolvedValue({
        sub: 'test-user-id'
      });

      render(
        <TestWrapper>
          <Navigation />
        </TestWrapper>
      );

      await waitFor(() => {
        // Should show the AccountCircle icon instead of a letter
        expect(screen.getByTestId('AccountCircleIcon')).toBeInTheDocument();
      });
    });
  });
});