/**
 * Password change form component for voluntary password changes
 */

import React, { useState } from 'react';
import {
  Box,
  Button,
  TextField,
  Typography,
  Alert,
  Paper,
  InputAdornment,
  IconButton,
  LinearProgress,
  Chip,
  Divider,
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  Lock,
  CheckCircle,
  Cancel,
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { PasswordChangeCredentials, PasswordChangeFormErrors } from '../../types/auth';
import { isValidPassword, getPasswordStrength, validateRequired } from '../../utils/validation';
import { LoadingSpinner } from '../common/LoadingSpinner';

interface PasswordChangeFormProps {
  onPasswordChangeSuccess?: () => void;
  onCancel?: () => void;
  showCancelButton?: boolean;
}

export const PasswordChangeForm: React.FC<PasswordChangeFormProps> = ({
  onPasswordChangeSuccess,
  onCancel,
  showCancelButton = true,
}) => {
  const { changePassword, authState } = useAuth();
  const [credentials, setCredentials] = useState<PasswordChangeCredentials>({
    oldPassword: '',
    newPassword: '',
    confirmNewPassword: '',
  });
  const [errors, setErrors] = useState<PasswordChangeFormErrors>({});
  const [showPasswords, setShowPasswords] = useState({
    old: false,
    new: false,
    confirm: false,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState({ score: 0, feedback: [] as string[] });
  const [successMessage, setSuccessMessage] = useState<string>('');

  // Handle input changes with real-time validation
  const handleInputChange = (field: keyof PasswordChangeCredentials) => (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const value = event.target.value;
    setCredentials(prev => ({ ...prev, [field]: value }));

    // Clear field-specific error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }

    // Clear general error when user makes changes
    if (errors.general) {
      setErrors(prev => ({ ...prev, general: undefined }));
    }

    // Clear success message when user makes changes
    if (successMessage) {
      setSuccessMessage('');
    }

    // Real-time validation
    validateField(field, value);

    // Update password strength for new password field
    if (field === 'newPassword') {
      const strength = getPasswordStrength(value);
      setPasswordStrength(strength);
    }
  };

  // Validate individual field
  const validateField = (field: keyof PasswordChangeCredentials, value: string) => {
    let error: string | undefined;

    switch (field) {
      case 'oldPassword':
        error = validateRequired(value, 'Current Password');
        break;
      case 'newPassword':
        error = validateRequired(value, 'New Password');
        if (!error && !isValidPassword(value)) {
          error = 'New password must be at least 8 characters long';
        }
        if (!error && value === credentials.oldPassword) {
          error = 'New password must be different from current password';
        }
        break;
      case 'confirmNewPassword':
        error = validateRequired(value, 'Confirm New Password');
        if (!error && value !== credentials.newPassword) {
          error = 'Passwords do not match';
        }
        break;
    }

    if (error) {
      setErrors(prev => ({ ...prev, [field]: error }));
    }
  };

  // Validate entire form
  const validateForm = (): boolean => {
    const newErrors: PasswordChangeFormErrors = {};

    // Old password validation
    const oldPasswordError = validateRequired(credentials.oldPassword, 'Current Password');
    if (oldPasswordError) {
      newErrors.oldPassword = oldPasswordError;
    }

    // New password validation
    const newPasswordError = validateRequired(credentials.newPassword, 'New Password');
    if (newPasswordError) {
      newErrors.newPassword = newPasswordError;
    } else if (!isValidPassword(credentials.newPassword)) {
      newErrors.newPassword = 'New password must be at least 8 characters long';
    } else if (credentials.newPassword === credentials.oldPassword) {
      newErrors.newPassword = 'New password must be different from current password';
    }

    // Confirm new password validation
    const confirmPasswordError = validateRequired(credentials.confirmNewPassword, 'Confirm New Password');
    if (confirmPasswordError) {
      newErrors.confirmNewPassword = confirmPasswordError;
    } else if (credentials.confirmNewPassword !== credentials.newPassword) {
      newErrors.confirmNewPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setErrors({});
    setSuccessMessage('');

    try {
      await changePassword(credentials);
      setSuccessMessage('Password changed successfully!');
      
      // Reset form
      setCredentials({
        oldPassword: '',
        newPassword: '',
        confirmNewPassword: '',
      });
      setPasswordStrength({ score: 0, feedback: [] });
      
      // Call success callback after a short delay to show success message
      setTimeout(() => {
        onPasswordChangeSuccess?.();
      }, 2000);
    } catch (error: any) {
      setErrors({ general: error.message || 'Password change failed' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Toggle password visibility
  const handleTogglePasswordVisibility = (field: 'old' | 'new' | 'confirm') => () => {
    setShowPasswords(prev => ({ ...prev, [field]: !prev[field] }));
  };

  // Get password strength color
  const getPasswordStrengthColor = (score: number): 'error' | 'warning' | 'info' | 'success' => {
    if (score <= 1) return 'error';
    if (score <= 2) return 'warning';
    if (score <= 3) return 'info';
    return 'success';
  };

  // Get password strength label
  const getPasswordStrengthLabel = (score: number): string => {
    if (score <= 1) return 'Weak';
    if (score <= 2) return 'Fair';
    if (score <= 3) return 'Good';
    return 'Strong';
  };

  const isLoading = authState.isLoading || isSubmitting;
  const showPasswordStrength = credentials.newPassword.length > 0;

  return (
    <Paper elevation={3} sx={{ p: 4, maxWidth: 500, mx: 'auto', mt: 4 }}>
      <Box component="form" onSubmit={handleSubmit} noValidate>
        <Typography variant="h4" component="h1" gutterBottom align="center">
          Change Password
        </Typography>

        <Typography variant="body2" color="text.secondary" align="center" sx={{ mb: 3 }}>
          Update your password to keep your account secure
        </Typography>

        {/* Success message */}
        {successMessage && (
          <Alert severity="success" sx={{ mb: 2 }}>
            {successMessage}
          </Alert>
        )}

        {/* General error message */}
        {errors.general && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {errors.general}
          </Alert>
        )}

        {/* Current password field */}
        <TextField
          fullWidth
          id="oldPassword"
          name="oldPassword"
          label="Current Password"
          type={showPasswords.old ? 'text' : 'password'}
          value={credentials.oldPassword}
          onChange={handleInputChange('oldPassword')}
          error={!!errors.oldPassword}
          helperText={errors.oldPassword}
          disabled={isLoading}
          margin="normal"
          required
          autoComplete="current-password"
          autoFocus
          data-testid="old-password-input"
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Lock color={errors.oldPassword ? 'error' : 'action'} />
              </InputAdornment>
            ),
            endAdornment: (
              <InputAdornment position="end">
                <IconButton
                  aria-label="toggle current password visibility"
                  onClick={handleTogglePasswordVisibility('old')}
                  edge="end"
                  disabled={isLoading}
                >
                  {showPasswords.old ? <VisibilityOff /> : <Visibility />}
                </IconButton>
              </InputAdornment>
            ),
          }}
        />

        <Divider sx={{ my: 3 }} />

        {/* New password field */}
        <TextField
          fullWidth
          id="newPassword"
          name="newPassword"
          label="New Password"
          type={showPasswords.new ? 'text' : 'password'}
          value={credentials.newPassword}
          onChange={handleInputChange('newPassword')}
          error={!!errors.newPassword}
          helperText={errors.newPassword}
          disabled={isLoading}
          margin="normal"
          required
          autoComplete="new-password"
          data-testid="new-password-input"
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Lock color={errors.newPassword ? 'error' : 'action'} />
              </InputAdornment>
            ),
            endAdornment: (
              <InputAdornment position="end">
                <IconButton
                  aria-label="toggle new password visibility"
                  onClick={handleTogglePasswordVisibility('new')}
                  edge="end"
                  disabled={isLoading}
                >
                  {showPasswords.new ? <VisibilityOff /> : <Visibility />}
                </IconButton>
              </InputAdornment>
            ),
          }}
        />

        {/* Password strength indicator */}
        {showPasswordStrength && (
          <Box sx={{ mt: 1, mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <Typography variant="caption" sx={{ mr: 1 }}>
                Password strength:
              </Typography>
              <Chip
                size="small"
                label={getPasswordStrengthLabel(passwordStrength.score)}
                color={getPasswordStrengthColor(passwordStrength.score)}
                variant="outlined"
              />
            </Box>
            <LinearProgress
              variant="determinate"
              value={(passwordStrength.score / 5) * 100}
              color={getPasswordStrengthColor(passwordStrength.score)}
              sx={{ height: 4, borderRadius: 2 }}
            />
            {passwordStrength.feedback.length > 0 && (
              <Box sx={{ mt: 1 }}>
                {passwordStrength.feedback.map((feedback, index) => (
                  <Typography
                    key={index}
                    variant="caption"
                    color="text.secondary"
                    sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}
                  >
                    <Cancel sx={{ fontSize: 12, mr: 0.5, color: 'error.main' }} />
                    {feedback}
                  </Typography>
                ))}
              </Box>
            )}
          </Box>
        )}

        {/* Confirm new password field */}
        <TextField
          fullWidth
          id="confirmNewPassword"
          name="confirmNewPassword"
          label="Confirm New Password"
          type={showPasswords.confirm ? 'text' : 'password'}
          value={credentials.confirmNewPassword}
          onChange={handleInputChange('confirmNewPassword')}
          error={!!errors.confirmNewPassword}
          helperText={errors.confirmNewPassword}
          disabled={isLoading}
          margin="normal"
          required
          autoComplete="new-password"
          data-testid="confirm-password-input"
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Lock color={errors.confirmNewPassword ? 'error' : 'action'} />
              </InputAdornment>
            ),
            endAdornment: (
              <InputAdornment position="end">
                <IconButton
                  aria-label="toggle confirm password visibility"
                  onClick={handleTogglePasswordVisibility('confirm')}
                  edge="end"
                  disabled={isLoading}
                >
                  {showPasswords.confirm ? <VisibilityOff /> : <Visibility />}
                </IconButton>
                {credentials.confirmNewPassword && credentials.newPassword && (
                  credentials.confirmNewPassword === credentials.newPassword ? (
                    <CheckCircle sx={{ color: 'success.main', ml: 1 }} />
                  ) : (
                    <Cancel sx={{ color: 'error.main', ml: 1 }} />
                  )
                )}
              </InputAdornment>
            ),
          }}
        />

        {/* Action buttons */}
        <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
          <Button
            type="submit"
            variant="contained"
            size="large"
            disabled={isLoading || !!successMessage}
            sx={{ flex: 1, py: 1.5 }}
            data-testid="submit-button"
          >
            {isLoading ? <LoadingSpinner size={24} /> : 'Change Password'}
          </Button>
          
          {showCancelButton && (
            <Button
              type="button"
              variant="outlined"
              size="large"
              onClick={onCancel}
              disabled={isLoading}
              sx={{ flex: 1, py: 1.5 }}
              data-testid="cancel-button"
            >
              Cancel
            </Button>
          )}
        </Box>
      </Box>
    </Paper>
  );
};

export default PasswordChangeForm;