/**
 * Tests for ToastContext
 */

import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ToastProvider, useToast } from '../ToastContext';

// Test component that uses the toast context
const TestComponent: React.FC = () => {
  const { showToast, showError, showSuccess, showWarning, showInfo, clearAllToasts } = useToast();

  return (
    <div>
      <button onClick={() => showToast('Test message', 'info')}>Show Toast</button>
      <button onClick={() => showError('Error message')}>Show Error</button>
      <button onClick={() => showSuccess('Success message')}>Show Success</button>
      <button onClick={() => showWarning('Warning message')}>Show Warning</button>
      <button onClick={() => showInfo('Info message')}>Show Info</button>
      <button onClick={clearAllToasts}>Clear All</button>
    </div>
  );
};

describe('ToastContext', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
    jest.clearAllMocks();
  });

  it('throws error when used outside provider', () => {
    // Suppress console.error for this test
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => {
      render(<TestComponent />);
    }).toThrow('useToast must be used within a ToastProvider');

    consoleSpy.mockRestore();
  });

  it('shows toast message when showToast is called', () => {
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    );

    const showToastButton = screen.getByText('Show Toast');
    fireEvent.click(showToastButton);

    expect(screen.getByText('Test message')).toBeInTheDocument();
  });

  it('shows error toast with correct styling', () => {
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    );

    const showErrorButton = screen.getByText('Show Error');
    fireEvent.click(showErrorButton);

    expect(screen.getByText('Error message')).toBeInTheDocument();
    
    // Check that the alert has error severity
    const alert = screen.getByRole('alert');
    expect(alert).toHaveClass('MuiAlert-standardError');
  });

  it('shows success toast with correct styling', () => {
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    );

    const showSuccessButton = screen.getByText('Show Success');
    fireEvent.click(showSuccessButton);

    expect(screen.getByText('Success message')).toBeInTheDocument();
    
    // Check that the alert has success severity
    const alert = screen.getByRole('alert');
    expect(alert).toHaveClass('MuiAlert-standardSuccess');
  });

  it('shows warning toast with correct styling', () => {
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    );

    const showWarningButton = screen.getByText('Show Warning');
    fireEvent.click(showWarningButton);

    expect(screen.getByText('Warning message')).toBeInTheDocument();
    
    // Check that the alert has warning severity
    const alert = screen.getByRole('alert');
    expect(alert).toHaveClass('MuiAlert-standardWarning');
  });

  it('shows info toast with correct styling', () => {
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    );

    const showInfoButton = screen.getByText('Show Info');
    fireEvent.click(showInfoButton);

    expect(screen.getByText('Info message')).toBeInTheDocument();
    
    // Check that the alert has info severity
    const alert = screen.getByRole('alert');
    expect(alert).toHaveClass('MuiAlert-standardInfo');
  });

  it('auto-hides toast after specified duration', () => {
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    );

    const showToastButton = screen.getByText('Show Toast');
    fireEvent.click(showToastButton);

    expect(screen.getByText('Test message')).toBeInTheDocument();

    // Fast-forward time by 6 seconds (default duration)
    act(() => {
      jest.advanceTimersByTime(6000);
    });

    expect(screen.queryByText('Test message')).not.toBeInTheDocument();
  });

  it('allows manual dismissal of toast', () => {
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    );

    const showToastButton = screen.getByText('Show Toast');
    fireEvent.click(showToastButton);

    expect(screen.getByText('Test message')).toBeInTheDocument();

    // Find and click the close button
    const closeButton = screen.getByLabelText('Close');
    fireEvent.click(closeButton);

    expect(screen.queryByText('Test message')).not.toBeInTheDocument();
  });

  it('clears all toasts when clearAllToasts is called', () => {
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    );

    // Show multiple toasts
    fireEvent.click(screen.getByText('Show Error'));
    fireEvent.click(screen.getByText('Show Success'));
    fireEvent.click(screen.getByText('Show Warning'));

    expect(screen.getByText('Error message')).toBeInTheDocument();
    expect(screen.getByText('Success message')).toBeInTheDocument();
    expect(screen.getByText('Warning message')).toBeInTheDocument();

    // Clear all toasts
    fireEvent.click(screen.getByText('Clear All'));

    expect(screen.queryByText('Error message')).not.toBeInTheDocument();
    expect(screen.queryByText('Success message')).not.toBeInTheDocument();
    expect(screen.queryByText('Warning message')).not.toBeInTheDocument();
  });

  it('limits number of toasts based on maxToasts prop', () => {
    render(
      <ToastProvider maxToasts={2}>
        <TestComponent />
      </ToastProvider>
    );

    // Show 3 toasts
    fireEvent.click(screen.getByText('Show Error'));
    fireEvent.click(screen.getByText('Show Success'));
    fireEvent.click(screen.getByText('Show Warning'));

    // Only the last 2 should be visible
    expect(screen.queryByText('Error message')).not.toBeInTheDocument();
    expect(screen.getByText('Success message')).toBeInTheDocument();
    expect(screen.getByText('Warning message')).toBeInTheDocument();
  });

  it('stacks multiple toasts vertically', () => {
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    );

    // Show multiple toasts
    fireEvent.click(screen.getByText('Show Error'));
    fireEvent.click(screen.getByText('Show Success'));

    const snackbars = screen.getAllByRole('presentation');
    expect(snackbars).toHaveLength(2);

    // Check that they have different bottom positions
    const firstSnackbar = snackbars[0];
    const secondSnackbar = snackbars[1];

    expect(firstSnackbar).toHaveStyle('bottom: 16px');
    expect(secondSnackbar).toHaveStyle('bottom: 86px');
  });
});