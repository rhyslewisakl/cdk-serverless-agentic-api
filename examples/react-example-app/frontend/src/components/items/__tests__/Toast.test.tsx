/**
 * Toast component tests
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Toast } from '../Toast';

describe('Toast', () => {
  const mockOnClose = jest.fn();

  const defaultProps = {
    id: '1',
    type: 'success' as const,
    message: 'Test message',
    onClose: mockOnClose,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('renders toast message', () => {
    render(<Toast {...defaultProps} />);
    expect(screen.getByText('Test message')).toBeInTheDocument();
  });

  it('renders success toast with correct styling', () => {
    const { container } = render(<Toast {...defaultProps} type="success" />);
    
    const toast = container.querySelector('.bg-green-50');
    expect(toast).toBeInTheDocument();
    expect(toast).toHaveClass('border-green-400', 'text-green-800');
  });

  it('renders error toast with correct styling', () => {
    const { container } = render(<Toast {...defaultProps} type="error" />);
    
    const toast = container.querySelector('.bg-red-50');
    expect(toast).toBeInTheDocument();
    expect(toast).toHaveClass('border-red-400', 'text-red-800');
  });

  it('renders warning toast with correct styling', () => {
    const { container } = render(<Toast {...defaultProps} type="warning" />);
    
    const toast = container.querySelector('.bg-yellow-50');
    expect(toast).toBeInTheDocument();
    expect(toast).toHaveClass('border-yellow-400', 'text-yellow-800');
  });

  it('renders info toast with correct styling', () => {
    const { container } = render(<Toast {...defaultProps} type="info" />);
    
    const toast = container.querySelector('.bg-blue-50');
    expect(toast).toBeInTheDocument();
    expect(toast).toHaveClass('border-blue-400', 'text-blue-800');
  });

  it('calls onClose when close button is clicked', () => {
    render(<Toast {...defaultProps} />);
    
    const closeButton = screen.getByRole('button');
    fireEvent.click(closeButton);
    
    // Should start fade out animation
    jest.advanceTimersByTime(300);
    
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('auto-closes after specified duration', () => {
    render(<Toast {...defaultProps} duration={3000} />);
    
    // Fast-forward time
    jest.advanceTimersByTime(3000);
    
    // Should start fade out animation
    jest.advanceTimersByTime(300);
    
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('auto-closes after default duration when not specified', () => {
    render(<Toast {...defaultProps} />);
    
    // Fast-forward default duration (5000ms)
    jest.advanceTimersByTime(5000);
    
    // Should start fade out animation
    jest.advanceTimersByTime(300);
    
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('shows correct icon for success type', () => {
    const { container } = render(<Toast {...defaultProps} type="success" />);
    
    const icon = container.querySelector('.text-green-400');
    expect(icon).toBeInTheDocument();
  });

  it('shows correct icon for error type', () => {
    const { container } = render(<Toast {...defaultProps} type="error" />);
    
    const icon = container.querySelector('.text-red-400');
    expect(icon).toBeInTheDocument();
  });

  it('shows correct icon for warning type', () => {
    const { container } = render(<Toast {...defaultProps} type="warning" />);
    
    const icon = container.querySelector('.text-yellow-400');
    expect(icon).toBeInTheDocument();
  });

  it('shows correct icon for info type', () => {
    const { container } = render(<Toast {...defaultProps} type="info" />);
    
    const icon = container.querySelector('.text-blue-400');
    expect(icon).toBeInTheDocument();
  });

  it('starts with fade-in animation', () => {
    render(<Toast {...defaultProps} />);
    
    // Initially should be visible (after useEffect runs)
    const toast = screen.getByText('Test message').closest('div');
    
    // Should not have translate-x-full class after animation starts
    waitFor(() => {
      expect(toast).not.toHaveClass('translate-x-full');
    });
  });
});