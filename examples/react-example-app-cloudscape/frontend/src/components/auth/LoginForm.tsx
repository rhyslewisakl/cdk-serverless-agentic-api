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
import { signInAsync, clearError } from '../../store/authSlice';

interface LoginFormProps {
  onSignUpClick: () => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({ onSignUpClick }) => {
  const dispatch = useAppDispatch();
  const { isLoading, error } = useAppSelector((state) => state.auth);
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    dispatch(clearError());
    dispatch(signInAsync({ email, password }));
  };

  return (
    <form onSubmit={handleSubmit}>
      <Form
        actions={
          <SpaceBetween direction="vertical" size="xs">
            <Button variant="primary" loading={isLoading} formAction="submit">
              Sign In
            </Button>
            <Button variant="link" onClick={onSignUpClick}>
              Don't have an account? Sign up
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
        </SpaceBetween>
      </Form>
    </form>
  );
};