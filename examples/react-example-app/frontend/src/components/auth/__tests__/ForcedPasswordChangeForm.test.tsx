/**
 * Tests for ForcedPasswordChangeForm component
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { ForcedPasswordChangeForm } from '../ForcedPasswordChangeForm';
import { AuthProvider } from '../../../contexts/AuthContext';
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

// Mock the auth context
const mockChangePassword = jest.fn();
const mockAuthState = {
  isAuthenticated: true,
  user: { userId: '123', email: 'test@example.com', emailVerified: true },
  isLoading: false,
  error: null,
};

jest.mock('../../../contexts/AuthContext', () => ({
  ...jest.requireActual('../../../contexts/AuthContext'),
  useAuth: () => ({
    changePassword: mockChangePassword,
    authState: mockAuthState,
  }),
}));

const theme = createTheme();

const renderWithTheme = (component: React.ReactElement) => {
  return render(
    <ThemeProvider theme={theme}>
      {component}
    </ThemeProvider>
  );
};

describe('ForcedPasswordChangeForm', () => {
  const mockOnPasswordChangeSuccess = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders forced password change form with temporary password reason', () => {
    renderWithTheme(
      <ForcedPasswordChangeForm
        onPasswordChangeSuccess={mockOnPasswordChangeSuccess}
        reason="temporary"
        userEmail="test@example.com"
      />
    );

    expect(screen.getByText('Password Change Required')).toBeInTheDocument();
    expect(screen.getByText('Account: test@example.com')).toBeInTheDocument();
    expect(screen.getByText('You are using a temporary password. Please set a new password to continue.')).toBeInTheDocument();
    expect(screen.getByLabelText(/current password/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/new password/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/confirm new password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /update password/i })).toBeInTheDocument();
  });

  it('renders different messages for different reasons', () => {
    const { rerender } = renderWithTheme(
      <ForcedPasswordChangeForm
        onPasswordChangeSuccess={mockOnPasswordChangeSuccess}
        reason="expired"
      />
    );

    expect(screen.getByText('Password Expired')).toBeInTheDocument();
    expect(screen.getByText('Your password has expired. Please set a new password to continue.')).toBeInTheDocument();

    rerender(
      <ThemeProvider theme={theme}>
        <ForcedPasswordChangeForm
          onPasswordChangeSuccess={mockOnPasswordChangeSuccess}
          reason="security"
        />
      </ThemeProvider>
    );

    expect(screen.getByText('Security Update Required')).toBeInTheDocument();
    expect(screen.getByText('For security reasons, you must change your password before continuing.')).toBeInTheDocument();

    rerender(
      <ThemeProvider theme={theme}>
        <ForcedPasswordChangeForm
          onPasswordChangeSuccess={mockOnPasswordChangeSuccess}
          reason="policy"
        />
      </ThemeProvider>
    );

    expect(screen.getByText('Password Policy Update')).toBeInTheDocument();
    expect(screen.getByText('Your password does not meet our updated security requirements. Please set a new password.')).toBeInTheDocument();
  });

  it('enforces stronger password requirements', async () => {
    const user = userEvent.setup();
    renderWithTheme(
      <ForcedPasswordChangeForm
        onPasswordChangeSuccess={mockOnPasswordChangeSuccess}
        reason="temporary"
      />
    );

    const newPasswordInput = screen.getByLabelText(/new password/i);
    await user.type(newPasswordInput, 'simplepass');

    await waitFor(() => {
      expect(screen.getByText('Password must be stronger for security compliance')).toBeInTheDocument();
    });
  });

  it('shows password strength requirements', async () => {
    const user = userEvent.setup();
    renderWithTheme(
      <ForcedPasswordChangeForm
        onPasswordChangeSuccess={mockOnPasswordChangeSuccess}
        reason="temporary"
      />
    );

    const newPasswordInput = screen.getByLabelText(/new password/i);
    await user.type(newPasswordInput, 'weak');

    await waitFor(() => {
      expect(screen.getByText('Password must be "Good" or "Strong" for security compliance')).toBeInTheDocument();
    });
  });

  it('disables submit button for weak passwords', async () => {
    const user = userEvent.setup();
    renderWithTheme(
      <ForcedPasswordChangeForm
        onPasswordChangeSuccess={mockOnPasswordChangeSuccess}
        reason="temporary"
      />
    );

    const currentPasswordInput = screen.getByLabelText(/current password/i);
    const newPasswordInput = screen.getByLabelText(/new password/i);
    const confirmPasswordInput = screen.getByLabelText(/confirm new password/i);
    const submitButton = screen.getByRole('button', { name: /update password/i });

    await user.type(currentPasswordInput, 'currentpass');
    await user.type(newPasswordInput, 'weak');
    await user.type(confirmPasswordInput, 'weak');

    expect(submitButton).toBeDisabled();
  });

  it('enables submit button for strong passwords', async () => {
    const user = userEvent.setup();
    renderWithTheme(
      <ForcedPasswordChangeForm
        onPasswordChangeSuccess={mockOnPasswordChangeSuccess}
        reason="temporary"
      />
    );

    const currentPasswordInput = screen.getByLabelText(/current password/i);
    const newPasswordInput = screen.getByLabelText(/new password/i);
    const confirmPasswordInput = screen.getByLabelText(/confirm new password/i);
    const submitButton = screen.getByRole('button', { name: /update password/i });

    await user.type(currentPasswordInput, 'currentpass');
    await user.type(newPasswordInput, 'StrongPassword123!');
    await user.type(confirmPasswordInput, 'StrongPassword123!');

    await waitFor(() => {
      expect(submitButton).not.toBeDisabled();
    });
  });

  it('validates all required fields', async () => {
    const user = userEvent.setup();
    renderWithTheme(
      <ForcedPasswordChangeForm
        onPasswordChangeSuccess={mockOnPasswordChangeSuccess}
        reason="temporary"
      />
    );

    // Try to submit empty form - button should be disabled
    const submitButton = screen.getByRole('button', { name: /update password/i });
    expect(submitButton).toBeDisabled();
  });

  it('validates password confirmation match', async () => {
    const user = userEvent.setup();
    renderWithTheme(
      <ForcedPasswordChangeForm
        onPasswordChangeSuccess={mockOnPasswordChangeSuccess}
        reason="temporary"
      />
    );

    const newPasswordInput = screen.getByLabelText(/new password/i);
    const confirmPasswordInput = screen.getByLabelText(/confirm new password/i);

    await user.type(newPasswordInput, 'StrongPassword123!');
    await user.type(confirmPasswordInput, 'DifferentPassword123!');

    await waitFor(() => {
      expect(screen.getByText('Passwords do not match')).toBeInTheDocument();
    });
  });

  it('submits form with valid strong password', async () => {
    const user = userEvent.setup();
    mockChangePassword.mockResolvedValueOnce(undefined);

    renderWithTheme(
      <ForcedPasswordChangeForm
        onPasswordChangeSuccess={mockOnPasswordChangeSuccess}
        reason="temporary"
      />
    );

    const currentPasswordInput = screen.getByLabelText(/current password/i);
    const newPasswordInput = screen.getByLabelText(/new password/i);
    const confirmPasswordInput = screen.getByLabelText(/confirm new password/i);
    const submitButton = screen.getByRole('button', { name: /update password/i });

    await user.type(currentPasswordInput, 'temppass123');
    await user.type(newPasswordInput, 'StrongPassword123!');
    await user.type(confirmPasswordInput, 'StrongPassword123!');

    await waitFor(() => {
      expect(submitButton).not.toBeDisabled();
    });

    await user.click(submitButton);

    await waitFor(() => {
      expect(mockChangePassword).toHaveBeenCalledWith({
        oldPassword: 'temppass123',
        newPassword: 'StrongPassword123!',
        confirmNewPassword: 'StrongPassword123!',
      });
    });

    await waitFor(() => {
      expect(mockOnPasswordChangeSuccess).toHaveBeenCalled();
    });
  });

  it('handles password change error', async () => {
    const user = userEvent.setup();
    const errorMessage = 'Current password is incorrect';
    mockChangePassword.mockRejectedValueOnce(new Error(errorMessage));

    renderWithTheme(
      <ForcedPasswordChangeForm
        onPasswordChangeSuccess={mockOnPasswordChangeSuccess}
        reason="temporary"
      />
    );

    const currentPasswordInput = screen.getByLabelText(/current password/i);
    const newPasswordInput = screen.getByLabelText(/new password/i);
    const confirmPasswordInput = screen.getByLabelText(/confirm new password/i);
    const submitButton = screen.getByRole('button', { name: /update password/i });

    await user.type(currentPasswordInput, 'wrongpass');
    await user.type(newPasswordInput, 'StrongPassword123!');
    await user.type(confirmPasswordInput, 'StrongPassword123!');

    await waitFor(() => {
      expect(submitButton).not.toBeDisabled();
    });

    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });
  });

  it('shows security notice', () => {
    renderWithTheme(
      <ForcedPasswordChangeForm
        onPasswordChangeSuccess={mockOnPasswordChangeSuccess}
        reason="temporary"
      />
    );

    expect(screen.getByText('Your new password will be used for all future logins. Make sure to store it securely.')).toBeInTheDocument();
  });

  it('toggles password visibility', async () => {
    const user = userEvent.setup();
    renderWithTheme(
      <ForcedPasswordChangeForm
        onPasswordChangeSuccess={mockOnPasswordChangeSuccess}
        reason="temporary"
      />
    );

    const currentPasswordInput = screen.getByLabelText(/current password/i);
    const toggleButtons = screen.getAllByLabelText(/toggle.*password visibility/i);

    expect(currentPasswordInput).toHaveAttribute('type', 'password');
    
    await user.click(toggleButtons[0]);
    expect(currentPasswordInput).toHaveAttribute('type', 'text');
    
    await user.click(toggleButtons[0]);
    expect(currentPasswordInput).toHaveAttribute('type', 'password');
  });

  it('shows warning icon for different severity levels', () => {
    const { rerender } = renderWithTheme(
      <ForcedPasswordChangeForm
        onPasswordChangeSuccess={mockOnPasswordChangeSuccess}
        reason="expired"
      />
    );

    // Check that warning icon is present
    expect(screen.getByTestId('WarningIcon') || screen.querySelector('[data-testid="WarningIcon"]')).toBeTruthy();

    rerender(
      <ThemeProvider theme={theme}>
        <ForcedPasswordChangeForm
          onPasswordChangeSuccess={mockOnPasswordChangeSuccess}
          reason="security"
        />
      </ThemeProvider>
    );

    // Warning icon should still be present for security reason
    expect(screen.getByTestId('WarningIcon') || screen.querySelector('[data-testid="WarningIcon"]')).toBeTruthy();
  });
});