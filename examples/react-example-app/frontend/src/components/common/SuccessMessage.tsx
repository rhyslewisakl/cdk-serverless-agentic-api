/**
 * Success message and confirmation components
 */

import React, { useState, useEffect } from 'react';
import {
  Alert,
  AlertTitle,
  Box,
  Snackbar,
  Slide,
  SlideProps,
  Fade,
  Grow,
  Collapse,
  IconButton,
  Typography,
} from '@mui/material';
import {
  CheckCircle,
  Close,
  TaskAlt,
  Celebration,
} from '@mui/icons-material';

interface SuccessMessageProps {
  message: string;
  title?: string;
  variant?: 'alert' | 'snackbar' | 'inline' | 'celebration';
  autoHide?: boolean;
  duration?: number;
  onClose?: () => void;
  action?: React.ReactNode;
  icon?: React.ReactNode;
  showAnimation?: boolean;
}

function SlideTransition(props: SlideProps) {
  return <Slide {...props} direction="up" />;
}

/**
 * Success message component with multiple display variants
 */
export const SuccessMessage: React.FC<SuccessMessageProps> = ({
  message,
  title = 'Success',
  variant = 'alert',
  autoHide = false,
  duration = 4000,
  onClose,
  action,
  icon,
  showAnimation = true,
}) => {
  const [open, setOpen] = useState(true);
  const [showCelebration, setShowCelebration] = useState(false);

  useEffect(() => {
    if (autoHide && duration > 0) {
      const timer = setTimeout(() => {
        handleClose();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [autoHide, duration]);

  useEffect(() => {
    if (variant === 'celebration' && showAnimation) {
      setShowCelebration(true);
      const timer = setTimeout(() => {
        setShowCelebration(false);
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [variant, showAnimation]);

  const handleClose = () => {
    setOpen(false);
    if (onClose) {
      // Delay callback to allow animation to complete
      setTimeout(onClose, 300);
    }
  };

  const defaultIcon = icon || <CheckCircle />;

  switch (variant) {
    case 'snackbar':
      return (
        <Snackbar
          open={open}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
          TransitionComponent={SlideTransition}
          onClose={handleClose}
        >
          <Alert
            severity="success"
            onClose={handleClose}
            action={action}
            icon={defaultIcon}
            sx={{ minWidth: 300 }}
          >
            <AlertTitle>{title}</AlertTitle>
            {message}
          </Alert>
        </Snackbar>
      );

    case 'inline':
      return (
        <Collapse in={open}>
          <Box sx={{ mb: 2 }}>
            <Alert
              severity="success"
              onClose={onClose ? handleClose : undefined}
              action={action}
              icon={defaultIcon}
            >
              <AlertTitle>{title}</AlertTitle>
              {message}
            </Alert>
          </Box>
        </Collapse>
      );

    case 'celebration':
      return (
        <Box sx={{ position: 'relative' }}>
          <Grow in={open}>
            <Alert
              severity="success"
              onClose={onClose ? handleClose : undefined}
              action={action}
              icon={<TaskAlt />}
              sx={{
                mb: 2,
                '& .MuiAlert-icon': {
                  fontSize: '2rem',
                },
              }}
            >
              <AlertTitle sx={{ fontSize: '1.2rem' }}>{title}</AlertTitle>
              <Typography variant="body1">{message}</Typography>
            </Alert>
          </Grow>

          {/* Celebration animation */}
          {showCelebration && (
            <Box
              sx={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                pointerEvents: 'none',
                zIndex: 1000,
              }}
            >
              <Fade in={showCelebration} timeout={500}>
                <Celebration
                  sx={{
                    fontSize: '4rem',
                    color: 'success.main',
                    animation: 'bounce 0.5s ease-in-out',
                    '@keyframes bounce': {
                      '0%, 20%, 53%, 80%, 100%': {
                        transform: 'translate3d(0,0,0)',
                      },
                      '40%, 43%': {
                        transform: 'translate3d(0, -30px, 0)',
                      },
                      '70%': {
                        transform: 'translate3d(0, -15px, 0)',
                      },
                      '90%': {
                        transform: 'translate3d(0, -4px, 0)',
                      },
                    },
                  }}
                />
              </Fade>
            </Box>
          )}
        </Box>
      );

    case 'alert':
    default:
      return (
        <Fade in={open}>
          <Box sx={{ mb: 2 }}>
            <Alert
              severity="success"
              onClose={onClose ? handleClose : undefined}
              action={action}
              icon={defaultIcon}
            >
              <AlertTitle>{title}</AlertTitle>
              {message}
            </Alert>
          </Box>
        </Fade>
      );
  }
};

/**
 * Quick success notification hook
 */
export const useSuccessMessage = () => {
  const [successState, setSuccessState] = useState<{
    show: boolean;
    message: string;
    title?: string;
    variant?: SuccessMessageProps['variant'];
  }>({
    show: false,
    message: '',
  });

  const showSuccess = (
    message: string,
    title?: string,
    variant?: SuccessMessageProps['variant']
  ) => {
    setSuccessState({
      show: true,
      message,
      title,
      variant,
    });
  };

  const hideSuccess = () => {
    setSuccessState(prev => ({ ...prev, show: false }));
  };

  const SuccessComponent = successState.show ? (
    <SuccessMessage
      message={successState.message}
      title={successState.title}
      variant={successState.variant}
      onClose={hideSuccess}
      autoHide
    />
  ) : null;

  return {
    showSuccess,
    hideSuccess,
    SuccessComponent,
    isShowing: successState.show,
  };
};

/**
 * Specialized success components for common use cases
 */

export const SaveSuccessMessage: React.FC<{ onClose?: () => void }> = ({ onClose }) => (
  <SuccessMessage
    message="Your changes have been saved successfully."
    title="Saved"
    variant="snackbar"
    autoHide
    onClose={onClose}
  />
);

export const CreateSuccessMessage: React.FC<{ itemName?: string; onClose?: () => void }> = ({ 
  itemName = 'item', 
  onClose 
}) => (
  <SuccessMessage
    message={`${itemName} has been created successfully.`}
    title="Created"
    variant="celebration"
    autoHide
    onClose={onClose}
  />
);

export const UpdateSuccessMessage: React.FC<{ itemName?: string; onClose?: () => void }> = ({ 
  itemName = 'item', 
  onClose 
}) => (
  <SuccessMessage
    message={`${itemName} has been updated successfully.`}
    title="Updated"
    variant="snackbar"
    autoHide
    onClose={onClose}
  />
);

export const DeleteSuccessMessage: React.FC<{ itemName?: string; onClose?: () => void }> = ({ 
  itemName = 'item', 
  onClose 
}) => (
  <SuccessMessage
    message={`${itemName} has been deleted successfully.`}
    title="Deleted"
    variant="snackbar"
    autoHide
    onClose={onClose}
  />
);

export default SuccessMessage;