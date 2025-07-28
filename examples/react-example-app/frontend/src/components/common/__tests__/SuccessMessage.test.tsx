/**
 * Tests for SuccessMessage component
 */

import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { 
  SuccessMessage, 
  SaveSuccessMessage, 
  CreateSuccessMessage, 
  UpdateSuccessMessage, 
  DeleteSuccessMessage,
  useSuccessMessage 
} from '../SuccessMessage';

// Test component for useSuccessMessage hook
const SuccessMessageHookTestComponent: React.FC = () => {
  const { showSuccess, hideSuccess, SuccessComponent, isShowing } = useSuccessMessage();

  return (
    <div>
      <div data-testid="is-showing">{isShowing.toString()}</div>
      
      <button onClick={() => showSuccess('Test success message')}>
        Show Success
      </button>
      <button onClick={() => showSuccess('Custom title message', 'Custom Title')}>
        Show Custom
      </button>
      <button onClick={() => showSuccess('Celebration message', 'Celebration', 'celebration')}>
        Show Celebration
      </button>
      <button onClick={hideSuccess}>
        Hide Success
      </button>
      
      {SuccessComponent}
    </div>
  );
};

describe('SuccessMessage', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  it('renders alert variant by default', () => {
    render(<SuccessMessage message="Test message" />);
    
    expect(screen.getByText('Success')).toBeInTheDocument();
    expect(screen.getByText('Test message')).toBeInTheDocument();
    expect(screen.getByRole('alert')).toHaveClass('MuiAlert-standardSuccess');
  });

  it('renders with custom title', () => {
    render(<SuccessMessage message="Test message" title="Custom Title" />);
    
    expect(screen.getByText('Custom Title')).toBeInTheDocument();
    expect(screen.getByText('Test message')).toBeInTheDocument();
  });

  it('renders snackbar variant', () => {
    render(<SuccessMessage message="Test message" variant="snackbar" />);
    
    // Snackbar should be in a presentation role container
    expect(screen.getByRole('presentation')).toBeInTheDocument();
    expect(screen.getByText('Test message')).toBeInTheDocument();
  });

  it('renders inline variant', () => {
    render(<SuccessMessage message="Test message" variant="inline" />);
    
    expect(screen.getByText('Test message')).toBeInTheDocument();
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });

  it('renders celebration variant with animation', () => {
    render(<SuccessMessage message="Test message" variant="celebration" showAnimation={true} />);
    
    expect(screen.getByText('Test message')).toBeInTheDocument();
    // Should have celebration icon
    expect(screen.getByTestId('CelebrationIcon')).toBeInTheDocument();
  });

  it('auto-hides after specified duration', () => {
    const onClose = jest.fn();
    
    render(
      <SuccessMessage 
        message="Test message" 
        autoHide={true} 
        duration={2000} 
        onClose={onClose} 
      />
    );
    
    expect(screen.getByText('Test message')).toBeInTheDocument();
    
    // Fast-forward time
    act(() => {
      jest.advanceTimersByTime(2000);
    });
    
    // onClose should be called after a delay for animation
    act(() => {
      jest.advanceTimersByTime(300);
    });
    
    expect(onClose).toHaveBeenCalled();
  });

  it('calls onClose when close button is clicked', () => {
    const onClose = jest.fn();
    
    render(<SuccessMessage message="Test message" onClose={onClose} />);
    
    const closeButton = screen.getByLabelText('Close');
    fireEvent.click(closeButton);
    
    // onClose should be called after animation delay
    act(() => {
      jest.advanceTimersByTime(300);
    });
    
    expect(onClose).toHaveBeenCalled();
  });

  it('renders custom icon', () => {
    const customIcon = <div data-testid="custom-icon">Custom</div>;
    
    render(<SuccessMessage message="Test message" icon={customIcon} />);
    
    expect(screen.getByTestId('custom-icon')).toBeInTheDocument();
  });

  it('renders custom action', () => {
    const customAction = <button>Custom Action</button>;
    
    render(<SuccessMessage message="Test message" action={customAction} />);
    
    expect(screen.getByText('Custom Action')).toBeInTheDocument();
  });

  it('does not auto-hide when duration is 0', () => {
    const onClose = jest.fn();
    
    render(
      <SuccessMessage 
        message="Test message" 
        autoHide={true} 
        duration={0} 
        onClose={onClose} 
      />
    );
    
    // Fast-forward time
    act(() => {
      jest.advanceTimersByTime(5000);
    });
    
    expect(onClose).not.toHaveBeenCalled();
  });
});

describe('Specialized Success Components', () => {
  it('renders SaveSuccessMessage', () => {
    render(<SaveSuccessMessage />);
    
    expect(screen.getByText('Saved')).toBeInTheDocument();
    expect(screen.getByText('Your changes have been saved successfully.')).toBeInTheDocument();
  });

  it('renders CreateSuccessMessage with default item name', () => {
    render(<CreateSuccessMessage />);
    
    expect(screen.getByText('Created')).toBeInTheDocument();
    expect(screen.getByText('item has been created successfully.')).toBeInTheDocument();
  });

  it('renders CreateSuccessMessage with custom item name', () => {
    render(<CreateSuccessMessage itemName="User" />);
    
    expect(screen.getByText('User has been created successfully.')).toBeInTheDocument();
  });

  it('renders UpdateSuccessMessage with default item name', () => {
    render(<UpdateSuccessMessage />);
    
    expect(screen.getByText('Updated')).toBeInTheDocument();
    expect(screen.getByText('item has been updated successfully.')).toBeInTheDocument();
  });

  it('renders UpdateSuccessMessage with custom item name', () => {
    render(<UpdateSuccessMessage itemName="Profile" />);
    
    expect(screen.getByText('Profile has been updated successfully.')).toBeInTheDocument();
  });

  it('renders DeleteSuccessMessage with default item name', () => {
    render(<DeleteSuccessMessage />);
    
    expect(screen.getByText('Deleted')).toBeInTheDocument();
    expect(screen.getByText('item has been deleted successfully.')).toBeInTheDocument();
  });

  it('renders DeleteSuccessMessage with custom item name', () => {
    render(<DeleteSuccessMessage itemName="Document" />);
    
    expect(screen.getByText('Document has been deleted successfully.')).toBeInTheDocument();
  });

  it('calls onClose for specialized components', () => {
    const onClose = jest.fn();
    
    render(<SaveSuccessMessage onClose={onClose} />);
    
    // Auto-hide should trigger onClose
    act(() => {
      jest.advanceTimersByTime(4000); // Default duration
    });
    
    act(() => {
      jest.advanceTimersByTime(300); // Animation delay
    });
    
    expect(onClose).toHaveBeenCalled();
  });
});

describe('useSuccessMessage hook', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  it('manages success message state', () => {
    render(<SuccessMessageHookTestComponent />);
    
    expect(screen.getByTestId('is-showing')).toHaveTextContent('false');
    
    // Show success message
    fireEvent.click(screen.getByText('Show Success'));
    
    expect(screen.getByTestId('is-showing')).toHaveTextContent('true');
    expect(screen.getByText('Test success message')).toBeInTheDocument();
  });

  it('shows success with custom title', () => {
    render(<SuccessMessageHookTestComponent />);
    
    fireEvent.click(screen.getByText('Show Custom'));
    
    expect(screen.getByText('Custom Title')).toBeInTheDocument();
    expect(screen.getByText('Custom title message')).toBeInTheDocument();
  });

  it('shows success with custom variant', () => {
    render(<SuccessMessageHookTestComponent />);
    
    fireEvent.click(screen.getByText('Show Celebration'));
    
    expect(screen.getByText('Celebration')).toBeInTheDocument();
    expect(screen.getByText('Celebration message')).toBeInTheDocument();
  });

  it('hides success message manually', () => {
    render(<SuccessMessageHookTestComponent />);
    
    // Show success
    fireEvent.click(screen.getByText('Show Success'));
    expect(screen.getByTestId('is-showing')).toHaveTextContent('true');
    
    // Hide success
    fireEvent.click(screen.getByText('Hide Success'));
    expect(screen.getByTestId('is-showing')).toHaveTextContent('false');
  });

  it('auto-hides success message', () => {
    render(<SuccessMessageHookTestComponent />);
    
    // Show success
    fireEvent.click(screen.getByText('Show Success'));
    expect(screen.getByTestId('is-showing')).toHaveTextContent('true');
    
    // Auto-hide after default duration
    act(() => {
      jest.advanceTimersByTime(4000); // Default auto-hide duration
    });
    
    expect(screen.getByTestId('is-showing')).toHaveTextContent('false');
  });
});