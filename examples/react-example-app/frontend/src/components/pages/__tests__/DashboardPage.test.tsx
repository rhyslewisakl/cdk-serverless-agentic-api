/**
 * Unit tests for DashboardPage component
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { DashboardPage } from '../DashboardPage';
import { AuthProvider } from '../../../contexts/AuthContext';

// Mock the auth service
jest.mock('../../../services/authService', () => ({
  getCurrentUser: jest.fn(),
  signIn: jest.fn(),
  signOut: jest.fn(),
  signUp: jest.fn(),
  confirmSignUp: jest.fn(),
  resendSignUpCode: jest.fn(),
  forgotPassword: jest.fn(),
  confirmForgotPassword: jest.fn(),
  changePassword: jest.fn(),
  updateUserAttributes: jest.fn(),
}));

// Mock the API service
jest.mock('../../../services/apiService', () => ({
  get: jest.fn(),
  post: jest.fn(),
  put: jest.fn(),
  delete: jest.fn(),
}));

// Mock the auth context
const mockAuthState = {
  isAuthenticated: true,
  user: { email: 'test@example.com', sub: 'test-user-id' },
  isLoading: false,
  error: null,
};

const mockAuthContext = {
  authState: mockAuthState,
  login: jest.fn(),
  logout: jest.fn(),
  register: jest.fn(),
  confirmRegistration: jest.fn(),
  resendConfirmationCode: jest.fn(),
  forgotPassword: jest.fn(),
  confirmForgotPassword: jest.fn(),
  changePassword: jest.fn(),
  clearError: jest.fn(),
};

jest.mock('../../../contexts/AuthContext', () => ({
  useAuth: () => mockAuthContext,
  AuthProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

const theme = createTheme();

// Test wrapper component
const TestWrapper: React.FC<{ 
  children: React.ReactNode; 
  initialEntries?: string[];
}> = ({ children, initialEntries = ['/dashboard'] }) => (
  <ThemeProvider theme={theme}>
    <MemoryRouter initialEntries={initialEntries}>
      {children}
    </MemoryRouter>
  </ThemeProvider>
);

describe('DashboardPage Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders dashboard title and welcome message', async () => {
    render(
      <TestWrapper>
        <DashboardPage />
      </TestWrapper>
    );

    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    
    await waitFor(() => {
      expect(screen.getByText('Welcome back, test@example.com!')).toBeInTheDocument();
    });
  });

  test('renders info alert about demonstration app', () => {
    render(
      <TestWrapper>
        <DashboardPage />
      </TestWrapper>
    );

    expect(screen.getByText(/This is a demonstration application/)).toBeInTheDocument();
    expect(screen.getByText(/cdk-serverless-agentic-api construct/)).toBeInTheDocument();
  });

  test('renders overview statistics with loading state', async () => {
    render(
      <TestWrapper>
        <DashboardPage />
      </TestWrapper>
    );

    expect(screen.getByText('Overview')).toBeInTheDocument();
    
    // Should show loading skeletons initially (3 per stat card × 4 cards = 12)
    expect(screen.getAllByTestId('skeleton')).toHaveLength(12);

    // Wait for stats to load
    await waitFor(() => {
      expect(screen.getByText('Total Items')).toBeInTheDocument();
      expect(screen.getByText('Active Items')).toBeInTheDocument();
      expect(screen.getByText('Last Activity')).toBeInTheDocument();
      expect(screen.getByText('Storage Used')).toBeInTheDocument();
    });

    // Should show actual values after loading
    await waitFor(() => {
      expect(screen.getByText('12')).toBeInTheDocument(); // Total items
      expect(screen.getByText('8')).toBeInTheDocument();  // Active items
      expect(screen.getByText('2.4 MB')).toBeInTheDocument(); // Storage used
    });
  });

  test('renders quick action cards', () => {
    render(
      <TestWrapper>
        <DashboardPage />
      </TestWrapper>
    );

    expect(screen.getByText('Quick Actions')).toBeInTheDocument();
    expect(screen.getByText('Create Item')).toBeInTheDocument();
    expect(screen.getByText('View Items')).toBeInTheDocument();
    expect(screen.getByText('Profile Settings')).toBeInTheDocument();
    expect(screen.getByText('App Settings')).toBeInTheDocument();
  });

  test('renders account status section', async () => {
    render(
      <TestWrapper>
        <DashboardPage />
      </TestWrapper>
    );

    expect(screen.getByText('Account Status')).toBeInTheDocument();
    expect(screen.getByText('Account Information')).toBeInTheDocument();
    expect(screen.getByText('Security Actions')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('test@example.com')).toBeInTheDocument();
    });

    expect(screen.getByText('Active')).toBeInTheDocument();
    expect(screen.getByText('Verified')).toBeInTheDocument();
    expect(screen.getByText('Change Password')).toBeInTheDocument();
    expect(screen.getByText('Update Profile')).toBeInTheDocument();
  });

  test('refresh button triggers data reload', async () => {
    render(
      <TestWrapper>
        <DashboardPage />
      </TestWrapper>
    );

    const refreshButton = screen.getByLabelText('Refresh dashboard data');
    
    // Wait for initial load to complete
    await waitFor(() => {
      expect(screen.getByText('12')).toBeInTheDocument();
    });

    // Click refresh
    fireEvent.click(refreshButton);

    // Should show loading state again (3 per stat card × 4 cards = 12)
    expect(screen.getAllByTestId('skeleton')).toHaveLength(12);

    // Wait for reload to complete
    await waitFor(() => {
      expect(screen.getByText('12')).toBeInTheDocument();
    });
  });

  test('quick action cards are clickable', () => {
    const mockNavigate = jest.fn();
    jest.doMock('react-router-dom', () => ({
      ...jest.requireActual('react-router-dom'),
      useNavigate: () => mockNavigate,
    }));

    render(
      <TestWrapper>
        <DashboardPage />
      </TestWrapper>
    );

    const createItemCard = screen.getByText('Create Item').closest('.MuiCard-root');
    const viewItemsCard = screen.getByText('View Items').closest('.MuiCard-root');
    const profileCard = screen.getByText('Profile Settings').closest('.MuiCard-root');
    const settingsCard = screen.getByText('App Settings').closest('.MuiCard-root');

    expect(createItemCard).toBeInTheDocument();
    expect(viewItemsCard).toBeInTheDocument();
    expect(profileCard).toBeInTheDocument();
    expect(settingsCard).toBeInTheDocument();
  });

  test('security action buttons are clickable', () => {
    render(
      <TestWrapper>
        <DashboardPage />
      </TestWrapper>
    );

    const changePasswordButton = screen.getByText('Change Password');
    const updateProfileButton = screen.getByText('Update Profile');

    expect(changePasswordButton).toBeInTheDocument();
    expect(updateProfileButton).toBeInTheDocument();
    
    // These should be buttons
    expect(changePasswordButton.tagName).toBe('BUTTON');
    expect(updateProfileButton.tagName).toBe('BUTTON');
  });

  test('handles user without email gracefully', async () => {
    // Create a custom wrapper with user without email
    const TestWrapperWithoutEmail: React.FC<{ children: React.ReactNode }> = ({ children }) => {
      const mockAuthContextWithoutEmail = {
        ...mockAuthContext,
        authState: {
          ...mockAuthState,
          user: { sub: 'test-user-id' },
        },
      };

      // Mock useAuth for this test
      jest.doMock('../../../contexts/AuthContext', () => ({
        useAuth: () => mockAuthContextWithoutEmail,
      }));

      return (
        <ThemeProvider theme={theme}>
          <MemoryRouter initialEntries={['/dashboard']}>
            {children}
          </MemoryRouter>
        </ThemeProvider>
      );
    };

    render(
      <TestWrapperWithoutEmail>
        <DashboardPage />
      </TestWrapperWithoutEmail>
    );

    // Check for fallback text when email is not available
    expect(screen.getByText(/Welcome back,/)).toBeInTheDocument();
    expect(screen.getByText(/User/)).toBeInTheDocument();
  });

  test('responsive design elements are present', () => {
    render(
      <TestWrapper>
        <DashboardPage />
      </TestWrapper>
    );

    // Check that responsive container is used
    const container = screen.getByText('Dashboard').closest('[class*="MuiContainer"]');
    expect(container).toBeInTheDocument();

    // Check that grid system is used for responsive layout
    const gridElements = screen.getAllByRole('generic').filter(
      el => el.className.includes('MuiGrid')
    );
    expect(gridElements.length).toBeGreaterThan(0);
  });

  test('loading state is handled properly', async () => {
    render(
      <TestWrapper>
        <DashboardPage />
      </TestWrapper>
    );

    // Initially should show loading skeletons (3 per stat card × 4 cards = 12)
    expect(screen.getAllByTestId('skeleton')).toHaveLength(12);

    // After loading, skeletons should be gone
    await waitFor(() => {
      expect(screen.queryAllByTestId('skeleton')).toHaveLength(0);
    });
  });

  test('refresh button is disabled during loading', async () => {
    render(
      <TestWrapper>
        <DashboardPage />
      </TestWrapper>
    );

    const refreshButton = screen.getByLabelText('Refresh dashboard data').querySelector('button');
    
    // Should be disabled during initial load
    expect(refreshButton).toBeDisabled();

    // Wait for load to complete
    await waitFor(() => {
      expect(refreshButton).not.toBeDisabled();
    });

    // Click refresh
    fireEvent.click(refreshButton!);

    // Should be disabled again during reload
    expect(refreshButton).toBeDisabled();

    // Wait for reload to complete
    await waitFor(() => {
      expect(refreshButton).not.toBeDisabled();
    });
  });
});