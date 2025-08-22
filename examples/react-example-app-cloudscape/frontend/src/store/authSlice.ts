import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit';
import { authService, type SignInParams, type SignUpParams, type ConfirmSignUpParams } from '../services/auth';
import { showSuccess } from './notificationSlice';

export interface User {
  userId: string;
  email: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
};

export const signInAsync = createAsyncThunk(
  'auth/signIn',
  async (params: SignInParams, { rejectWithValue, getState }) => {
    try {
      const state = getState() as any;
      if (!state.app.isInitialized) {
        return rejectWithValue('App is not initialized yet');
      }
      await authService.signIn(params);
      const user = await authService.getCurrentUser();
      return {
        userId: user?.userId || '',
        email: params.email,
      };
    } catch (error: any) {
      return rejectWithValue(error.message || 'Sign in failed');
    }
  }
);

export const signUpAsync = createAsyncThunk(
  'auth/signUp',
  async (params: SignUpParams, { rejectWithValue, getState, dispatch }) => {
    try {
      const state = getState() as any;
      if (!state.app.isInitialized) {
        return rejectWithValue('App is not initialized yet');
      }
      await authService.signUp(params);
      dispatch(showSuccess('Account created successfully! Please check your email for confirmation.'));
      return params.email;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Sign up failed');
    }
  }
);

export const confirmSignUpAsync = createAsyncThunk(
  'auth/confirmSignUp',
  async (params: ConfirmSignUpParams, { rejectWithValue, getState, dispatch }) => {
    try {
      const state = getState() as any;
      if (!state.app.isInitialized) {
        return rejectWithValue('App is not initialized yet');
      }
      await authService.confirmSignUp(params);
      dispatch(showSuccess('Email confirmed successfully! You can now sign in.'));
      return params.email;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Confirmation failed');
    }
  }
);

export const signOutAsync = createAsyncThunk(
  'auth/signOut',
  async (_, { rejectWithValue, dispatch }) => {
    try {
      await authService.signOut();
      dispatch(showSuccess('Signed out successfully'));
      return;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Sign out failed');
    }
  }
);

export const checkAuthAsync = createAsyncThunk(
  'auth/checkAuth',
  async (_, { rejectWithValue }) => {
    try {
      const user = await authService.getCurrentUser();
      if (user) {
        return {
          userId: user.userId,
          email: user.signInDetails?.loginId || '',
        };
      }
      return null;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Auth check failed');
    }
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Sign In
      .addCase(signInAsync.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(signInAsync.fulfilled, (state, action: PayloadAction<User>) => {
        state.isLoading = false;
        state.user = action.payload;
        state.isAuthenticated = true;
      })
      .addCase(signInAsync.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Sign Up
      .addCase(signUpAsync.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(signUpAsync.fulfilled, (state) => {
        state.isLoading = false;
      })
      .addCase(signUpAsync.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Confirm Sign Up
      .addCase(confirmSignUpAsync.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(confirmSignUpAsync.fulfilled, (state) => {
        state.isLoading = false;
      })
      .addCase(confirmSignUpAsync.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Sign Out
      .addCase(signOutAsync.fulfilled, (state) => {
        state.user = null;
        state.isAuthenticated = false;
      })
      // Check Auth
      .addCase(checkAuthAsync.fulfilled, (state, action) => {
        if (action.payload) {
          state.user = action.payload;
          state.isAuthenticated = true;
        }
      });
  },
});

export const { clearError } = authSlice.actions;
export default authSlice.reducer;