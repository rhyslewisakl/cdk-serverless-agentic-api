/**
 * Tests for RegisterForm component
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { RegisterForm } from '../RegisterForm';
import { AuthProvider } from '../../../contexts/AuthContext';
import { authService } from '../../../services/authService';

// Mock the auth service
jest.mock('../../../services/authService', () => ({
  authService: {
    register: jest.fn(),
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

describe('RegisterForm', () => {
  const mockOnSwitchToLogin = jest.fn();
  const mockOnRegistrationSuccess = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (authService.getCurrentUser as jest.Mock).mockResolvedValue(null);
  });

  it('renders registration form with all required fields', () => {
    renderWithProviders(
      <RegisterForm
        onSwitchToLogin={mockOnSwitchToLogin}
        onRegistrationSuccess={mockOnRegistrationSuccess}
      />
    );

    expect(screen.getByRole('heading', { name: /sign up/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /create account/i })).toBeInTheDocument();
    expect(screen.getByText(/already have an account/i)).toBeInTheDocument();
  });

  it('shows validation errors for empty fields', async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <RegisterForm
        onSwitchToLogin={mockOnSwitchToLogin}
        onRegistrationSuccess={mockOnRegistrationSuccess}
      />
    );

    const submitButton = screen.getByRole('button', { name: /create account/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/email is required/i)).toBeInTheDocument();
      expect(screen.getByText(/password is required/i)).toBeInTheDocument();
      expect(screen.getByText(/confirm password is required/i)).toBeInTheDocument();
    });
  });

  it('shows validation error for invalid email format', async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <RegisterForm
        onSwitchToLogin={mockOnSwitchToLogin}
        onRegistrationSuccess={mockOnRegistrationSuccess}
      />
    );

    const emailInput = screen.getByLabelText(/email address/i);
    await user.type(emailInput, 'invalid-email');

    const submitButton = screen.getByRole('button', { name: /create account/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/please enter a valid email address/i)).toBeInTheDocument();
    });
  });

  it('shows validation error for short password', async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <RegisterForm
        onSwitchToLogin={mockOnSwitchToLogin}
        onRegistrationSuccess={mockOnRegistrationSuccess}
      />
    );

    const passwordInput = screen.getByLabelText(/^password$/i);
    await user.type(passwordInput, '123');

    const submitButton = screen.getByRole('button', { name: /create account/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/password must be at least 8 characters long/i)).toBeInTheDocument();
    });
  });

  it('shows validation error when passwords do not match', async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <RegisterForm
        onSwitchToLogin={mockOnSwitchToLogin}
        onRegistrationSuccess={mockOnRegistrationSuccess}
      />
    );

    const passwordInput = screen.getByLabelText(/^password$/i);
    const confirmPasswordInput = screen.getByLabelText(/confirm password/i);

    await user.type(passwordInput, 'password123');
    await user.type(confirmPasswordInput, 'differentpassword');

    const submitButton = screen.getByRole('button', { name: /create account/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/passwords do not match/i)).toBeInTheDocument();
    });
  });

  it('displays password strength indicator', async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <RegisterForm
        onSwitchToLogin={mockOnSwitchToLogin}
        onRegistrationSuccess={mockOnRegistrationSuccess}
      />
    );

    const passwordInput = screen.getByLabelText(/^password$/i);

    // Type a weak password
    await user.type(passwordInput, 'weak');
    await waitFor(() => {
      expect(screen.getByText(/password strength:/i)).toBeInTheDocument();
      expect(screen.getByText(/weak/i)).toBeInTheDocument();
    });

    // Clear and type a stronger password
    await user.clear(passwordInput);
    await user.type(passwordInput, 'StrongPassword123!');
    await waitFor(() => {
      expect(screen.getByText(/strong/i)).toBeInTheDocument();
    });
  });

  it('shows password strength feedback', async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <RegisterForm
        onSwitchToLogin={mockOnSwitchToLogin}
        onRegistrationSuccess={mockOnRegistrationSuccess}
      />
    );

    const passwordInput = screen.getByLabelText(/^password$/i);
    await user.type(passwordInput, 'weak');

    await waitFor(() => {
      expect(screen.getByText(/password should contain uppercase letters/i)).toBeInTheDocument();
      expect(screen.getByText(/password should contain numbers/i)).toBeInTheDocument();
      expect(screen.getByText(/password should contain special characters/i)).toBeInTheDocument();
    });
  });

  it('toggles password visibility for both password fields', async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <RegisterForm
        onSwitchToLogin={mockOnSwitchToLogin}
        onRegistrationSuccess={mockOnRegistrationSuccess}
      />
    );

    const passwordInput = screen.getByLabelText(/^password$/i);
    const confirmPasswordInput = screen.getByLabelText(/confirm password/i);
    const passwordToggleButtons = screen.getAllByLabelText(/toggle.*password visibility/i);

    // Initially both passwords should be hidden
    expect(passwordInput).toHaveAttribute('type', 'password');
    expect(confirmPasswordInput).toHaveAttribute('type', 'password');

    // Click to show password
    await user.click(passwordToggleButtons[0]);
    expect(passwordInput).toHaveAttribute('type', 'text');

    // Click to show confirm password
    await user.click(passwordToggleButtons[1]);
    expect(confirmPasswordInput).toHaveAttribute('type', 'text');
  });

  it('shows visual feedback for password match', async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <RegisterForm
        onSwitchToLogin={mockOnSwitchToLogin}
        onRegistrationSuccess={mockOnRegistrationSuccess}
      />
    );

    const passwordInput = screen.getByLabelText(/^password$/i);
    const confirmPasswordInput = screen.getByLabelText(/confirm password/i);

    await user.type(passwordInput, 'password123');
    await user.type(confirmPasswordInput, 'password123');

    // Should show check icon for matching passwords
    await waitFor(() => {
      const checkIcon = screen.getByTestId('CheckCircleIcon');
      expect(checkIcon).toBeInTheDocument();
    });

    // Change confirm password to not match
    await user.clear(confirmPasswordInput);
    await user.type(confirmPasswordInput, 'different');

    // Should show cancel icon for non-matching passwords
    await waitFor(() => {
      const cancelIcon = screen.getByTestId('CancelIcon');
      expect(cancelIcon).toBeInTheDocument();
    });
  });

  it('calls register function with correct credentials on form submission', async () => {
    const user = userEvent.setup();
    const mockUser = { userId: '123', email: 'test@example.com', emailVerified: true };
    (authService.register as jest.Mock).mockResolvedValue(mockUser);

    renderWithProviders(
      <RegisterForm
        onSwitchToLogin={mockOnSwitchToLogin}
        onRegistrationSuccess={mockOnRegistrationSuccess}
      />
    );

    const emailInput = screen.getByLabelText(/email address/i);
    const passwordInput = screen.getByLabelText(/^password$/i);
    const confirmPasswordInput = screen.getByLabelText(/confirm password/i);
    const submitButton = screen.getByRole('button', { name: /create account/i });

    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'password123');
    await user.type(confirmPasswordInput, 'password123');
    await user.click(submitButton);

    await waitFor(() => {
      expect(authService.register).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
        confirmPassword: 'password123',
      });
    });
  });

  it('shows loading state during registration', async () => {
    const user = userEvent.setup();
    let resolveRegister: (value: any) => void;
    const registerPromise = new Promise((resolve) => {
      resolveRegister = resolve;
    });
    (authService.register as jest.Mock).mockReturnValue(registerPromise);

    renderWithProviders(
      <RegisterForm
        onSwitchToLogin={mockOnSwitchToLogin}
        onRegistrationSuccess={mockOnRegistrationSuccess}
      />
    );

    const emailInput = screen.getByLabelText(/email address/i);
    const passwordInput = screen.getByLabelText(/^password$/i);
    const confirmPasswordInput = screen.getByLabelText(/confirm password/i);
    const submitButton = screen.getByRole('button', { name: /create account/i });

    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'password123');
    await user.type(confirmPasswordInput, 'password123');
    await user.click(submitButton);

    // Should show loading spinner
    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
    expect(submitButton).toBeDisabled();

    // Resolve the registration
    resolveRegister({ userId: '123', email: 'test@example.com', emailVerified: true });

    await waitFor(() => {
      expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
    });
  });

  it('displays error message on registration failure', async () => {
    const user = userEvent.setup();
    const errorMessage = 'An account with this email already exists';
    (authService.register as jest.Mock).mockRejectedValue(new Error(errorMessage));

    renderWithProviders(
      <RegisterForm
        onSwitchToLogin={mockOnSwitchToLogin}
        onRegistrationSuccess={mockOnRegistrationSuccess}
      />
    );

    const emailInput = screen.getByLabelText(/email address/i);
    const passwordInput = screen.getByLabelText(/^password$/i);
    const confirmPasswordInput = screen.getByLabelText(/confirm password/i);
    const submitButton = screen.getByRole('button', { name: /create account/i });

    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'password123');
    await user.type(confirmPasswordInput, 'password123');
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });
  });

  it('calls onRegistrationSuccess callback on successful registration', async () => {
    const user = userEvent.setup();
    const mockUser = { userId: '123', email: 'test@example.com', emailVerified: true };
    (authService.register as jest.Mock).mockResolvedValue(mockUser);

    renderWithProviders(
      <RegisterForm
        onSwitchToLogin={mockOnSwitchToLogin}
        onRegistrationSuccess={mockOnRegistrationSuccess}
      />
    );

    const emailInput = screen.getByLabelText(/email address/i);
    const passwordInput = screen.getByLabelText(/^password$/i);
    const confirmPasswordInput = screen.getByLabelText(/confirm password/i);
    const submitButton = screen.getByRole('button', { name: /create account/i });

    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'password123');
    await user.type(confirmPasswordInput, 'password123');
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockOnRegistrationSuccess).toHaveBeenCalled();
    });
  });

  it('calls onSwitchToLogin when login link is clicked', async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <RegisterForm
        onSwitchToLogin={mockOnSwitchToLogin}
        onRegistrationSuccess={mockOnRegistrationSuccess}
      />
    );

    const loginLink = screen.getByText(/sign in here/i);
    await user.click(loginLink);

    expect(mockOnSwitchToLogin).toHaveBeenCalled();
  });

  it('clears field errors when user starts typing', async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <RegisterForm
        onSwitchToLogin={mockOnSwitchToLogin}
        onRegistrationSuccess={mockOnRegistrationSuccess}
      />
    );

    // Trigger validation errors
    const submitButton = screen.getByRole('button', { name: /create account/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/email is required/i)).toBeInTheDocument();
    });

    // Start typing in email field
    const emailInput = screen.getByLabelText(/email address/i);
    await user.type(emailInput, 'test@example.com');

    await waitFor(() => {
      expect(screen.queryByText(/email is required/i)).not.toBeInTheDocument();
    });
  });

  it('disables form during loading state', async () => {
    const user = userEvent.setup();
    let resolveRegister: (value: any) => void;
    const registerPromise = new Promise((resolve) => {
      resolveRegister = resolve;
    });
    (authService.register as jest.Mock).mockReturnValue(registerPromise);

    renderWithProviders(
      <RegisterForm
        onSwitchToLogin={mockOnSwitchToLogin}
        onRegistrationSuccess={mockOnRegistrationSuccess}
      />
    );

    const emailInput = screen.getByLabelText(/email address/i);
    const passwordInput = screen.getByLabelText(/^password$/i);
    const confirmPasswordInput = screen.getByLabelText(/confirm password/i);
    const submitButton = screen.getByRole('button', { name: /create account/i });
    const loginLink = screen.getByText(/sign in here/i);

    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'password123');
    await user.type(confirmPasswordInput, 'password123');
    await user.click(submitButton);

    // All interactive elements should be disabled
    expect(emailInput).toBeDisabled();
    expect(passwordInput).toBeDisabled();
    expect(confirmPasswordInput).toBeDisabled();
    expect(submitButton).toBeDisabled();
    expect(loginLink).toHaveAttribute('disabled');

    // Resolve the registration
    resolveRegister({ userId: '123', email: 'test@example.com', emailVerified: true });

    await waitFor(() => {
      expect(emailInput).not.toBeDisabled();
      expect(passwordInput).not.toBeDisabled();
      expect(confirmPasswordInput).not.toBeDisabled();
      expect(submitButton).not.toBeDisabled();
    });
  });
});