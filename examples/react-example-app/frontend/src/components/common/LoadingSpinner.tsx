/**
 * Enhanced loading spinner component with multiple variants
 */

import React from 'react';
import {
  CircularProgress,
  LinearProgress,
  Box,
  Typography,
  Fade,
  Card,
  CardContent,
} from '@mui/material';

interface LoadingSpinnerProps {
  message?: string;
  size?: number;
  variant?: 'circular' | 'linear' | 'dots' | 'card';
  color?: 'primary' | 'secondary' | 'inherit';
  progress?: number;
  showProgress?: boolean;
  fullScreen?: boolean;
  overlay?: boolean;
  delay?: number;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  message = 'Loading...',
  size = 40,
  variant = 'circular',
  color = 'primary',
  progress,
  showProgress = false,
  fullScreen = false,
  overlay = false,
  delay = 0,
}) => {
  const [show, setShow] = React.useState(delay === 0);

  React.useEffect(() => {
    if (delay > 0) {
      const timer = setTimeout(() => setShow(true), delay);
      return () => clearTimeout(timer);
    }
  }, [delay]);

  const renderSpinner = () => {
    switch (variant) {
      case 'linear':
        return (
          <Box sx={{ width: '100%', maxWidth: 400 }}>
            <LinearProgress
              variant={progress !== undefined ? 'determinate' : 'indeterminate'}
              value={progress}
              color={color}
            />
            {showProgress && progress !== undefined && (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1, textAlign: 'center' }}>
                {Math.round(progress)}%
              </Typography>
            )}
          </Box>
        );

      case 'dots':
        return (
          <Box sx={{ display: 'flex', gap: 1 }}>
            {[0, 1, 2].map((index) => (
              <Box
                key={index}
                sx={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  backgroundColor: `${color}.main`,
                  animation: `dotPulse 1.4s ease-in-out ${index * 0.16}s infinite both`,
                  '@keyframes dotPulse': {
                    '0%, 80%, 100%': {
                      transform: 'scale(0)',
                    },
                    '40%': {
                      transform: 'scale(1)',
                    },
                  },
                }}
              />
            ))}
          </Box>
        );

      case 'card':
        return (
          <Card sx={{ minWidth: 200 }}>
            <CardContent sx={{ textAlign: 'center', py: 3 }}>
              <CircularProgress
                size={size}
                color={color}
                variant={progress !== undefined ? 'determinate' : 'indeterminate'}
                value={progress}
              />
              {message && (
                <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                  {message}
                </Typography>
              )}
              {showProgress && progress !== undefined && (
                <Typography variant="h6" color="primary" sx={{ mt: 1 }}>
                  {Math.round(progress)}%
                </Typography>
              )}
            </CardContent>
          </Card>
        );

      case 'circular':
      default:
        return (
          <CircularProgress
            size={size}
            color={color}
            variant={progress !== undefined ? 'determinate' : 'indeterminate'}
            value={progress}
          />
        );
    }
  };

  const content = (
    <Box
      display="flex"
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      p={variant === 'card' ? 0 : 3}
      data-testid="loading-spinner"
      sx={{
        ...(fullScreen && {
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: overlay ? 'rgba(255, 255, 255, 0.8)' : 'transparent',
          zIndex: 9999,
        }),
      }}
    >
      {renderSpinner()}
      
      {variant !== 'card' && message && (
        <Typography variant="body2" color="text.secondary" sx={{ mt: 2, textAlign: 'center' }}>
          {message}
        </Typography>
      )}
      
      {variant !== 'card' && showProgress && progress !== undefined && (
        <Typography variant="body1" color="primary" sx={{ mt: 1 }}>
          {Math.round(progress)}%
        </Typography>
      )}
    </Box>
  );

  if (!show) {
    return null;
  }

  return delay > 0 ? (
    <Fade in={show} timeout={300}>
      <div>{content}</div>
    </Fade>
  ) : (
    content
  );
};

/**
 * Specialized loading components for common use cases
 */

export const ButtonLoadingSpinner: React.FC<{ size?: number }> = ({ size = 20 }) => (
  <CircularProgress size={size} color="inherit" />
);

export const PageLoadingSpinner: React.FC<{ message?: string }> = ({ 
  message = 'Loading page...' 
}) => (
  <LoadingSpinner
    message={message}
    size={60}
    variant="card"
    fullScreen
    overlay
    delay={300}
  />
);

export const InlineLoadingSpinner: React.FC<{ message?: string }> = ({ 
  message = 'Loading...' 
}) => (
  <LoadingSpinner
    message={message}
    size={24}
    variant="dots"
  />
);

export const ProgressLoadingSpinner: React.FC<{ 
  progress: number; 
  message?: string; 
}> = ({ progress, message = 'Processing...' }) => (
  <LoadingSpinner
    message={message}
    progress={progress}
    showProgress
    variant="card"
  />
);

export default LoadingSpinner;