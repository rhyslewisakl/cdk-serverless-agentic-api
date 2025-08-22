import React, { useState } from 'react';
import {
  Container,
  Header,
  SpaceBetween,
  Box,
} from '@cloudscape-design/components';
import { LoginForm } from '../components/auth/LoginForm';
import { SignUpForm } from '../components/auth/SignUpForm';
import { ConfirmSignUpForm } from '../components/auth/ConfirmSignUpForm';

type AuthMode = 'signin' | 'signup' | 'confirm';

export const AuthPage: React.FC = () => {
  const [mode, setMode] = useState<AuthMode>('signin');
  const [signUpEmail, setSignUpEmail] = useState('');

  const handleSignUpSuccess = (email: string) => {
    setSignUpEmail(email);
    setMode('confirm');
  };

  const handleConfirmSuccess = () => {
    setMode('signin');
  };

  const renderForm = () => {
    switch (mode) {
      case 'signin':
        return (
          <LoginForm onSignUpClick={() => setMode('signup')} />
        );
      case 'signup':
        return (
          <SignUpForm 
            onSignInClick={() => setMode('signin')}
            onSignUpSuccess={handleSignUpSuccess}
          />
        );
      case 'confirm':
        return (
          <ConfirmSignUpForm
            email={signUpEmail}
            onConfirmSuccess={handleConfirmSuccess}
            onBackClick={() => setMode('signup')}
          />
        );
    }
  };

  const getTitle = () => {
    switch (mode) {
      case 'signin':
        return 'Sign In';
      case 'signup':
        return 'Sign Up';
      case 'confirm':
        return 'Confirm Email';
    }
  };

  return (
    <Box padding="xxl">
      <SpaceBetween direction="vertical" size="l">
        <Container>
          <SpaceBetween direction="vertical" size="l">
            <Header variant="h1">{getTitle()}</Header>
            {renderForm()}
          </SpaceBetween>
        </Container>
      </SpaceBetween>
    </Box>
  );
};