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
import { confirmSignUpAsync, clearError } from '../../store/authSlice';

interface ConfirmSignUpFormProps {
  email: string;
  onConfirmSuccess: () => void;
  onBackClick: () => void;
}

export const ConfirmSignUpForm: React.FC<ConfirmSignUpFormProps> = ({ 
  email, 
  onConfirmSuccess, 
  onBackClick 
}) => {
  const dispatch = useAppDispatch();
  const { isLoading, error } = useAppSelector((state) => state.auth);
  
  const [confirmationCode, setConfirmationCode] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    dispatch(clearError());
    const result = await dispatch(confirmSignUpAsync({ email, confirmationCode }));
    
    if (confirmSignUpAsync.fulfilled.match(result)) {
      onConfirmSuccess();
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <Form
        actions={
          <SpaceBetween direction="vertical" size="xs">
            <Button variant="primary" loading={isLoading} formAction="submit">
              Confirm
            </Button>
            <Button variant="link" onClick={onBackClick}>
              Back to sign up
            </Button>
          </SpaceBetween>
        }
        errorText={error}
      >
        <SpaceBetween direction="vertical" size="l">
          <Alert type="info">
            We've sent a confirmation code to {email}. Please check your email and enter the code below.
          </Alert>
          
          {error && (
            <Alert type="error" dismissible onDismiss={() => dispatch(clearError())}>
              {error}
            </Alert>
          )}
          
          <FormField label="Confirmation Code">
            <Input
              value={confirmationCode}
              onChange={({ detail }) => setConfirmationCode(detail.value)}
              placeholder="Enter 6-digit code"
            />
          </FormField>
        </SpaceBetween>
      </Form>
    </form>
  );
};