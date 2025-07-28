/**
 * Tests for LoginForm component
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { LoginForm } from '../LoginForm';
import { AuthProvider } from '../../../contexts/AuthContext';
import { authService } from '../../../services/authService';

// Mock the auth service
jest.mock('../../../services/authService', () => ({
  authService: {
    login: jest.fn(),
    getCurrentUser: jest.fn(),
    initialize: jest.fn(),
  },
}));

// Mock the API service
jest.mock('../../../services/apiService', () => ({
  apiService: {
    getConfig: jest.fn().mockResolvedValue({
      userPoolId: 'test-pool-id',
      userPoolWebClientId: 'test-client-id',
    }),
  },
}));

const theme = createTheme();

const renderWithProviders = (component: React.ReactElement) => {
  return render(
    <ThemeProvider theme={theme}>
      <AuthProvider>
        {component}
      </AuthProvider>
    </ThemeProvider>
  );
};

describe('LoginForm', () => {
  const mockOnSwitchToRegister = jest.fn();
  const mockOnLoginSuccess = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (authService.getCurrentUser as jest.Mock).mockResolvedValue(null);
  });

  it('renders login form with all required fields', () => {
    renderWithProviders(
      <LoginForm
        onSwitchToRegister={mockOnSwitchToRegister}
        onLoginSuccess={mockOnLoginSuccess}
      />
    );

    expect(screen.getByRole('heading', { name: /sign in/i })).toBeInTheDocument();
    expect(screen.getByTestId('email-input')).toBeInTheDocument();
    expect(screen.getByTestId('password-input')).toBeInTheDocument();
    expect(screen.getByTestId('submit-button')).toBeInTheDocument();
    expect(screen.getByText(/don't have an account/i)).toBeInTheDocument();
  });

  it('shows validation errors for empty fields', async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <LoginForm
        onSwitchToRegister={mockOnSwitchToRegister}
        onLoginSuccess={mockOnLoginSuccess}
      />
    );

    const submitButton = screen.getByTestId('submit-button');
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/email is required/i)).toBeInTheDocument();
      expect(screen.getByText(/password is required/i)).toBeInTheDocument();
    });
  });

  it('shows validation error for invalid email format', async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <LoginForm
        onSwitchToRegister={mockOnSwitchToRegister}
        onLoginSuccess={mockOnLoginSuccess}
      />
    );

    const emailInput = screen.getByTestId('email-input');
    await user.type(emailInput, 'invalid-email');

    const submitButton = screen.getByTestId('submit-button');
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/please enter a valid email address/i)).toBeInTheDocument();
    });
  });

  it('clears field errors when user starts typing', async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <LoginForm
        onSwitchToRegister={mockOnSwitchToRegister}
        onLoginSuccess={mockOnLoginSuccess}
      />
    );

    // Trigger validation errors
    const submitButton = screen.getByTestId('submit-button');
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/email is required/i)).toBeInTheDocument();
    });

    // Start typing in email field
    const emailInput = screen.getByTestId('email-input');
    await user.type(emailInput, 'test@example.com');

    await waitFor(() => {
      expect(screen.queryByText(/email is required/i)).not.toBeInTheDocument();
    });
  });

  it('toggles password visibility', async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <LoginForm
        onSwitchToRegister={mockOnSwitchToRegister}
        onLoginSuccess={mockOnLoginSuccess}
      />
    );

    const passwordInput = screen.getByTestId('password-input').querySelector('input');
    const toggleButton = screen.getByLabelText(/toggle password visibility/i);

    // Initially password should be hidden
    expect(passwordInput).toHaveAttribute('type', 'password');

    // Click to show password
    await user.click(toggleButton);
    expect(passwordInput).toHaveAttribute('type', 'text');

    // Click to hide password again
    await user.click(toggleButton);
    expect(passwordInput).toHaveAttribute('type', 'password');
  });

  it('calls login function with correct credentials on form submission', async () => {
    const user = userEvent.setup();
    const mockUser = { userId: '123', email: 'test@example.com', emailVerified: true };
    (authService.login as jest.Mock).mockResolvedValue(mockUser);

    renderWithProviders(
      <LoginForm
        onSwitchToRegister={mockOnSwitchToRegister}
        onLoginSuccess={mockOnLoginSuccess}
      />
    );

    const emailInput = screen.getByTestId('email-input');
    const passwordInput = screen.getByTestId('password-input');
    const submitButton = screen.getByTestId('submit-button');

    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'password123');
    await user.click(submitButton);

    await waitFor(() => {
      expect(authService.login).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
      });
    });
  });

  it('shows loading state during login', async () => {
    const user = userEvent.setup();
    let resolveLogin: (value: any) => void;
    const loginPromise = new Promise((resolve) => {
      resolveLogin = resolve;
    });
    (authService.login as jest.Mock).mockReturnValue(loginPromise);

    renderWithProviders(
      <LoginForm
        onSwitchToRegister={mockOnSwitchToRegister}
        onLoginSuccess={mockOnLoginSuccess}
      />
    );

    const emailInput = screen.getByTestId('email-input');
    const passwordInput = screen.getByTestId('password-input');
    const submitButton = screen.getByTestId('submit-button');

    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'password123');
    await user.click(submitButton);

    // Should show loading spinner
    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
    expect(submitButton).toBeDisabled();

    // Resolve the login
    resolveLogin({ userId: '123', email: 'test@example.com', emailVerified: true });

    await waitFor(() => {
      expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
    });
  });

  it('displays error message on login failure', async () => {
    const user = userEvent.setup();
    const errorMessage = 'Invalid email or password';
    (authService.login as jest.Mock).mockRejectedValue(new Error(errorMessage));

    renderWithProviders(
      <LoginForm
        onSwitchToRegister={mockOnSwitchToRegister}
        onLoginSuccess={mockOnLoginSuccess}
      />
    );

    const emailInput = screen.getByTestId('email-input');
    const passwordInput = screen.getByTestId('password-input');
    const submitButton = screen.getByTestId('submit-button');

    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'wrongpassword');
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });
  });

  it('calls onLoginSuccess callback on successful login', async () => {
    const user = userEvent.setup();
    const mockUser = { userId: '123', email: 'test@example.com', emailVerified: true };
    (authService.login as jest.Mock).mockResolvedValue(mockUser);

    renderWithProviders(
      <LoginForm
        onSwitchToRegister={mockOnSwitchToRegister}
        onLoginSuccess={mockOnLoginSuccess}
      />
    );

    const emailInput = screen.getByTestId('email-input');
    const passwordInput = screen.getByTestId('password-input');
    const submitButton = screen.getByTestId('submit-button');

    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'password123');
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockOnLoginSuccess).toHaveBeenCalled();
    });
  });

  it('calls onSwitchToRegister when register link is clicked', async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <LoginForm
        onSwitchToRegister={mockOnSwitchToRegister}
        onLoginSuccess={mockOnLoginSuccess}
      />
    );

    const registerLink = screen.getByText(/sign up here/i);
    await user.click(registerLink);

    expect(mockOnSwitchToRegister).toHaveBeenCalled();
  });
});