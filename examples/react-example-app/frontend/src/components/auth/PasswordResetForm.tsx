/**
 * Password reset form component for forgotten passwords
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
  Stepper,
  Step,
  StepLabel,
} from '@mui/material';
import {
  Email,
  Send,
  CheckCircle,
} from '@mui/icons-material';
import { isValidEmail, validateRequired } from '../../utils/validation';
import { LoadingSpinner } from '../common/LoadingSpinner';

interface PasswordResetFormProps {
  onBackToLogin: () => void;
  onResetSuccess?: () => void;
}

interface ResetFormErrors {
  email?: string;
  general?: string;
}

export const PasswordResetForm: React.FC<PasswordResetFormProps> = ({
  onBackToLogin,
  onResetSuccess,
}) => {
  const [email, setEmail] = useState('');
  const [errors, setErrors] = useState<ResetFormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [step, setStep] = useState<'request' | 'sent' | 'success'>('request');

  // Handle email input change
  const handleEmailChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setEmail(value);

    // Clear errors when user starts typing
    if (errors.email) {
      setErrors(prev => ({ ...prev, email: undefined }));
    }
    if (errors.general) {
      setErrors(prev => ({ ...prev, general: undefined }));
    }

    // Real-time validation
    if (value && !isValidEmail(value)) {
      setErrors(prev => ({ ...prev, email: 'Please enter a valid email address' }));
    }
  };

  // Validate form
  const validateForm = (): boolean => {
    const newErrors: ResetFormErrors = {};

    const emailError = validateRequired(email, 'Email');
    if (emailError) {
      newErrors.email = emailError;
    } else if (!isValidEmail(email)) {
      newErrors.email = 'Please enter a valid email address';
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
      // Simulate password reset request
      // In a real implementation, this would call AWS Cognito's forgotPassword
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // For demo purposes, we'll just show the success flow
      setStep('sent');
      
      // Auto-advance to success after showing the "sent" message
      setTimeout(() => {
        setStep('success');
        setTimeout(() => {
          onResetSuccess?.();
        }, 3000);
      }, 2000);
    } catch (error: any) {
      setErrors({ general: error.message || 'Password reset request failed' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle resend request
  const handleResend = async () => {
    setIsSubmitting(true);
    try {
      // Simulate resend
      await new Promise(resolve => setTimeout(resolve, 1000));
      // Reset to sent state
      setStep('sent');
    } catch (error: any) {
      setErrors({ general: 'Failed to resend reset email' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const steps = ['Request Reset', 'Check Email', 'Complete'];

  // Render request form
  const renderRequestForm = () => (
    <Box component="form" onSubmit={handleSubmit} noValidate>
      <Typography variant="h4" component="h1" gutterBottom align="center">
        Reset Password
      </Typography>

      <Typography variant="body2" color="text.secondary" align="center" sx={{ mb: 3 }}>
        Enter your email address and we'll send you a link to reset your password
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
        value={email}
        onChange={handleEmailChange}
        error={!!errors.email}
        helperText={errors.email}
        disabled={isSubmitting}
        margin="normal"
        required
        autoComplete="email"
        autoFocus
        data-testid="email-input"
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <Email color={errors.email ? 'error' : 'action'} />
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
        disabled={isSubmitting}
        sx={{ mt: 3, mb: 2, py: 1.5 }}
        data-testid="submit-button"
        startIcon={isSubmitting ? <LoadingSpinner size={20} /> : <Send />}
      >
        {isSubmitting ? 'Sending...' : 'Send Reset Link'}
      </Button>

      {/* Back to login */}
      <Box textAlign="center">
        <Typography variant="body2">
          Remember your password?{' '}
          <Link
            component="button"
            type="button"
            onClick={onBackToLogin}
            disabled={isSubmitting}
            sx={{ textDecoration: 'none' }}
          >
            Back to Sign In
          </Link>
        </Typography>
      </Box>
    </Box>
  );

  // Render email sent confirmation
  const renderEmailSent = () => (
    <Box textAlign="center">
      <CheckCircle sx={{ fontSize: 60, color: 'success.main', mb: 2 }} />
      
      <Typography variant="h4" component="h1" gutterBottom>
        Check Your Email
      </Typography>

      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        We've sent a password reset link to:
      </Typography>

      <Typography variant="h6" sx={{ mb: 3, color: 'primary.main' }}>
        {email}
      </Typography>

      <Alert severity="info" sx={{ mb: 3, textAlign: 'left' }}>
        <Typography variant="body2">
          • Click the link in the email to reset your password<br />
          • The link will expire in 24 hours<br />
          • Check your spam folder if you don't see the email
        </Typography>
      </Alert>

      <Button
        variant="outlined"
        onClick={handleResend}
        disabled={isSubmitting}
        sx={{ mb: 2 }}
        data-testid="resend-button"
      >
        {isSubmitting ? <LoadingSpinner size={20} /> : 'Resend Email'}
      </Button>

      <Box>
        <Typography variant="body2">
          <Link
            component="button"
            type="button"
            onClick={onBackToLogin}
            disabled={isSubmitting}
            sx={{ textDecoration: 'none' }}
          >
            Back to Sign In
          </Link>
        </Typography>
      </Box>
    </Box>
  );

  // Render success confirmation
  const renderSuccess = () => (
    <Box textAlign="center">
      <CheckCircle sx={{ fontSize: 60, color: 'success.main', mb: 2 }} />
      
      <Typography variant="h4" component="h1" gutterBottom>
        Reset Link Sent!
      </Typography>

      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        Password reset instructions have been sent to your email address.
        You'll be redirected to the login page shortly.
      </Typography>

      <Button
        variant="contained"
        onClick={onBackToLogin}
        sx={{ mt: 2 }}
      >
        Continue to Sign In
      </Button>
    </Box>
  );

  return (
    <Paper elevation={3} sx={{ p: 4, maxWidth: 500, mx: 'auto', mt: 4 }}>
      {/* Progress stepper */}
      <Stepper activeStep={step === 'request' ? 0 : step === 'sent' ? 1 : 2} sx={{ mb: 4 }}>
        {steps.map((label) => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>

      {/* Render appropriate form based on step */}
      {step === 'request' && renderRequestForm()}
      {step === 'sent' && renderEmailSent()}
      {step === 'success' && renderSuccess()}
    </Paper>
  );
};

export default PasswordResetForm;