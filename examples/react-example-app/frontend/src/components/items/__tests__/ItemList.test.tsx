/**
 * ItemList component tests
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ItemList } from '../ItemList';
import { itemService } from '../../../services';
import { UserItem, ItemListResponse } from '../../../types/user-item';

// Mock the item service
jest.mock('../../../services', () => ({
  itemService: {
    getItems: jest.fn(),
    searchItems: jest.fn(),
    getItemsByCategory: jest.fn(),
    getItemsByStatus: jest.fn(),
  },
}));

const mockItemService = itemService as jest.Mocked<typeof itemService>;

// Mock item data
const mockItems: UserItem[] = [
  {
    id: '1',
    userId: 'user-1',
    title: 'First Item',
    description: 'First item description',
    category: 'Work',
    status: 'active',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: '2',
    userId: 'user-1',
    title: 'Second Item',
    description: 'Second item description',
    category: 'Personal',
    status: 'inactive',
    createdAt: '2024-01-02T00:00:00Z',
    updatedAt: '2024-01-02T00:00:00Z',
  },
];

const mockResponse: ItemListResponse = {
  items: mockItems,
  count: 2,
  nextToken: undefined,
};

describe('ItemList', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockItemService.getItems.mockResolvedValue(mockResponse);
  });

  it('renders loading state initially', () => {
    render(<ItemList />);
    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
  });

  it('renders items after loading', async () => {
    render(<ItemList />);

    await waitFor(() => {
      expect(screen.getByText('First Item')).toBeInTheDocument();
      expect(screen.getByText('Second Item')).toBeInTheDocument();
    });

    expect(mockItemService.getItems).toHaveBeenCalledWith({
      limit: 20,
      nextToken: undefined,
    });
  });

  it('renders empty state when no items', async () => {
    mockItemService.getItems.mockResolvedValue({
      items: [],
      count: 0,
      nextToken: undefined,
    });

    render(<ItemList />);

    await waitFor(() => {
      expect(screen.getByText('No items found')).toBeInTheDocument();
      expect(screen.getByText('Create your first item to get started')).toBeInTheDocument();
    });
  });

  it('renders error state when loading fails', async () => {
    const errorMessage = 'Failed to load items';
    mockItemService.getItems.mockRejectedValue(new Error(errorMessage));

    render(<ItemList />);

    await waitFor(() => {
      expect(screen.getByText('Error')).toBeInTheDocument();
    });
  });

  it('handles search filter', async () => {
    mockItemService.searchItems.mockResolvedValue(mockResponse);

    render(<ItemList />);

    // Wait for initial load
    await waitFor(() => {
      expect(screen.getByText('First Item')).toBeInTheDocument();
    });

    // Enter search term
    const searchInput = screen.getByPlaceholderText('Search items...');
    fireEvent.change(searchInput, { target: { value: 'test search' } });

    // Wait for debounced search
    await waitFor(() => {
      expect(mockItemService.searchItems).toHaveBeenCalledWith('test search', {
        limit: 20,
        nextToken: undefined,
      });
    }, { timeout: 500 });
  });

  it('handles category filter', async () => {
    mockItemService.getItemsByCategory.mockResolvedValue(mockResponse);

    render(<ItemList />);

    // Wait for initial load
    await waitFor(() => {
      expect(screen.getByText('First Item')).toBeInTheDocument();
    });

    // Select category
    const categorySelect = screen.getByLabelText('Category');
    fireEvent.change(categorySelect, { target: { value: 'Work' } });

    await waitFor(() => {
      expect(mockItemService.getItemsByCategory).toHaveBeenCalledWith('Work', {
        limit: 20,
        nextToken: undefined,
      });
    });
  });

  it('handles status filter', async () => {
    mockItemService.getItemsByStatus.mockResolvedValue(mockResponse);

    render(<ItemList />);

    // Wait for initial load
    await waitFor(() => {
      expect(screen.getByText('First Item')).toBeInTheDocument();
    });

    // Select status
    const statusSelect = screen.getByLabelText('Status');
    fireEvent.change(statusSelect, { target: { value: 'active' } });

    await waitFor(() => {
      expect(mockItemService.getItemsByStatus).toHaveBeenCalledWith('active', {
        limit: 20,
        nextToken: undefined,
      });
    });
  });

  it('clears filters when clear button is clicked', async () => {
    render(<ItemList />);

    // Wait for initial load
    await waitFor(() => {
      expect(screen.getByText('First Item')).toBeInTheDocument();
    });

    // Set a filter
    const categorySelect = screen.getByLabelText('Category');
    fireEvent.change(categorySelect, { target: { value: 'Work' } });

    // Clear filters
    const clearButton = screen.getByText('Clear Filters');
    fireEvent.click(clearButton);

    expect(categorySelect).toHaveValue('');
    await waitFor(() => {
      expect(mockItemService.getItems).toHaveBeenCalledTimes(2); // Initial + after clear
    });
  });

  it('handles load more functionality', async () => {
    const responseWithMore: ItemListResponse = {
      ...mockResponse,
      nextToken: 'next-token',
    };

    const moreItems: UserItem[] = [
      {
        id: '3',
        userId: 'user-1',
        title: 'Third Item',
        description: 'Third item description',
        category: 'Work',
        status: 'active',
        createdAt: '2024-01-03T00:00:00Z',
        updatedAt: '2024-01-03T00:00:00Z',
      },
    ];

    mockItemService.getItems
      .mockResolvedValueOnce(responseWithMore)
      .mockResolvedValueOnce({
        items: moreItems,
        count: 1,
        nextToken: undefined,
      });

    render(<ItemList />);

    // Wait for initial load
    await waitFor(() => {
      expect(screen.getByText('First Item')).toBeInTheDocument();
      expect(screen.getByText('Load More')).toBeInTheDocument();
    });

    // Click load more
    fireEvent.click(screen.getByText('Load More'));

    await waitFor(() => {
      expect(screen.getByText('Third Item')).toBeInTheDocument();
    });

    expect(mockItemService.getItems).toHaveBeenCalledTimes(2);
    expect(mockItemService.getItems).toHaveBeenLastCalledWith({
      limit: 20,
      nextToken: 'next-token',
    });
  });

  it('calls callback functions when item actions are triggered', async () => {
    const onEdit = jest.fn();
    const onDelete = jest.fn();
    const onView = jest.fn();

    render(
      <ItemList
        onEditItem={onEdit}
        onDeleteItem={onDelete}
        onViewItem={onView}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('First Item')).toBeInTheDocument();
    });

    // Test edit callback
    fireEvent.click(screen.getAllByText('Edit')[0]);
    expect(onEdit).toHaveBeenCalledWith(mockItems[0]);

    // Test delete callback
    fireEvent.click(screen.getAllByText('Delete')[0]);
    expect(onDelete).toHaveBeenCalledWith(mockItems[0]);

    // Test view callback
    fireEvent.click(screen.getAllByText('View')[0]);
    expect(onView).toHaveBeenCalledWith(mockItems[0]);
  });

  it('refreshes when refreshTrigger prop changes', async () => {
    const { rerender } = render(<ItemList refreshTrigger={1} />);

    await waitFor(() => {
      expect(mockItemService.getItems).toHaveBeenCalledTimes(1);
    });

    // Change refresh trigger
    rerender(<ItemList refreshTrigger={2} />);

    await waitFor(() => {
      expect(mockItemService.getItems).toHaveBeenCalledTimes(2);
    });
  });

  it('shows filtered empty state when no results match filters', async () => {
    mockItemService.searchItems.mockResolvedValue({
      items: [],
      count: 0,
      nextToken: undefined,
    });

    render(<ItemList />);

    // Wait for initial load
    await waitFor(() => {
      expect(screen.getByText('First Item')).toBeInTheDocument();
    });

    // Enter search term that returns no results
    const searchInput = screen.getByPlaceholderText('Search items...');
    fireEvent.change(searchInput, { target: { value: 'no results' } });

    await waitFor(() => {
      expect(screen.getByText('No items match your filters')).toBeInTheDocument();
      expect(screen.getByText('Try adjusting your search criteria or clear the filters')).toBeInTheDocument();
    }, { timeout: 500 });
  });
});