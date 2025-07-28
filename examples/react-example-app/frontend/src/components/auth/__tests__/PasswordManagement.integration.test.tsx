/**
 * Integration tests for password management components
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { AuthProvider } from '../../../contexts/AuthContext';
import { PasswordChangeForm } from '../PasswordChangeForm';
import { ForcedPasswordChangeForm } from '../ForcedPasswordChangeForm';
import { PasswordResetForm } from '../PasswordResetForm';
import { authService } from '../../../services/authService';

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
jest.mock('../../../services/apiService', () => ({
  apiService: {
    getConfig: jest.fn().mockResolvedValue({
      region: 'us-east-1',
      userPoolId: 'us-east-1_test',
      userPoolWebClientId: 'test-client-id',
      apiEndpoint: 'https://api.example.com',
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

describe('Password Management Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock Amplify auth methods
    const { getCurrentUser, updatePassword } = require('aws-amplify/auth');
    getCurrentUser.mockResolvedValue({
      userId: '123',
      signInDetails: { loginId: 'test@example.com' },
    });
    updatePassword.mockResolvedValue(undefined);
  });

  describe('Password Change Flow', () => {
    it('completes voluntary password change successfully', async () => {
      const user = userEvent.setup();
      const mockOnSuccess = jest.fn();

      renderWithProviders(
        <PasswordChangeForm
          onPasswordChangeSuccess={mockOnSuccess}
        />
      );

      // Fill out the form
      await user.type(screen.getByLabelText(/current password/i), 'oldpassword123');
      await user.type(screen.getByLabelText(/new password/i), 'NewPassword123!');
      await user.type(screen.getByLabelText(/confirm new password/i), 'NewPassword123!');

      // Submit the form
      await user.click(screen.getByRole('button', { name: /change password/i }));

      // Verify the service was called correctly
      await waitFor(() => {
        const { updatePassword } = require('aws-amplify/auth');
        expect(updatePassword).toHaveBeenCalledWith({
          oldPassword: 'oldpassword123',
          newPassword: 'NewPassword123!',
        });
      });

      // Verify success message and callback
      await waitFor(() => {
        expect(screen.getByText('Password changed successfully!')).toBeInTheDocument();
      });
    });

    it('handles password change errors gracefully', async () => {
      const user = userEvent.setup();
      const { updatePassword } = require('aws-amplify/auth');
      updatePassword.mockRejectedValueOnce(new Error('Current password is incorrect'));

      renderWithProviders(
        <PasswordChangeForm />
      );

      // Fill out the form with incorrect current password
      await user.type(screen.getByLabelText(/current password/i), 'wrongpassword');
      await user.type(screen.getByLabelText(/new password/i), 'NewPassword123!');
      await user.type(screen.getByLabelText(/confirm new password/i), 'NewPassword123!');

      // Submit the form
      await user.click(screen.getByRole('button', { name: /change password/i }));

      // Verify error is displayed
      await waitFor(() => {
        expect(screen.getByText('Current password is incorrect')).toBeInTheDocument();
      });
    });
  });

  describe('Forced Password Change Flow', () => {
    it('enforces strong password requirements', async () => {
      const user = userEvent.setup();
      const mockOnSuccess = jest.fn();

      renderWithProviders(
        <ForcedPasswordChangeForm
          onPasswordChangeSuccess={mockOnSuccess}
          reason="temporary"
          userEmail="temp@example.com"
        />
      );

      // Try with weak password
      await user.type(screen.getByLabelText(/current password/i), 'temppass');
      await user.type(screen.getByLabelText(/new password/i), 'weak');
      await user.type(screen.getByLabelText(/confirm new password/i), 'weak');

      // Submit button should be disabled
      expect(screen.getByRole('button', { name: /update password/i })).toBeDisabled();

      // Clear and enter strong password
      await user.clear(screen.getByLabelText(/new password/i));
      await user.clear(screen.getByLabelText(/confirm new password/i));
      await user.type(screen.getByLabelText(/new password/i), 'StrongPassword123!');
      await user.type(screen.getByLabelText(/confirm new password/i), 'StrongPassword123!');

      // Submit button should now be enabled
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /update password/i })).not.toBeDisabled();
      });

      // Submit the form
      await user.click(screen.getByRole('button', { name: /update password/i }));

      // Verify the service was called
      await waitFor(() => {
        const { updatePassword } = require('aws-amplify/auth');
        expect(updatePassword).toHaveBeenCalledWith({
          oldPassword: 'temppass',
          newPassword: 'StrongPassword123!',
        });
      });

      // Verify success callback
      await waitFor(() => {
        expect(mockOnSuccess).toHaveBeenCalled();
      });
    });

    it('displays appropriate messaging for different reasons', () => {
      const { rerender } = renderWithProviders(
        <ForcedPasswordChangeForm
          onPasswordChangeSuccess={jest.fn()}
          reason="expired"
        />
      );

      expect(screen.getByText('Password Expired')).toBeInTheDocument();

      rerender(
        <ThemeProvider theme={theme}>
          <AuthProvider>
            <ForcedPasswordChangeForm
              onPasswordChangeSuccess={jest.fn()}
              reason="security"
            />
          </AuthProvider>
        </ThemeProvider>
      );

      expect(screen.getByText('Security Update Required')).toBeInTheDocument();
    });
  });

  describe('Password Reset Flow', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.runOnlyPendingTimers();
      jest.useRealTimers();
    });

    it('completes password reset request flow', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      const mockOnSuccess = jest.fn();

      renderWithProviders(
        <PasswordResetForm
          onBackToLogin={jest.fn()}
          onResetSuccess={mockOnSuccess}
        />
      );

      // Enter email and submit
      await user.type(screen.getByLabelText(/email address/i), 'test@example.com');
      await user.click(screen.getByRole('button', { name: /send reset link/i }));

      // Fast-forward through the flow
      jest.advanceTimersByTime(2000); // Initial request
      
      await waitFor(() => {
        expect(screen.getByText('Check Your Email')).toBeInTheDocument();
        expect(screen.getByText('test@example.com')).toBeInTheDocument();
      });

      // Continue to success state
      jest.advanceTimersByTime(2000);
      
      await waitFor(() => {
        expect(screen.getByText('Reset Link Sent!')).toBeInTheDocument();
      });

      // Auto-call success callback
      jest.advanceTimersByTime(3000);
      
      await waitFor(() => {
        expect(mockOnSuccess).toHaveBeenCalled();
      });
    });

    it('provides resend functionality', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });

      renderWithProviders(
        <PasswordResetForm
          onBackToLogin={jest.fn()}
          onResetSuccess={jest.fn()}
        />
      );

      // Complete initial request
      await user.type(screen.getByLabelText(/email address/i), 'test@example.com');
      await user.click(screen.getByRole('button', { name: /send reset link/i }));
      jest.advanceTimersByTime(2000);

      await waitFor(() => {
        expect(screen.getByText('Check Your Email')).toBeInTheDocument();
      });

      // Test resend functionality
      const resendButton = screen.getByRole('button', { name: /resend email/i });
      await user.click(resendButton);
      jest.advanceTimersByTime(1000);

      await waitFor(() => {
        expect(screen.getByText('Check Your Email')).toBeInTheDocument();
      });
    });
  });

  describe('Form Validation Integration', () => {
    it('provides consistent validation across all forms', async () => {
      const user = userEvent.setup();

      // Test PasswordChangeForm validation
      const { rerender } = renderWithProviders(
        <PasswordChangeForm />
      );

      await user.click(screen.getByRole('button', { name: /change password/i }));
      
      await waitFor(() => {
        expect(screen.getByText('Current Password is required')).toBeInTheDocument();
        expect(screen.getByText('New Password is required')).toBeInTheDocument();
      });

      // Test ForcedPasswordChangeForm validation
      rerender(
        <ThemeProvider theme={theme}>
          <AuthProvider>
            <ForcedPasswordChangeForm
              onPasswordChangeSuccess={jest.fn()}
              reason="temporary"
            />
          </AuthProvider>
        </ThemeProvider>
      );

      // Button should be disabled for empty form
      expect(screen.getByRole('button', { name: /update password/i })).toBeDisabled();

      // Test PasswordResetForm validation
      rerender(
        <ThemeProvider theme={theme}>
          <AuthProvider>
            <PasswordResetForm
              onBackToLogin={jest.fn()}
              onResetSuccess={jest.fn()}
            />
          </AuthProvider>
        </ThemeProvider>
      );

      await user.click(screen.getByRole('button', { name: /send reset link/i }));
      
      await waitFor(() => {
        expect(screen.getByText('Email is required')).toBeInTheDocument();
      });
    });

    it('validates password strength consistently', async () => {
      const user = userEvent.setup();

      // Test in PasswordChangeForm
      renderWithProviders(
        <PasswordChangeForm />
      );

      await user.type(screen.getByLabelText(/new password/i), 'StrongPassword123!');
      
      await waitFor(() => {
        expect(screen.getByText('Password strength:')).toBeInTheDocument();
        expect(screen.getByText('Strong')).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling Integration', () => {
    it('handles network errors gracefully across all components', async () => {
      const user = userEvent.setup();
      const networkError = new Error('Network connection failed');

      // Test PasswordChangeForm error handling
      const { updatePassword } = require('aws-amplify/auth');
      updatePassword.mockRejectedValueOnce(networkError);

      renderWithProviders(
        <PasswordChangeForm />
      );

      await user.type(screen.getByLabelText(/current password/i), 'current123');
      await user.type(screen.getByLabelText(/new password/i), 'NewPassword123!');
      await user.type(screen.getByLabelText(/confirm new password/i), 'NewPassword123!');
      await user.click(screen.getByRole('button', { name: /change password/i }));

      await waitFor(() => {
        expect(screen.getByText('Network connection failed')).toBeInTheDocument();
      });
    });

    it('clears errors when user makes changes', async () => {
      const user = userEvent.setup();
      const { updatePassword } = require('aws-amplify/auth');
      updatePassword.mockRejectedValueOnce(new Error('Test error'));

      renderWithProviders(
        <PasswordChangeForm />
      );

      // Trigger error
      await user.type(screen.getByLabelText(/current password/i), 'wrong');
      await user.type(screen.getByLabelText(/new password/i), 'NewPassword123!');
      await user.type(screen.getByLabelText(/confirm new password/i), 'NewPassword123!');
      await user.click(screen.getByRole('button', { name: /change password/i }));

      await waitFor(() => {
        expect(screen.getByText('Test error')).toBeInTheDocument();
      });

      // Clear error by typing
      await user.type(screen.getByLabelText(/current password/i), '123');

      await waitFor(() => {
        expect(screen.queryByText('Test error')).not.toBeInTheDocument();
      });
    });
  });
});