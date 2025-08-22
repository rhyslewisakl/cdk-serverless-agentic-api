import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit';
import { apiService } from '../services/api';
import { type Item, type CreateItemRequest, type UpdateItemRequest } from '../types/item';
import { showSuccess, showError } from './notificationSlice';

interface ItemsState {
  items: Item[];
  isLoading: boolean;
  error: string | null;
}

const initialState: ItemsState = {
  items: [],
  isLoading: false,
  error: null,
};

export const fetchItemsAsync = createAsyncThunk(
  'items/fetchItems',
  async (_, { rejectWithValue }) => {
    try {
      const result = await apiService.getItems();
      return Array.isArray(result) ? result : [];
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch items');
    }
  }
);

export const createItemAsync = createAsyncThunk(
  'items/createItem',
  async (item: CreateItemRequest, { rejectWithValue, dispatch }) => {
    try {
      const result = await apiService.createItem(item);
      dispatch(showSuccess('Item created successfully'));
      return result;
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to create item';
      dispatch(showError(message));
      return rejectWithValue(message);
    }
  }
);

export const updateItemAsync = createAsyncThunk(
  'items/updateItem',
  async ({ itemId, updates }: { itemId: string; updates: UpdateItemRequest }, { rejectWithValue, dispatch }) => {
    try {
      const result = await apiService.updateItem(itemId, updates);
      dispatch(showSuccess('Item updated successfully'));
      return result;
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to update item';
      dispatch(showError(message));
      return rejectWithValue(message);
    }
  }
);

export const deleteItemAsync = createAsyncThunk(
  'items/deleteItem',
  async (itemId: string, { rejectWithValue, dispatch }) => {
    try {
      await apiService.deleteItem(itemId);
      dispatch(showSuccess('Item deleted successfully'));
      return itemId;
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to delete item';
      dispatch(showError(message));
      return rejectWithValue(message);
    }
  }
);

const itemsSlice = createSlice({
  name: 'items',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Items
      .addCase(fetchItemsAsync.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchItemsAsync.fulfilled, (state, action: PayloadAction<Item[]>) => {
        state.isLoading = false;
        state.items = action.payload;
      })
      .addCase(fetchItemsAsync.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Create Item
      .addCase(createItemAsync.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createItemAsync.fulfilled, (state, action: PayloadAction<Item>) => {
        state.isLoading = false;
        state.items.push(action.payload);
      })
      .addCase(createItemAsync.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Update Item
      .addCase(updateItemAsync.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateItemAsync.fulfilled, (state, action: PayloadAction<Item>) => {
        state.isLoading = false;
        const index = state.items.findIndex(item => item.itemId === action.payload.itemId);
        if (index !== -1) {
          state.items[index] = action.payload;
        }
      })
      .addCase(updateItemAsync.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Delete Item
      .addCase(deleteItemAsync.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(deleteItemAsync.fulfilled, (state, action: PayloadAction<string>) => {
        state.isLoading = false;
        state.items = state.items.filter(item => item.itemId !== action.payload);
      })
      .addCase(deleteItemAsync.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearError } = itemsSlice.actions;
export default itemsSlice.reducer;