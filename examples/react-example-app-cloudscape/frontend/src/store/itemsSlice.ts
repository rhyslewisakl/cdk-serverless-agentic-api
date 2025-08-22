import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit';
import { apiService } from '../services/api';
import { type Item, type CreateItemRequest, type UpdateItemRequest } from '../types/item';

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
      return await apiService.getItems();
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch items');
    }
  }
);

export const createItemAsync = createAsyncThunk(
  'items/createItem',
  async (item: CreateItemRequest, { rejectWithValue }) => {
    try {
      return await apiService.createItem(item);
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create item');
    }
  }
);

export const updateItemAsync = createAsyncThunk(
  'items/updateItem',
  async ({ itemId, updates }: { itemId: string; updates: UpdateItemRequest }, { rejectWithValue }) => {
    try {
      return await apiService.updateItem(itemId, updates);
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update item');
    }
  }
);

export const deleteItemAsync = createAsyncThunk(
  'items/deleteItem',
  async (itemId: string, { rejectWithValue }) => {
    try {
      await apiService.deleteItem(itemId);
      return itemId;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete item');
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