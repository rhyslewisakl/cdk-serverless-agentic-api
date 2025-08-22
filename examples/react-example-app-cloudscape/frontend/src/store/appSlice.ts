import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { configureAmplify } from '../config/amplify';

interface AppState {
  isInitialized: boolean;
  isInitializing: boolean;
  initError: string | null;
}

const initialState: AppState = {
  isInitialized: false,
  isInitializing: false,
  initError: null,
};

export const initializeAppAsync = createAsyncThunk(
  'app/initialize',
  async (_, { rejectWithValue }) => {
    try {
      await configureAmplify();
      return;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to initialize app');
    }
  }
);

const appSlice = createSlice({
  name: 'app',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(initializeAppAsync.pending, (state) => {
        state.isInitializing = true;
        state.initError = null;
      })
      .addCase(initializeAppAsync.fulfilled, (state) => {
        state.isInitializing = false;
        state.isInitialized = true;
      })
      .addCase(initializeAppAsync.rejected, (state, action) => {
        state.isInitializing = false;
        state.initError = action.payload as string;
        state.isInitialized = true; // Still allow app to load
      });
  },
});

export default appSlice.reducer;