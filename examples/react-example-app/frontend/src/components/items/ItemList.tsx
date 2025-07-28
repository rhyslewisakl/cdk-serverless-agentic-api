/**
 * ItemList component for displaying a list of user items with pagination and filtering
 */

import React, { useState, useEffect, useCallback } from 'react';
import { UserItem, ItemListResponse } from '../../types/user-item';
import { LoadingState } from '../../types';
import { itemService } from '../../services';
import { ItemCard } from './ItemCard';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { ErrorMessage } from '../common/ErrorMessage';
import { ITEM_CATEGORIES, ITEM_STATUSES, UI } from '../../utils/constants';

interface ItemListProps {
  onEditItem?: (item: UserItem) => void;
  onDeleteItem?: (item: UserItem) => void;
  onViewItem?: (item: UserItem) => void;
  refreshTrigger?: number; // Used to trigger refresh from parent
}

interface FilterState {
  search: string;
  category: string;
  status: string;
}

export const ItemList: React.FC<ItemListProps> = ({
  onEditItem,
  onDeleteItem,
  onViewItem,
  refreshTrigger,
}) => {
  const [items, setItems] = useState<UserItem[]>([]);
  const [loadingState, setLoadingState] = useState<LoadingState>({
    isLoading: true,
    error: null,
  });
  const [nextToken, setNextToken] = useState<string | undefined>();
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    category: '',
    status: '',
  });

  // Debounced search
  const [searchDebounceTimer, setSearchDebounceTimer] = useState<NodeJS.Timeout | null>(null);

  const loadItems = useCallback(async (
    isLoadMore = false,
    currentFilters = filters
  ) => {
    try {
      if (!isLoadMore) {
        setLoadingState({ isLoading: true, error: null });
      } else {
        setLoadingMore(true);
      }

      let response: ItemListResponse;

      // Apply filters
      if (currentFilters.search) {
        response = await itemService.searchItems(currentFilters.search, {
          limit: UI.PAGINATION_LIMIT,
          nextToken: isLoadMore ? nextToken : undefined,
        });
      } else if (currentFilters.category) {
        response = await itemService.getItemsByCategory(currentFilters.category, {
          limit: UI.PAGINATION_LIMIT,
          nextToken: isLoadMore ? nextToken : undefined,
        });
      } else if (currentFilters.status) {
        response = await itemService.getItemsByStatus(currentFilters.status, {
          limit: UI.PAGINATION_LIMIT,
          nextToken: isLoadMore ? nextToken : undefined,
        });
      } else {
        response = await itemService.getItems({
          limit: UI.PAGINATION_LIMIT,
          nextToken: isLoadMore ? nextToken : undefined,
        });
      }

      if (isLoadMore) {
        setItems(prev => [...prev, ...response.items]);
      } else {
        setItems(response.items);
      }

      setNextToken(response.nextToken);
      setHasMore(!!response.nextToken);
      setLoadingState({ isLoading: false, error: null });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load items';
      setLoadingState({ isLoading: false, error: errorMessage });
    } finally {
      setLoadingMore(false);
    }
  }, [filters, nextToken]);

  // Initial load and refresh trigger
  useEffect(() => {
    loadItems();
  }, [refreshTrigger]);

  // Handle filter changes with debouncing for search
  const handleFilterChange = (key: keyof FilterState, value: string) => {
    const newFilters = { ...filters, [key]: value };
    
    // Reset other filters when one is selected
    if (key === 'search' && value) {
      newFilters.category = '';
      newFilters.status = '';
    } else if (key === 'category' && value) {
      newFilters.search = '';
      newFilters.status = '';
    } else if (key === 'status' && value) {
      newFilters.search = '';
      newFilters.category = '';
    }

    setFilters(newFilters);

    // Debounce search
    if (key === 'search') {
      if (searchDebounceTimer) {
        clearTimeout(searchDebounceTimer);
      }
      
      const timer = setTimeout(() => {
        setNextToken(undefined);
        loadItems(false, newFilters);
      }, UI.DEBOUNCE_DELAY);
      
      setSearchDebounceTimer(timer);
    } else {
      setNextToken(undefined);
      loadItems(false, newFilters);
    }
  };

  const handleLoadMore = () => {
    if (hasMore && !loadingMore) {
      loadItems(true);
    }
  };

  const clearFilters = () => {
    const clearedFilters = { search: '', category: '', status: '' };
    setFilters(clearedFilters);
    setNextToken(undefined);
    loadItems(false, clearedFilters);
  };

  const hasActiveFilters = filters.search || filters.category || filters.status;

  if (loadingState.isLoading && items.length === 0) {
    return (
      <div className="flex justify-center items-center py-12">
        <LoadingSpinner size={60} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm border">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <div>
            <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">
              Search
            </label>
            <input
              type="text"
              id="search"
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              placeholder="Search items..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>

          {/* Category Filter */}
          <div>
            <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
              Category
            </label>
            <select
              id="category"
              value={filters.category}
              onChange={(e) => handleFilterChange('category', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              <option value="">All Categories</option>
              {ITEM_CATEGORIES.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              id="status"
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              <option value="">All Statuses</option>
              {ITEM_STATUSES.map((status) => (
                <option key={status.value} value={status.value}>
                  {status.label}
                </option>
              ))}
            </select>
          </div>

          {/* Clear Filters */}
          <div className="flex items-end">
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="w-full px-4 py-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-50 border border-gray-300 rounded-md transition-colors"
              >
                Clear Filters
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Error State */}
      {loadingState.error && (
        <ErrorMessage 
          error={loadingState.error}
        />
      )}

      {/* Items Grid */}
      {items.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map((item) => (
            <ItemCard
              key={item.id}
              item={item}
              onEdit={onEditItem}
              onDelete={onDeleteItem}
              onView={onViewItem}
            />
          ))}
        </div>
      ) : !loadingState.isLoading && (
        <div className="text-center py-12">
          <div className="text-gray-500 text-lg mb-2">
            {hasActiveFilters ? 'No items match your filters' : 'No items found'}
          </div>
          <div className="text-gray-400 text-sm">
            {hasActiveFilters 
              ? 'Try adjusting your search criteria or clear the filters'
              : 'Create your first item to get started'
            }
          </div>
        </div>
      )}

      {/* Load More Button */}
      {hasMore && (
        <div className="flex justify-center">
          <button
            onClick={handleLoadMore}
            disabled={loadingMore}
            className="px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loadingMore ? (
              <div className="flex items-center space-x-2">
                <LoadingSpinner size={20} />
                <span>Loading...</span>
              </div>
            ) : (
              'Load More'
            )}
          </button>
        </div>
      )}
    </div>
  );
};