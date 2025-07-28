/**
 * Error message component
 */

import React from 'react';
import { Alert, AlertTitle, Box } from '@mui/material';

interface ErrorMessageProps {
  error: string;
  title?: string;
  severity?: 'error' | 'warning' | 'info';
  onClose?: () => void;
}

export const ErrorMessage: React.FC<ErrorMessageProps> = ({
  error,
  title = 'Error',
  severity = 'error',
  onClose,
}) => {
  return (
    <Box sx={{ mb: 2 }}>
      <Alert severity={severity} onClose={onClose}>
        <AlertTitle>{title}</AlertTitle>
        {error}
      </Alert>
    </Box>
  );
};

export default ErrorMessage;