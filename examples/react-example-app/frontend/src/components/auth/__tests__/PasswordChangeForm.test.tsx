/**
 * Tests for PasswordChangeForm component
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { PasswordChangeForm } from '../PasswordChangeForm';
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

describe('PasswordChangeForm', () => {
  const mockOnPasswordChangeSuccess = jest.fn();
  const mockOnCancel = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders password change form correctly', () => {
    renderWithTheme(
      <PasswordChangeForm
        onPasswordChangeSuccess={mockOnPasswordChangeSuccess}
        onCancel={mockOnCancel}
      />
    );

    expect(screen.getByRole('heading', { name: 'Change Password' })).toBeInTheDocument();
    expect(screen.getByText('Update your password to keep your account secure')).toBeInTheDocument();
    expect(screen.getByTestId('old-password-input')).toBeInTheDocument();
    expect(screen.getByTestId('new-password-input')).toBeInTheDocument();
    expect(screen.getByTestId('confirm-password-input')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /change password/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
  });

  it('validates required fields', async () => {
    const user = userEvent.setup();
    renderWithTheme(
      <PasswordChangeForm
        onPasswordChangeSuccess={mockOnPasswordChangeSuccess}
        onCancel={mockOnCancel}
      />
    );

    const submitButton = screen.getByRole('button', { name: /change password/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Current Password is required')).toBeInTheDocument();
      expect(screen.getByText('New Password is required')).toBeInTheDocument();
      expect(screen.getByText('Confirm New Password is required')).toBeInTheDocument();
    });
  });

  it('validates password strength', async () => {
    const user = userEvent.setup();
    renderWithTheme(
      <PasswordChangeForm
        onPasswordChangeSuccess={mockOnPasswordChangeSuccess}
        onCancel={mockOnCancel}
      />
    );

    const newPasswordInput = screen.getByLabelText(/new password/i);
    await user.type(newPasswordInput, 'weak');

    await waitFor(() => {
      expect(screen.getByText('New password must be at least 8 characters long')).toBeInTheDocument();
    });
  });

  it('validates password confirmation match', async () => {
    const user = userEvent.setup();
    renderWithTheme(
      <PasswordChangeForm
        onPasswordChangeSuccess={mockOnPasswordChangeSuccess}
        onCancel={mockOnCancel}
      />
    );

    const newPasswordInput = screen.getByLabelText(/new password/i);
    const confirmPasswordInput = screen.getByLabelText(/confirm new password/i);

    await user.type(newPasswordInput, 'newpassword123');
    await user.type(confirmPasswordInput, 'differentpassword');

    await waitFor(() => {
      expect(screen.getByText('Passwords do not match')).toBeInTheDocument();
    });
  });

  it('prevents same password as current', async () => {
    const user = userEvent.setup();
    renderWithTheme(
      <PasswordChangeForm
        onPasswordChangeSuccess={mockOnPasswordChangeSuccess}
        onCancel={mockOnCancel}
      />
    );

    const currentPasswordInput = screen.getByTestId('old-password-input').querySelector('input') as HTMLInputElement;
    const newPasswordInput = screen.getByTestId('new-password-input').querySelector('input') as HTMLInputElement;

    await user.type(currentPasswordInput, 'currentpass123');
    await user.type(newPasswordInput, 'currentpass123');

    await waitFor(() => {
      expect(screen.getByText('New password must be different from current password')).toBeInTheDocument();
    });
  });

  it('shows password strength indicator', async () => {
    const user = userEvent.setup();
    renderWithTheme(
      <PasswordChangeForm
        onPasswordChangeSuccess={mockOnPasswordChangeSuccess}
        onCancel={mockOnCancel}
      />
    );

    const newPasswordInput = screen.getByLabelText(/new password/i);
    await user.type(newPasswordInput, 'StrongPassword123!');

    await waitFor(() => {
      expect(screen.getByText('Password strength:')).toBeInTheDocument();
      expect(screen.getByText('Strong')).toBeInTheDocument();
    });
  });

  it('toggles password visibility', async () => {
    const user = userEvent.setup();
    renderWithTheme(
      <PasswordChangeForm
        onPasswordChangeSuccess={mockOnPasswordChangeSuccess}
        onCancel={mockOnCancel}
      />
    );

    const currentPasswordInput = screen.getByTestId('old-password-input').querySelector('input') as HTMLInputElement;
    const toggleButton = screen.getAllByLabelText(/toggle.*password visibility/i)[0];

    expect(currentPasswordInput).toHaveAttribute('type', 'password');
    
    await user.click(toggleButton);
    expect(currentPasswordInput).toHaveAttribute('type', 'text');
    
    await user.click(toggleButton);
    expect(currentPasswordInput).toHaveAttribute('type', 'password');
  });

  it('submits form with valid data', async () => {
    const user = userEvent.setup();
    mockChangePassword.mockResolvedValueOnce(undefined);

    renderWithTheme(
      <PasswordChangeForm
        onPasswordChangeSuccess={mockOnPasswordChangeSuccess}
        onCancel={mockOnCancel}
      />
    );

    const currentPasswordInput = screen.getByTestId('old-password-input').querySelector('input') as HTMLInputElement;
    const newPasswordInput = screen.getByTestId('new-password-input').querySelector('input') as HTMLInputElement;
    const confirmPasswordInput = screen.getByTestId('confirm-password-input').querySelector('input') as HTMLInputElement;
    const submitButton = screen.getByRole('button', { name: /change password/i });

    await user.type(currentPasswordInput, 'currentpass123');
    await user.type(newPasswordInput, 'NewPassword123!');
    await user.type(confirmPasswordInput, 'NewPassword123!');
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockChangePassword).toHaveBeenCalledWith({
        oldPassword: 'currentpass123',
        newPassword: 'NewPassword123!',
        confirmNewPassword: 'NewPassword123!',
      });
    });

    await waitFor(() => {
      expect(screen.getByText('Password changed successfully!')).toBeInTheDocument();
    });
  });

  it('handles password change error', async () => {
    const user = userEvent.setup();
    const errorMessage = 'Current password is incorrect';
    mockChangePassword.mockRejectedValueOnce(new Error(errorMessage));

    renderWithTheme(
      <PasswordChangeForm
        onPasswordChangeSuccess={mockOnPasswordChangeSuccess}
        onCancel={mockOnCancel}
      />
    );

    const currentPasswordInput = screen.getByTestId('old-password-input').querySelector('input') as HTMLInputElement;
    const newPasswordInput = screen.getByTestId('new-password-input').querySelector('input') as HTMLInputElement;
    const confirmPasswordInput = screen.getByTestId('confirm-password-input').querySelector('input') as HTMLInputElement;
    const submitButton = screen.getByRole('button', { name: /change password/i });

    await user.type(currentPasswordInput, 'wrongpass');
    await user.type(newPasswordInput, 'NewPassword123!');
    await user.type(confirmPasswordInput, 'NewPassword123!');
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });
  });

  it('calls onCancel when cancel button is clicked', async () => {
    const user = userEvent.setup();
    renderWithTheme(
      <PasswordChangeForm
        onPasswordChangeSuccess={mockOnPasswordChangeSuccess}
        onCancel={mockOnCancel}
      />
    );

    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    await user.click(cancelButton);

    expect(mockOnCancel).toHaveBeenCalled();
  });

  it('hides cancel button when showCancelButton is false', () => {
    renderWithTheme(
      <PasswordChangeForm
        onPasswordChangeSuccess={mockOnPasswordChangeSuccess}
        onCancel={mockOnCancel}
        showCancelButton={false}
      />
    );

    expect(screen.queryByRole('button', { name: /cancel/i })).not.toBeInTheDocument();
  });

  it('disables form during submission', async () => {
    const user = userEvent.setup();
    mockChangePassword.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 1000)));

    renderWithTheme(
      <PasswordChangeForm
        onPasswordChangeSuccess={mockOnPasswordChangeSuccess}
        onCancel={mockOnCancel}
      />
    );

    const currentPasswordInput = screen.getByTestId('old-password-input').querySelector('input') as HTMLInputElement;
    const newPasswordInput = screen.getByTestId('new-password-input').querySelector('input') as HTMLInputElement;
    const confirmPasswordInput = screen.getByTestId('confirm-password-input').querySelector('input') as HTMLInputElement;
    const submitButton = screen.getByRole('button', { name: /change password/i });

    await user.type(currentPasswordInput, 'currentpass123');
    await user.type(newPasswordInput, 'NewPassword123!');
    await user.type(confirmPasswordInput, 'NewPassword123!');
    await user.click(submitButton);

    expect(currentPasswordInput).toBeDisabled();
    expect(newPasswordInput).toBeDisabled();
    expect(confirmPasswordInput).toBeDisabled();
    expect(submitButton).toBeDisabled();
  });

  it('clears form after successful password change', async () => {
    const user = userEvent.setup();
    mockChangePassword.mockResolvedValueOnce(undefined);

    renderWithTheme(
      <PasswordChangeForm
        onPasswordChangeSuccess={mockOnPasswordChangeSuccess}
        onCancel={mockOnCancel}
      />
    );

    const currentPasswordInput = screen.getByTestId('old-password-input').querySelector('input') as HTMLInputElement;
    const newPasswordInput = screen.getByTestId('new-password-input').querySelector('input') as HTMLInputElement;
    const confirmPasswordInput = screen.getByTestId('confirm-password-input').querySelector('input') as HTMLInputElement;
    const submitButton = screen.getByRole('button', { name: /change password/i });

    await user.type(currentPasswordInput, 'currentpass123');
    await user.type(newPasswordInput, 'NewPassword123!');
    await user.type(confirmPasswordInput, 'NewPassword123!');
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Password changed successfully!')).toBeInTheDocument();
    });

    // Check that form fields are cleared
    expect(currentPasswordInput).toHaveValue('');
    expect(newPasswordInput).toHaveValue('');
    expect(confirmPasswordInput).toHaveValue('');
  });
});