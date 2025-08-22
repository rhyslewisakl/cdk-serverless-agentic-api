import React, { useState } from 'react';
import {
  Form,
  FormField,
  Input,
  Button,
  SpaceBetween,
  Alert,
} from '@cloudscape-design/components';
import { useAppDispatch, useAppSelector } from '../../hooks/redux';
import { signUpAsync, clearError } from '../../store/authSlice';

interface SignUpFormProps {
  onSignInClick: () => void;
  onSignUpSuccess: (email: string) => void;
}

export const SignUpForm: React.FC<SignUpFormProps> = ({ onSignInClick, onSignUpSuccess }) => {
  const dispatch = useAppDispatch();
  const { isLoading, error } = useAppSelector((state) => state.auth);
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      return;
    }
    
    dispatch(clearError());
    const result = await dispatch(signUpAsync({ email, password }));
    
    if (signUpAsync.fulfilled.match(result)) {
      onSignUpSuccess(email);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <Form
        actions={
          <SpaceBetween direction="vertical" size="xs">
            <Button variant="primary" loading={isLoading} formAction="submit">
              Sign Up
            </Button>
            <Button variant="link" onClick={onSignInClick}>
              Already have an account? Sign in
            </Button>
          </SpaceBetween>
        }
        errorText={error}
      >
        <SpaceBetween direction="vertical" size="l">
          {error && (
            <Alert type="error" dismissible onDismiss={() => dispatch(clearError())}>
              {error}
            </Alert>
          )}
          
          <FormField label="Email">
            <Input
              value={email}
              onChange={({ detail }) => setEmail(detail.value)}
              type="email"
            />
          </FormField>
          
          <FormField label="Password">
            <Input
              value={password}
              onChange={({ detail }) => setPassword(detail.value)}
              type="password"
            />
          </FormField>
          
          <FormField 
            label="Confirm Password"
            errorText={password !== confirmPassword ? 'Passwords do not match' : ''}
          >
            <Input
              value={confirmPassword}
              onChange={({ detail }) => setConfirmPassword(detail.value)}
              type="password"
            />
          </FormField>
        </SpaceBetween>
      </Form>
    </form>
  );
};