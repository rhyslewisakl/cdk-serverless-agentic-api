/**
 * ItemManager component integration tests
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ItemManager } from '../ItemManager';
import { itemService } from '../../../services';
import { UserItem, ItemListResponse } from '../../../types/user-item';

// Mock the item service
jest.mock('../../../services', () => ({
  itemService: {
    getItems: jest.fn(),
    createItem: jest.fn(),
    updateItem: jest.fn(),
    deleteItem: jest.fn(),
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
    title: 'Test Item 1',
    description: 'First test item',
    category: 'Work',
    status: 'active',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: '2',
    userId: 'user-1',
    title: 'Test Item 2',
    description: 'Second test item',
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

describe('ItemManager', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockItemService.getItems.mockResolvedValue(mockResponse);
  });

  it('renders list view by default', async () => {
    render(<ItemManager />);

    expect(screen.getByText('My Items')).toBeInTheDocument();
    expect(screen.getByText('Manage your personal items and tasks')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Create New Item' })).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('Test Item 1')).toBeInTheDocument();
      expect(screen.getByText('Test Item 2')).toBeInTheDocument();
    });
  });

  it('navigates to create form when create button is clicked', () => {
    render(<ItemManager />);

    fireEvent.click(screen.getByRole('button', { name: 'Create New Item' }));

    expect(screen.getByRole('heading', { name: 'Create Item', level: 1 })).toBeInTheDocument();
    expect(screen.getByText('Add a new item to your collection')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Back to List' })).toBeInTheDocument();
  });

  it('navigates back to list from create form', () => {
    render(<ItemManager />);

    // Go to create form
    fireEvent.click(screen.getByRole('button', { name: 'Create New Item' }));
    expect(screen.getByRole('heading', { name: 'Create Item', level: 1 })).toBeInTheDocument();

    // Go back to list
    fireEvent.click(screen.getByRole('button', { name: 'Back to List' }));
    expect(screen.getByText('My Items')).toBeInTheDocument();
  });

  it('creates a new item successfully', async () => {
    const newItem: UserItem = {
      id: '3',
      userId: 'user-1',
      title: 'New Test Item',
      description: 'New item description',
      category: 'Work',
      status: 'active',
      createdAt: '2024-01-03T00:00:00Z',
      updatedAt: '2024-01-03T00:00:00Z',
    };

    mockItemService.createItem.mockResolvedValue(newItem);

    render(<ItemManager />);

    // Navigate to create form
    fireEvent.click(screen.getByRole('button', { name: 'Create New Item' }));

    // Fill form
    fireEvent.change(screen.getByLabelText(/Title/), { target: { value: 'New Test Item' } });
    fireEvent.change(screen.getByLabelText(/Description/), { target: { value: 'New item description' } });
    fireEvent.change(screen.getByLabelText(/Category/), { target: { value: 'Work' } });

    // Submit form
    fireEvent.click(screen.getByRole('button', { name: 'Create Item' }));

    await waitFor(() => {
      expect(mockItemService.createItem).toHaveBeenCalledWith({
        title: 'New Test Item',
        description: 'New item description',
        category: 'Work',
        status: 'active',
        metadata: {
          tags: [],
          priority: 2,
        },
      });
    });

    // Should show success toast and navigate back to list
    await waitFor(() => {
      expect(screen.getByText('Item "New Test Item" created successfully!')).toBeInTheDocument();
      expect(screen.getByText('My Items')).toBeInTheDocument();
    });
  });

  it('handles create item error', async () => {
    const errorMessage = 'Failed to create item';
    mockItemService.createItem.mockRejectedValue(new Error(errorMessage));

    render(<ItemManager />);

    // Navigate to create form
    fireEvent.click(screen.getByRole('button', { name: 'Create New Item' }));

    // Fill form
    fireEvent.change(screen.getByLabelText(/Title/), { target: { value: 'New Test Item' } });
    fireEvent.change(screen.getByLabelText(/Description/), { target: { value: 'New item description' } });
    fireEvent.change(screen.getByLabelText(/Category/), { target: { value: 'Work' } });

    // Submit form
    fireEvent.click(screen.getByRole('button', { name: 'Create Item' }));

    await waitFor(() => {
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });

    // Should still be on create form
    expect(screen.getByRole('heading', { name: 'Create Item', level: 1 })).toBeInTheDocument();
  });

  it('navigates to edit form when edit is clicked', async () => {
    render(<ItemManager />);

    await waitFor(() => {
      expect(screen.getByText('Test Item 1')).toBeInTheDocument();
    });

    // Click edit on first item
    const editButtons = screen.getAllByText('Edit');
    fireEvent.click(editButtons[0]);

    expect(screen.getByRole('heading', { name: 'Edit Item', level: 1 })).toBeInTheDocument();
    expect(screen.getByText('Update your item details')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Test Item 1')).toBeInTheDocument();
  });

  it('updates an item successfully', async () => {
    const updatedItem: UserItem = {
      ...mockItems[0],
      title: 'Updated Test Item',
      updatedAt: '2024-01-03T00:00:00Z',
    };

    mockItemService.updateItem.mockResolvedValue(updatedItem);

    render(<ItemManager />);

    await waitFor(() => {
      expect(screen.getByText('Test Item 1')).toBeInTheDocument();
    });

    // Click edit on first item
    const editButtons = screen.getAllByText('Edit');
    fireEvent.click(editButtons[0]);

    // Update title
    const titleInput = screen.getByDisplayValue('Test Item 1');
    fireEvent.change(titleInput, { target: { value: 'Updated Test Item' } });

    // Submit form
    fireEvent.click(screen.getByRole('button', { name: 'Update Item' }));

    await waitFor(() => {
      expect(mockItemService.updateItem).toHaveBeenCalledWith('1', {
        title: 'Updated Test Item',
        description: 'First test item',
        category: 'Work',
        status: 'active',
        metadata: {
          tags: [],
          priority: 2,
        },
      });
    });

    // Should show success toast and navigate back to list
    await waitFor(() => {
      expect(screen.getByText('Item "Updated Test Item" updated successfully!')).toBeInTheDocument();
      expect(screen.getByText('My Items')).toBeInTheDocument();
    });
  });

  it('shows delete confirmation dialog', async () => {
    render(<ItemManager />);

    await waitFor(() => {
      expect(screen.getByText('Test Item 1')).toBeInTheDocument();
    });

    // Click delete on first item
    const deleteButtons = screen.getAllByText('Delete');
    fireEvent.click(deleteButtons[0]);

    // Should show confirmation dialog
    expect(screen.getByText('Delete Item')).toBeInTheDocument();
    expect(screen.getByText('Are you sure you want to delete "Test Item 1"? This action cannot be undone.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Delete' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
  });

  it('cancels delete operation', async () => {
    render(<ItemManager />);

    await waitFor(() => {
      expect(screen.getByText('Test Item 1')).toBeInTheDocument();
    });

    // Click delete on first item
    const deleteButtons = screen.getAllByText('Delete');
    fireEvent.click(deleteButtons[0]);

    // Cancel deletion
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));

    // Dialog should be closed
    await waitFor(() => {
      expect(screen.queryByText('Delete Item')).not.toBeInTheDocument();
    });
    expect(mockItemService.deleteItem).not.toHaveBeenCalled();
  });

  it('deletes an item successfully', async () => {
    mockItemService.deleteItem.mockResolvedValue(undefined);

    render(<ItemManager />);

    await waitFor(() => {
      expect(screen.getByText('Test Item 1')).toBeInTheDocument();
    });

    // Click delete on first item
    const deleteButtons = screen.getAllByText('Delete');
    fireEvent.click(deleteButtons[0]);

    // Confirm deletion
    fireEvent.click(screen.getByRole('button', { name: 'Delete' }));

    await waitFor(() => {
      expect(mockItemService.deleteItem).toHaveBeenCalledWith('1');
    });

    // Should show success toast
    await waitFor(() => {
      expect(screen.getByText('Item "Test Item 1" deleted successfully!')).toBeInTheDocument();
    });
  });

  it('handles delete item error', async () => {
    const errorMessage = 'Failed to delete item';
    mockItemService.deleteItem.mockRejectedValue(new Error(errorMessage));

    render(<ItemManager />);

    await waitFor(() => {
      expect(screen.getByText('Test Item 1')).toBeInTheDocument();
    });

    // Click delete on first item
    const deleteButtons = screen.getAllByText('Delete');
    fireEvent.click(deleteButtons[0]);

    // Confirm deletion
    fireEvent.click(screen.getByRole('button', { name: 'Delete' }));

    await waitFor(() => {
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });
  });

  it('closes toast notifications', async () => {
    const newItem: UserItem = {
      id: '3',
      userId: 'user-1',
      title: 'New Test Item',
      description: 'New item description',
      category: 'Work',
      status: 'active',
      createdAt: '2024-01-03T00:00:00Z',
      updatedAt: '2024-01-03T00:00:00Z',
    };

    mockItemService.createItem.mockResolvedValue(newItem);

    render(<ItemManager />);

    // Navigate to create form and create item
    fireEvent.click(screen.getByRole('button', { name: 'Create New Item' }));
    fireEvent.change(screen.getByLabelText(/Title/), { target: { value: 'New Test Item' } });
    fireEvent.change(screen.getByLabelText(/Description/), { target: { value: 'New item description' } });
    fireEvent.change(screen.getByLabelText(/Category/), { target: { value: 'Work' } });
    fireEvent.click(screen.getByRole('button', { name: 'Create Item' }));

    // Wait for success toast
    await waitFor(() => {
      expect(screen.getByText('Item "New Test Item" created successfully!')).toBeInTheDocument();
    });

    // Close toast by clicking the close button
    const toastMessage = screen.getByText('Item "New Test Item" created successfully!');
    const toastContainer = toastMessage.closest('.px-4');
    const closeButton = toastContainer?.querySelector('button');
    
    expect(closeButton).toBeInTheDocument();
    if (closeButton) {
      fireEvent.click(closeButton);
    }

    // Toast should be removed after animation
    await waitFor(() => {
      expect(screen.queryByText('Item "New Test Item" created successfully!')).not.toBeInTheDocument();
    }, { timeout: 1000 });
  });
});