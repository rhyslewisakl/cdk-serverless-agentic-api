/**
 * Login page component
 */

import React from 'react';
import {
  Container,
  Paper,
  Box,
  Typography,
  Link,
} from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { LoginForm } from '../auth/LoginForm';

/**
 * Login page component that wraps the LoginForm
 */
export const LoginPage: React.FC = () => {
  return (
    <Container component="main" maxWidth="sm">
      <Box
        sx={{
          marginTop: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Paper
          elevation={3}
          sx={{
            padding: 4,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            width: '100%',
          }}
        >
          <Typography component="h1" variant="h4" gutterBottom>
            Sign In
          </Typography>
          <Typography variant="body2" color="text.secondary" textAlign="center" sx={{ mb: 3 }}>
            Welcome back! Please sign in to your account.
          </Typography>
          
          <LoginForm />
          
          <Box sx={{ mt: 3, textAlign: 'center' }}>
            <Typography variant="body2">
              Don't have an account?{' '}
              <Link component={RouterLink} to="/register" underline="hover">
                Sign up here
              </Link>
            </Typography>
            <Typography variant="body2" sx={{ mt: 1 }}>
              <Link component={RouterLink} to="/forgot-password" underline="hover">
                Forgot your password?
              </Link>
            </Typography>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default LoginPage;