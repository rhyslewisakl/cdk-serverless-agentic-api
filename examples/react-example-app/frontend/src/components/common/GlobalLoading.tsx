/**
 * Global loading component for application-wide loading states
 */

import React from 'react';
import {
  Backdrop,
  CircularProgress,
  Box,
  Typography,
  Fade,
} from '@mui/material';

interface GlobalLoadingProps {
  open: boolean;
  message?: string;
  backdrop?: boolean;
}

/**
 * Global loading component that can be used for application-wide loading states
 */
export const GlobalLoading: React.FC<GlobalLoadingProps> = ({
  open,
  message = 'Loading...',
  backdrop = true,
}) => {
  if (backdrop) {
    return (
      <Backdrop
        sx={{
          color: '#fff',
          zIndex: (theme) => theme.zIndex.drawer + 1,
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
        }}
        open={open}
      >
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 2,
          }}
        >
          <CircularProgress color="inherit" size={60} />
          <Fade in={open} timeout={500}>
            <Typography variant="h6" component="div">
              {message}
            </Typography>
          </Fade>
        </Box>
      </Backdrop>
    );
  }

  return (
    <Fade in={open} timeout={300}>
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '200px',
          gap: 2,
        }}
      >
        <CircularProgress size={40} />
        <Typography variant="body1" color="text.secondary">
          {message}
        </Typography>
      </Box>
    </Fade>
  );
};

export default GlobalLoading;