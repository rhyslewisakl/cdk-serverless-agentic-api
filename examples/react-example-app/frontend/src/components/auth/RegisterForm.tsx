/**
 * Registration form component with user registration flow
 */

import React, { useState } from 'react';
import {
  Box,
  Button,
  TextField,
  Typography,
  Alert,
  Paper,
  Link,
  InputAdornment,
  IconButton,
  LinearProgress,
  Chip,
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  Email,
  Lock,
  CheckCircle,
  Cancel,
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { RegisterCredentials, RegisterFormErrors } from '../../types/auth';
import { isValidEmail, isValidPassword, getPasswordStrength, validateRequired } from '../../utils/validation';
import { LoadingSpinner } from '../common/LoadingSpinner';

interface RegisterFormProps {
  onSwitchToLogin: () => void;
  onRegistrationSuccess?: () => void;
}

export const RegisterForm: React.FC<RegisterFormProps> = ({
  onSwitchToLogin,
  onRegistrationSuccess,
}) => {
  const { register, authState } = useAuth();
  const [credentials, setCredentials] = useState<RegisterCredentials>({
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState<RegisterFormErrors>({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState({ score: 0, feedback: [] as string[] });

  // Handle input changes with real-time validation
  const handleInputChange = (field: keyof RegisterCredentials) => (
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

    // Real-time validation
    validateField(field, value);

    // Update password strength for password field
    if (field === 'password') {
      const strength = getPasswordStrength(value);
      setPasswordStrength(strength);
    }
  };

  // Validate individual field
  const validateField = (field: keyof RegisterCredentials, value: string) => {
    let error: string | undefined;

    switch (field) {
      case 'email':
        error = validateRequired(value, 'Email');
        if (!error && !isValidEmail(value)) {
          error = 'Please enter a valid email address';
        }
        break;
      case 'password':
        error = validateRequired(value, 'Password');
        if (!error && !isValidPassword(value)) {
          error = 'Password must be at least 8 characters long';
        }
        break;
      case 'confirmPassword':
        error = validateRequired(value, 'Confirm Password');
        if (!error && value !== credentials.password) {
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
    const newErrors: RegisterFormErrors = {};

    // Email validation
    const emailError = validateRequired(credentials.email, 'Email');
    if (emailError) {
      newErrors.email = emailError;
    } else if (!isValidEmail(credentials.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    // Password validation
    const passwordError = validateRequired(credentials.password, 'Password');
    if (passwordError) {
      newErrors.password = passwordError;
    } else if (!isValidPassword(credentials.password)) {
      newErrors.password = 'Password must be at least 8 characters long';
    }

    // Confirm password validation
    const confirmPasswordError = validateRequired(credentials.confirmPassword, 'Confirm Password');
    if (confirmPasswordError) {
      newErrors.confirmPassword = confirmPasswordError;
    } else if (credentials.confirmPassword !== credentials.password) {
      newErrors.confirmPassword = 'Passwords do not match';
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

    try {
      await register(credentials);
      onRegistrationSuccess?.();
    } catch (error: any) {
      setErrors({ general: error.message || 'Registration failed' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Toggle password visibility
  const handleTogglePasswordVisibility = () => {
    setShowPassword(prev => !prev);
  };

  const handleToggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword(prev => !prev);
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
  const showPasswordStrength = credentials.password.length > 0;

  return (
    <Paper elevation={3} sx={{ p: 4, maxWidth: 400, mx: 'auto', mt: 4 }}>
      <Box component="form" onSubmit={handleSubmit} noValidate>
        <Typography variant="h4" component="h1" gutterBottom align="center">
          Sign Up
        </Typography>

        <Typography variant="body2" color="text.secondary" align="center" sx={{ mb: 3 }}>
          Create your account to get started
        </Typography>

        {/* General error message */}
        {errors.general && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {errors.general}
          </Alert>
        )}

        {/* Email field */}
        <TextField
          fullWidth
          id="email"
          name="email"
          label="Email Address"
          type="email"
          value={credentials.email}
          onChange={handleInputChange('email')}
          error={!!errors.email}
          helperText={errors.email}
          disabled={isLoading}
          margin="normal"
          required
          autoComplete="email"
          autoFocus
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Email color={errors.email ? 'error' : 'action'} />
              </InputAdornment>
            ),
          }}
        />

        {/* Password field */}
        <TextField
          fullWidth
          id="password"
          name="password"
          label="Password"
          type={showPassword ? 'text' : 'password'}
          value={credentials.password}
          onChange={handleInputChange('password')}
          error={!!errors.password}
          helperText={errors.password}
          disabled={isLoading}
          margin="normal"
          required
          autoComplete="new-password"
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Lock color={errors.password ? 'error' : 'action'} />
              </InputAdornment>
            ),
            endAdornment: (
              <InputAdornment position="end">
                <IconButton
                  aria-label="toggle password visibility"
                  onClick={handleTogglePasswordVisibility}
                  edge="end"
                  disabled={isLoading}
                >
                  {showPassword ? <VisibilityOff /> : <Visibility />}
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

        {/* Confirm password field */}
        <TextField
          fullWidth
          id="confirmPassword"
          name="confirmPassword"
          label="Confirm Password"
          type={showConfirmPassword ? 'text' : 'password'}
          value={credentials.confirmPassword}
          onChange={handleInputChange('confirmPassword')}
          error={!!errors.confirmPassword}
          helperText={errors.confirmPassword}
          disabled={isLoading}
          margin="normal"
          required
          autoComplete="new-password"
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Lock color={errors.confirmPassword ? 'error' : 'action'} />
              </InputAdornment>
            ),
            endAdornment: (
              <InputAdornment position="end">
                <IconButton
                  aria-label="toggle confirm password visibility"
                  onClick={handleToggleConfirmPasswordVisibility}
                  edge="end"
                  disabled={isLoading}
                >
                  {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                </IconButton>
                {credentials.confirmPassword && credentials.password && (
                  credentials.confirmPassword === credentials.password ? (
                    <CheckCircle sx={{ color: 'success.main', ml: 1 }} />
                  ) : (
                    <Cancel sx={{ color: 'error.main', ml: 1 }} />
                  )
                )}
              </InputAdornment>
            ),
          }}
        />

        {/* Submit button */}
        <Button
          type="submit"
          fullWidth
          variant="contained"
          size="large"
          disabled={isLoading}
          sx={{ mt: 3, mb: 2, py: 1.5 }}
        >
          {isLoading ? <LoadingSpinner size={24} /> : 'Create Account'}
        </Button>

        {/* Switch to login */}
        <Box textAlign="center">
          <Typography variant="body2">
            Already have an account?{' '}
            <Link
              component="button"
              type="button"
              onClick={onSwitchToLogin}
              disabled={isLoading}
              sx={{ textDecoration: 'none' }}
            >
              Sign in here
            </Link>
          </Typography>
        </Box>
      </Box>
    </Paper>
  );
};

export default RegisterForm;