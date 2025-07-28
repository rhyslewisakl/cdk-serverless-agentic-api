/**
 * Authentication Context for managing global authentication state
 */

import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { AuthState, AuthContextType, LoginCredentials, RegisterCredentials, PasswordChangeCredentials, PasswordResetCredentials } from '../types/auth';
import { authService } from '../services/authService';
import { getErrorMessage } from '../utils/helpers';

// Initial authentication state
const initialAuthState: AuthState = {
  isAuthenticated: false,
  user: null,
  isLoading: true,
  error: null,
};

// Authentication action types
type AuthAction =
  | { type: 'AUTH_START' }
  | { type: 'AUTH_SUCCESS'; payload: any }
  | { type: 'AUTH_FAILURE'; payload: string }
  | { type: 'AUTH_LOGOUT' }
  | { type: 'AUTH_CLEAR_ERROR' };

// Authentication reducer
const authReducer = (state: AuthState, action: AuthAction): AuthState => {
  switch (action.type) {
    case 'AUTH_START':
      return {
        ...state,
        isLoading: true,
        error: null,
      };
    case 'AUTH_SUCCESS':
      return {
        ...state,
        isAuthenticated: true,
        user: action.payload,
        isLoading: false,
        error: null,
      };
    case 'AUTH_FAILURE':
      return {
        ...state,
        isAuthenticated: false,
        user: null,
        isLoading: false,
        error: action.payload,
      };
    case 'AUTH_LOGOUT':
      return {
        ...state,
        isAuthenticated: false,
        user: null,
        isLoading: false,
        error: null,
      };
    case 'AUTH_CLEAR_ERROR':
      return {
        ...state,
        error: null,
      };
    default:
      return state;
  }
};

// Create the authentication context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Authentication provider props
interface AuthProviderProps {
  children: ReactNode;
}

// Authentication provider component
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [authState, dispatch] = useReducer(authReducer, initialAuthState);

  // Initialize authentication on mount
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        dispatch({ type: 'AUTH_START' });
        const user = await authService.getCurrentUser();
        if (user) {
          dispatch({ type: 'AUTH_SUCCESS', payload: user });
        } else {
          dispatch({ type: 'AUTH_FAILURE', payload: 'No authenticated user found' });
        }
      } catch (error) {
        dispatch({ type: 'AUTH_FAILURE', payload: getErrorMessage(error) });
      }
    };

    initializeAuth();
  }, []);

  // Login function
  const login = async (credentials: LoginCredentials): Promise<void> => {
    try {
      dispatch({ type: 'AUTH_START' });
      const user = await authService.login(credentials);
      dispatch({ type: 'AUTH_SUCCESS', payload: user });
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      dispatch({ type: 'AUTH_FAILURE', payload: errorMessage });
      throw error; // Re-throw to allow component-level error handling
    }
  };

  // Register function
  const register = async (credentials: RegisterCredentials): Promise<void> => {
    try {
      dispatch({ type: 'AUTH_START' });
      const user = await authService.register(credentials);
      dispatch({ type: 'AUTH_SUCCESS', payload: user });
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      dispatch({ type: 'AUTH_FAILURE', payload: errorMessage });
      throw error; // Re-throw to allow component-level error handling
    }
  };

  // Logout function
  const logout = async (): Promise<void> => {
    try {
      await authService.logout();
      dispatch({ type: 'AUTH_LOGOUT' });
    } catch (error) {
      // Even if logout fails, clear local state
      dispatch({ type: 'AUTH_LOGOUT' });
      throw error;
    }
  };

  // Change password function
  const changePassword = async (credentials: PasswordChangeCredentials): Promise<void> => {
    try {
      dispatch({ type: 'AUTH_START' });
      await authService.changePassword(credentials);
      // Password change doesn't affect authentication state, just clear loading
      dispatch({ type: 'AUTH_SUCCESS', payload: authState.user });
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      dispatch({ type: 'AUTH_FAILURE', payload: errorMessage });
      throw error; // Re-throw to allow component-level error handling
    }
  };

  // Request password reset function
  const requestPasswordReset = async (email: string): Promise<void> => {
    try {
      await authService.requestPasswordReset(email);
    } catch (error) {
      throw error; // Re-throw to allow component-level error handling
    }
  };

  // Confirm password reset function
  const confirmPasswordReset = async (credentials: PasswordResetCredentials): Promise<void> => {
    try {
      await authService.confirmPasswordReset(credentials);
    } catch (error) {
      throw error; // Re-throw to allow component-level error handling
    }
  };

  // Check if user needs forced password change
  const needsForcedPasswordChange = async (): Promise<boolean> => {
    try {
      return await authService.needsForcedPasswordChange();
    } catch (error) {
      return false;
    }
  };

  // Refresh authentication function
  const refreshAuth = async (): Promise<void> => {
    try {
      dispatch({ type: 'AUTH_START' });
      const user = await authService.getCurrentUser();
      if (user) {
        dispatch({ type: 'AUTH_SUCCESS', payload: user });
      } else {
        dispatch({ type: 'AUTH_LOGOUT' });
      }
    } catch (error) {
      dispatch({ type: 'AUTH_LOGOUT' });
      throw error;
    }
  };

  // Context value
  const contextValue: AuthContextType = {
    authState,
    login,
    register,
    logout,
    changePassword,
    requestPasswordReset,
    confirmPasswordReset,
    needsForcedPasswordChange,
    refreshAuth,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use authentication context
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;