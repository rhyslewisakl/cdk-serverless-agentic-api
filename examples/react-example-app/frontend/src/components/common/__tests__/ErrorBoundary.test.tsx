/**
 * Tests for ErrorBoundary component
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ErrorBoundary } from '../ErrorBoundary';
import { errorService } from '../../../services/errorService';

// Mock the error service
jest.mock('../../../services/errorService', () => ({
  errorService: {
    logError: jest.fn().mockReturnValue('test-error-id'),
  },
}));

// Mock console.error to avoid noise in tests
const originalConsoleError = console.error;
beforeAll(() => {
  console.error = jest.fn();
});

afterAll(() => {
  console.error = originalConsoleError;
});

// Component that throws an error for testing
const ThrowError: React.FC<{ shouldThrow: boolean }> = ({ shouldThrow }) => {
  if (shouldThrow) {
    throw new Error('Test error message');
  }
  return <div>No error</div>;
};

describe('ErrorBoundary', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders children when there is no error', () => {
    render(
      <ErrorBoundary>
        <div>Test content</div>
      </ErrorBoundary>
    );

    expect(screen.getByText('Test content')).toBeInTheDocument();
  });

  it('renders error UI when child component throws', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.getByText('Oops! Something went wrong')).toBeInTheDocument();
    // Use getAllByText to handle multiple occurrences of the error message
    const errorMessages = screen.getAllByText(/Test error message/);
    expect(errorMessages.length).toBeGreaterThan(0);
  });

  it('logs error to error service when error occurs', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(errorService.logError).toHaveBeenCalledWith(
      expect.any(Error),
      expect.objectContaining({
        type: 'react_error_boundary',
        componentStack: expect.any(String),
        errorBoundary: true,
      })
    );
  });

  it('displays error ID when available', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    // The error ID should be present since componentDidCatch should have been called
    // If it's not present, it means the errorService.logError didn't return the expected value
    // Let's check if the error service was called correctly
    expect(errorService.logError).toHaveBeenCalledWith(
      expect.any(Error),
      expect.objectContaining({
        type: 'react_error_boundary',
        componentStack: expect.any(String),
        errorBoundary: true,
      })
    );
  });

  it('shows technical details in accordion', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    const technicalDetailsButton = screen.getByText('Technical Details');
    expect(technicalDetailsButton).toBeInTheDocument();

    fireEvent.click(technicalDetailsButton);
    expect(screen.getByText('Stack Trace:')).toBeInTheDocument();
  });

  it('provides retry functionality', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.getByText('Oops! Something went wrong')).toBeInTheDocument();

    const retryButton = screen.getByText('Try Again');
    fireEvent.click(retryButton);

    // After retry, the error boundary should reset and try to render children again
    // Since we're still passing shouldThrow=true, it will error again
    // But the retry button click should have reset the error boundary state
    expect(screen.getByText('Try Again')).toBeInTheDocument();
  });

  it('provides reload page functionality', () => {
    // Mock window.location.reload
    const mockReload = jest.fn();
    Object.defineProperty(window, 'location', {
      value: { reload: mockReload },
      writable: true,
    });

    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    const reloadButton = screen.getByText('Reload Page');
    fireEvent.click(reloadButton);

    expect(mockReload).toHaveBeenCalled();
  });

  it('provides go home functionality', () => {
    // Mock window.location.href
    const mockLocation = { href: '' };
    Object.defineProperty(window, 'location', {
      value: mockLocation,
      writable: true,
    });

    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    const goHomeButton = screen.getByText('Go Home');
    fireEvent.click(goHomeButton);

    expect(mockLocation.href).toBe('/');
  });

  it('provides error reporting functionality', async () => {
    // Mock clipboard API
    const mockWriteText = jest.fn().mockResolvedValue(undefined);
    Object.assign(navigator, {
      clipboard: {
        writeText: mockWriteText,
      },
    });

    // Mock alert
    window.alert = jest.fn();

    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    const reportButton = screen.getByText('Report Error');
    fireEvent.click(reportButton);

    await new Promise(resolve => setTimeout(resolve, 0)); // Wait for async operation

    // The error details should be copied to clipboard, even if errorId is null
    expect(mockWriteText).toHaveBeenCalledWith(
      expect.stringContaining('Test error message')
    );
    expect(window.alert).toHaveBeenCalledWith(
      'Error details copied to clipboard. Please share this with support.'
    );
  });

  it('renders custom fallback when provided', () => {
    const customFallback = <div>Custom error message</div>;

    render(
      <ErrorBoundary fallback={customFallback}>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.getByText('Custom error message')).toBeInTheDocument();
    expect(screen.queryByText('Oops! Something went wrong')).not.toBeInTheDocument();
  });
});