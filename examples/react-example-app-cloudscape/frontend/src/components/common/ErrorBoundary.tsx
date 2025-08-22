import { Component, type ErrorInfo, type ReactNode } from 'react';
import { Container, Box, Button, Alert } from '@cloudscape-design/components';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error boundary caught an error:', error, errorInfo);
  }

  private handleReload = () => {
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <Container>
          <Box padding="xxl" textAlign="center">
            <Alert type="error" header="Something went wrong">
              <Box variant="p">
                An unexpected error occurred. Please try refreshing the page.
              </Box>
              <Box margin={{ top: 'm' }}>
                <Button variant="primary" onClick={this.handleReload}>
                  Refresh Page
                </Button>
              </Box>
            </Alert>
          </Box>
        </Container>
      );
    }

    return this.props.children;
  }
}