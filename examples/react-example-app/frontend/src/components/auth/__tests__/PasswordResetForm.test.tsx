/**
 * Tests for PasswordResetForm component
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { PasswordResetForm } from '../PasswordResetForm';

const theme = createTheme();

const renderWithTheme = (component: React.ReactElement) => {
  return render(
    <ThemeProvider theme={theme}>
      {component}
    </ThemeProvider>
  );
};

// Mock setTimeout to control timing in tests
jest.useFakeTimers();

describe('PasswordResetForm', () => {
  const mockOnBackToLogin = jest.fn();
  const mockOnResetSuccess = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    jest.clearAllTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
    jest.useFakeTimers();
  });

  it('renders password reset form correctly', () => {
    renderWithTheme(
      <PasswordResetForm
        onBackToLogin={mockOnBackToLogin}
        onResetSuccess={mockOnResetSuccess}
      />
    );

    expect(screen.getByText('Reset Password')).toBeInTheDocument();
    expect(screen.getByText("Enter your email address and we'll send you a link to reset your password")).toBeInTheDocument();
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /send reset link/i })).toBeInTheDocument();
    expect(screen.getByText('Remember your password?')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /back to sign in/i })).toBeInTheDocument();
  });

  it('shows progress stepper', () => {
    renderWithTheme(
      <PasswordResetForm
        onBackToLogin={mockOnBackToLogin}
        onResetSuccess={mockOnResetSuccess}
      />
    );

    expect(screen.getByText('Request Reset')).toBeInTheDocument();
    expect(screen.getByText('Check Email')).toBeInTheDocument();
    expect(screen.getByText('Complete')).toBeInTheDocument();
  });

  it('validates required email field', async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    renderWithTheme(
      <PasswordResetForm
        onBackToLogin={mockOnBackToLogin}
        onResetSuccess={mockOnResetSuccess}
      />
    );

    const submitButton = screen.getByRole('button', { name: /send reset link/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Email is required')).toBeInTheDocument();
    });
  });

  it('validates email format', async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    renderWithTheme(
      <PasswordResetForm
        onBackToLogin={mockOnBackToLogin}
        onResetSuccess={mockOnResetSuccess}
      />
    );

    const emailInput = screen.getByLabelText(/email address/i);
    await user.type(emailInput, 'invalid-email');

    await waitFor(() => {
      expect(screen.getByText('Please enter a valid email address')).toBeInTheDocument();
    });
  });

  it('clears validation errors when user starts typing', async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    renderWithTheme(
      <PasswordResetForm
        onBackToLogin={mockOnBackToLogin}
        onResetSuccess={mockOnResetSuccess}
      />
    );

    const emailInput = screen.getByLabelText(/email address/i);
    const submitButton = screen.getByRole('button', { name: /send reset link/i });

    // Trigger validation error
    await user.click(submitButton);
    await waitFor(() => {
      expect(screen.getByText('Email is required')).toBeInTheDocument();
    });

    // Start typing to clear error
    await user.type(emailInput, 'test@example.com');
    await waitFor(() => {
      expect(screen.queryByText('Email is required')).not.toBeInTheDocument();
    });
  });

  it('submits form and shows email sent confirmation', async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    renderWithTheme(
      <PasswordResetForm
        onBackToLogin={mockOnBackToLogin}
        onResetSuccess={mockOnResetSuccess}
      />
    );

    const emailInput = screen.getByLabelText(/email address/i);
    const submitButton = screen.getByRole('button', { name: /send reset link/i });

    await user.type(emailInput, 'test@example.com');
    await user.click(submitButton);

    // Should show loading state
    expect(screen.getByText('Sending...')).toBeInTheDocument();
    expect(submitButton).toBeDisabled();

    // Fast-forward through the simulated API call
    jest.advanceTimersByTime(2000);

    await waitFor(() => {
      expect(screen.getByText('Check Your Email')).toBeInTheDocument();
      expect(screen.getByText("We've sent a password reset link to:")).toBeInTheDocument();
      expect(screen.getByText('test@example.com')).toBeInTheDocument();
    });
  });

  it('shows email sent instructions', async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    renderWithTheme(
      <PasswordResetForm
        onBackToLogin={mockOnBackToLogin}
        onResetSuccess={mockOnResetSuccess}
      />
    );

    const emailInput = screen.getByLabelText(/email address/i);
    const submitButton = screen.getByRole('button', { name: /send reset link/i });

    await user.type(emailInput, 'test@example.com');
    await user.click(submitButton);

    jest.advanceTimersByTime(2000);

    await waitFor(() => {
      expect(screen.getByText('Click the link in the email to reset your password')).toBeInTheDocument();
      expect(screen.getByText('The link will expire in 24 hours')).toBeInTheDocument();
      expect(screen.getByText("Check your spam folder if you don't see the email")).toBeInTheDocument();
    });
  });

  it('provides resend functionality', async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    renderWithTheme(
      <PasswordResetForm
        onBackToLogin={mockOnBackToLogin}
        onResetSuccess={mockOnResetSuccess}
      />
    );

    const emailInput = screen.getByLabelText(/email address/i);
    const submitButton = screen.getByRole('button', { name: /send reset link/i });

    await user.type(emailInput, 'test@example.com');
    await user.click(submitButton);

    jest.advanceTimersByTime(2000);

    await waitFor(() => {
      expect(screen.getByText('Check Your Email')).toBeInTheDocument();
    });

    const resendButton = screen.getByRole('button', { name: /resend email/i });
    await user.click(resendButton);

    jest.advanceTimersByTime(1000);

    await waitFor(() => {
      expect(screen.getByText('Check Your Email')).toBeInTheDocument();
    });
  });

  it('progresses to success state automatically', async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    renderWithTheme(
      <PasswordResetForm
        onBackToLogin={mockOnBackToLogin}
        onResetSuccess={mockOnResetSuccess}
      />
    );

    const emailInput = screen.getByLabelText(/email address/i);
    const submitButton = screen.getByRole('button', { name: /send reset link/i });

    await user.type(emailInput, 'test@example.com');
    await user.click(submitButton);

    // Fast-forward through initial API call
    jest.advanceTimersByTime(2000);

    await waitFor(() => {
      expect(screen.getByText('Check Your Email')).toBeInTheDocument();
    });

    // Fast-forward through auto-advance to success
    jest.advanceTimersByTime(2000);

    await waitFor(() => {
      expect(screen.getByText('Reset Link Sent!')).toBeInTheDocument();
      expect(screen.getByText('Password reset instructions have been sent to your email address.')).toBeInTheDocument();
    });
  });

  it('calls onResetSuccess after showing success message', async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    renderWithTheme(
      <PasswordResetForm
        onBackToLogin={mockOnBackToLogin}
        onResetSuccess={mockOnResetSuccess}
      />
    );

    const emailInput = screen.getByLabelText(/email address/i);
    const submitButton = screen.getByRole('button', { name: /send reset link/i });

    await user.type(emailInput, 'test@example.com');
    await user.click(submitButton);

    // Fast-forward through entire flow
    jest.advanceTimersByTime(2000); // Initial API call
    jest.advanceTimersByTime(2000); // Auto-advance to success
    jest.advanceTimersByTime(3000); // Auto-call onResetSuccess

    await waitFor(() => {
      expect(mockOnResetSuccess).toHaveBeenCalled();
    });
  });

  it('calls onBackToLogin when back button is clicked', async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    renderWithTheme(
      <PasswordResetForm
        onBackToLogin={mockOnBackToLogin}
        onResetSuccess={mockOnResetSuccess}
      />
    );

    const backButton = screen.getByRole('button', { name: /back to sign in/i });
    await user.click(backButton);

    expect(mockOnBackToLogin).toHaveBeenCalled();
  });

  it('calls onBackToLogin from success state', async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    renderWithTheme(
      <PasswordResetForm
        onBackToLogin={mockOnBackToLogin}
        onResetSuccess={mockOnResetSuccess}
      />
    );

    const emailInput = screen.getByLabelText(/email address/i);
    const submitButton = screen.getByRole('button', { name: /send reset link/i });

    await user.type(emailInput, 'test@example.com');
    await user.click(submitButton);

    // Fast-forward to success state
    jest.advanceTimersByTime(4000);

    await waitFor(() => {
      expect(screen.getByText('Reset Link Sent!')).toBeInTheDocument();
    });

    const continueButton = screen.getByRole('button', { name: /continue to sign in/i });
    await user.click(continueButton);

    expect(mockOnBackToLogin).toHaveBeenCalled();
  });

  it('disables form during submission', async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    renderWithTheme(
      <PasswordResetForm
        onBackToLogin={mockOnBackToLogin}
        onResetSuccess={mockOnResetSuccess}
      />
    );

    const emailInput = screen.getByLabelText(/email address/i);
    const submitButton = screen.getByRole('button', { name: /send reset link/i });
    const backButton = screen.getByRole('button', { name: /back to sign in/i });

    await user.type(emailInput, 'test@example.com');
    await user.click(submitButton);

    expect(emailInput).toBeDisabled();
    expect(submitButton).toBeDisabled();
    expect(backButton).toBeDisabled();
  });

  it('handles form submission with Enter key', async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    renderWithTheme(
      <PasswordResetForm
        onBackToLogin={mockOnBackToLogin}
        onResetSuccess={mockOnResetSuccess}
      />
    );

    const emailInput = screen.getByLabelText(/email address/i);
    await user.type(emailInput, 'test@example.com');
    await user.keyboard('{Enter}');

    expect(screen.getByText('Sending...')).toBeInTheDocument();
  });
});