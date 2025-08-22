import React from 'react';
import { Spinner, Box } from '@cloudscape-design/components';

interface LoadingSpinnerProps {
  size?: 'normal' | 'large';
  text?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  size = 'normal', 
  text = 'Loading...' 
}) => {
  return (
    <Box textAlign="center" padding="l">
      <Spinner size={size} />
      {text && (
        <Box variant="p" color="text-status-inactive" margin={{ top: 's' }}>
          {text}
        </Box>
      )}
    </Box>
  );
};