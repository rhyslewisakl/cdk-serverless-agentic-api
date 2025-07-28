/**
 * Global error boundary component for unhandled errors
 */

import React, { Component, ErrorInfo, ReactNode } from 'react';
import {
  Box,
  Typography,
  Button,
  Paper,
  Alert,
  AlertTitle,
  Container,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';
import {
  ErrorOutline,
  Refresh,
  Home,
  ExpandMore,
  BugReport,
} from '@mui/icons-material';
import { errorService } from '../../services/errorService';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorId: string | null;
}

/**
 * Global error boundary that catches unhandled errors and displays a fallback UI
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    // Update state so the next render will show the fallback UI
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log the error to console and error reporting service
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    // Log error with context information
    const errorId = errorService.logError(error, {
      type: 'react_error_boundary',
      componentStack: errorInfo.componentStack,
      errorBoundary: true,
    });
    
    this.setState({
      error,
      errorInfo,
      errorId,
    });
  }

  handleReload = () => {
    // Reload the page to recover from the error
    window.location.reload();
  };

  handleGoHome = () => {
    // Navigate to home page
    window.location.href = '/';
  };

  handleRetry = () => {
    // Reset the error boundary state to retry rendering
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
    });
  };

  handleReportError = () => {
    // Copy error details to clipboard for reporting
    const errorDetails = {
      errorId: this.state.errorId,
      message: this.state.error?.message,
      stack: this.state.error?.stack,
      componentStack: this.state.errorInfo?.componentStack,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
    };

    navigator.clipboard.writeText(JSON.stringify(errorDetails, null, 2))
      .then(() => {
        alert('Error details copied to clipboard. Please share this with support.');
      })
      .catch(() => {
        // Fallback: show error details in a new window
        const newWindow = window.open('', '_blank');
        if (newWindow) {
          newWindow.document.write(`<pre>${JSON.stringify(errorDetails, null, 2)}</pre>`);
        }
      });
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default fallback UI
      return (
        <Container maxWidth="md" sx={{ py: 8 }}>
          <Paper
            elevation={3}
            sx={{
              p: 4,
              textAlign: 'center',
              borderRadius: 2,
            }}
          >
            <Box sx={{ mb: 3 }}>
              <ErrorOutline
                color="error"
                sx={{ fontSize: 64, mb: 2 }}
              />
              <Typography variant="h4" component="h1" gutterBottom>
                Oops! Something went wrong
              </Typography>
              <Typography variant="body1" color="text.secondary" paragraph>
                We're sorry, but something unexpected happened. The application has encountered an error.
              </Typography>
            </Box>

            <Alert severity="error" sx={{ mb: 3, textAlign: 'left' }}>
              <AlertTitle>Error Details</AlertTitle>
              <Typography variant="body2" component="div" sx={{ mb: 1 }}>
                <strong>Error:</strong> {this.state.error?.message || 'Unknown error'}
              </Typography>
              {this.state.errorId && (
                <Typography variant="body2" component="div" sx={{ mb: 1 }}>
                  <strong>Error ID:</strong> {this.state.errorId}
                </Typography>
              )}
              
              <Accordion sx={{ mt: 2 }}>
                <AccordionSummary expandIcon={<ExpandMore />}>
                  <Typography variant="body2">Technical Details</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  {this.state.error?.stack && (
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" component="div" sx={{ mb: 1 }}>
                        <strong>Stack Trace:</strong>
                      </Typography>
                      <Box
                        component="pre"
                        sx={{
                          fontSize: '0.75rem',
                          backgroundColor: 'grey.100',
                          p: 1,
                          borderRadius: 1,
                          overflow: 'auto',
                          maxHeight: 200,
                        }}
                      >
                        {this.state.error.stack}
                      </Box>
                    </Box>
                  )}
                  
                  {this.state.errorInfo?.componentStack && (
                    <Box>
                      <Typography variant="body2" component="div" sx={{ mb: 1 }}>
                        <strong>Component Stack:</strong>
                      </Typography>
                      <Box
                        component="pre"
                        sx={{
                          fontSize: '0.75rem',
                          backgroundColor: 'grey.100',
                          p: 1,
                          borderRadius: 1,
                          overflow: 'auto',
                          maxHeight: 200,
                        }}
                      >
                        {this.state.errorInfo.componentStack}
                      </Box>
                    </Box>
                  )}
                </AccordionDetails>
              </Accordion>
            </Alert>

            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
              <Button
                variant="contained"
                color="primary"
                startIcon={<Refresh />}
                onClick={this.handleRetry}
              >
                Try Again
              </Button>
              <Button
                variant="outlined"
                color="primary"
                startIcon={<Refresh />}
                onClick={this.handleReload}
              >
                Reload Page
              </Button>
              <Button
                variant="outlined"
                color="secondary"
                startIcon={<Home />}
                onClick={this.handleGoHome}
              >
                Go Home
              </Button>
              <Button
                variant="outlined"
                color="warning"
                startIcon={<BugReport />}
                onClick={this.handleReportError}
              >
                Report Error
              </Button>
            </Box>

            <Box sx={{ mt: 3, pt: 2, borderTop: '1px solid', borderColor: 'divider' }}>
              <Typography variant="body2" color="text.secondary">
                If this problem persists, please contact support with the error details above.
              </Typography>
            </Box>
          </Paper>
        </Container>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;