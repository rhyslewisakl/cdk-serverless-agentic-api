/**
 * ItemForm component tests
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ItemForm } from '../ItemForm';
import { UserItem } from '../../../types/user-item';

// Mock item data
const mockItem: UserItem = {
  id: '123',
  userId: 'user-123',
  title: 'Test Item',
  description: 'This is a test item description',
  category: 'Work',
  status: 'active',
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-02T00:00:00Z',
  metadata: {
    tags: ['urgent', 'important'],
    priority: 3,
    dueDate: '2024-12-31T00:00:00Z',
  },
};

describe('ItemForm', () => {
  const mockOnSubmit = jest.fn();
  const mockOnCancel = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders create form correctly', () => {
    render(
      <ItemForm
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    expect(screen.getByText('Create New Item')).toBeInTheDocument();
    expect(screen.getByText('Fill in the details to create a new item')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Create Item' })).toBeInTheDocument();
  });

  it('renders edit form correctly', () => {
    render(
      <ItemForm
        item={mockItem}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    expect(screen.getByText('Edit Item')).toBeInTheDocument();
    expect(screen.getByText('Update the item details below')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Update Item' })).toBeInTheDocument();
  });

  it('populates form fields when editing', () => {
    render(
      <ItemForm
        item={mockItem}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    expect(screen.getByDisplayValue('Test Item')).toBeInTheDocument();
    expect(screen.getByDisplayValue('This is a test item description')).toBeInTheDocument();
    
    // Check select elements by their selected options
    const categorySelect = screen.getByLabelText(/Category/) as HTMLSelectElement;
    expect(categorySelect.value).toBe('Work');
    
    const statusSelect = screen.getByLabelText(/Status/) as HTMLSelectElement;
    expect(statusSelect.value).toBe('active');
    
    expect(screen.getByText('#urgent')).toBeInTheDocument();
    expect(screen.getByText('#important')).toBeInTheDocument();
  });

  it('validates required fields', async () => {
    render(
      <ItemForm
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    // Submit without filling required fields
    fireEvent.click(screen.getByRole('button', { name: 'Create Item' }));

    await waitFor(() => {
      expect(screen.getByText('Title is required')).toBeInTheDocument();
      expect(screen.getByText('Description is required')).toBeInTheDocument();
      expect(screen.getByText('Category is required')).toBeInTheDocument();
    });

    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it('validates field lengths', async () => {
    render(
      <ItemForm
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    // Enter text that exceeds limits
    const titleInput = screen.getByLabelText(/Title/);
    const descriptionInput = screen.getByLabelText(/Description/);

    fireEvent.change(titleInput, { target: { value: 'a'.repeat(101) } });
    fireEvent.change(descriptionInput, { target: { value: 'a'.repeat(501) } });

    fireEvent.click(screen.getByRole('button', { name: 'Create Item' }));

    await waitFor(() => {
      expect(screen.getByText('Title must be 100 characters or less')).toBeInTheDocument();
      expect(screen.getByText('Description must be 500 characters or less')).toBeInTheDocument();
    });
  });

  it('validates due date', async () => {
    render(
      <ItemForm
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    // Set due date to yesterday
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayString = yesterday.toISOString().split('T')[0];

    const dueDateInput = screen.getByLabelText(/Due Date/);
    fireEvent.change(dueDateInput, { target: { value: yesterdayString } });

    // Fill required fields
    fireEvent.change(screen.getByLabelText(/Title/), { target: { value: 'Test Title' } });
    fireEvent.change(screen.getByLabelText(/Description/), { target: { value: 'Test Description' } });
    fireEvent.change(screen.getByLabelText(/Category/), { target: { value: 'Work' } });

    fireEvent.click(screen.getByRole('button', { name: 'Create Item' }));

    await waitFor(() => {
      expect(screen.getByText('Due date must be today or in the future')).toBeInTheDocument();
    });
  });

  it('handles tag management', () => {
    render(
      <ItemForm
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    const tagInput = screen.getByPlaceholderText('Add a tag');
    const addButton = screen.getByRole('button', { name: 'Add' });

    // Add a tag
    fireEvent.change(tagInput, { target: { value: 'test-tag' } });
    fireEvent.click(addButton);

    expect(screen.getByText('#test-tag')).toBeInTheDocument();
    expect(tagInput).toHaveValue('');

    // Remove a tag
    const removeButton = screen.getByText('×');
    fireEvent.click(removeButton);

    expect(screen.queryByText('#test-tag')).not.toBeInTheDocument();
  });

  it('handles tag input with Enter key', () => {
    render(
      <ItemForm
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    const tagInput = screen.getByPlaceholderText('Add a tag');

    fireEvent.change(tagInput, { target: { value: 'enter-tag' } });
    
    // Simulate Enter key press
    fireEvent.keyDown(tagInput, { key: 'Enter', code: 'Enter' });

    // Check that the tag count increased (indicating tag was added)
    expect(screen.getByText('1/10 tags')).toBeInTheDocument();
    expect(tagInput).toHaveValue('');
  });

  it('prevents duplicate tags', () => {
    render(
      <ItemForm
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    const tagInput = screen.getByPlaceholderText('Add a tag');
    const addButton = screen.getByRole('button', { name: 'Add' });

    // Add a tag
    fireEvent.change(tagInput, { target: { value: 'duplicate' } });
    fireEvent.click(addButton);

    // Try to add the same tag again
    fireEvent.change(tagInput, { target: { value: 'duplicate' } });
    fireEvent.click(addButton);

    // Should only have one instance
    const tags = screen.getAllByText('#duplicate');
    expect(tags).toHaveLength(1);
  });

  it('submits form with correct data', async () => {
    mockOnSubmit.mockResolvedValue(undefined);

    render(
      <ItemForm
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    // Fill form
    fireEvent.change(screen.getByLabelText(/Title/), { target: { value: 'Test Title' } });
    fireEvent.change(screen.getByLabelText(/Description/), { target: { value: 'Test Description' } });
    fireEvent.change(screen.getByLabelText(/Category/), { target: { value: 'Work' } });
    fireEvent.change(screen.getByLabelText(/Status/), { target: { value: 'inactive' } });
    fireEvent.change(screen.getByLabelText(/Priority/), { target: { value: '3' } });
    
    // Use a future date
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 30);
    const futureDateString = futureDate.toISOString().split('T')[0];
    fireEvent.change(screen.getByLabelText(/Due Date/), { target: { value: futureDateString } });

    // Add a tag
    const tagInput = screen.getByPlaceholderText('Add a tag');
    fireEvent.change(tagInput, { target: { value: 'test-tag' } });
    fireEvent.click(screen.getByRole('button', { name: 'Add' }));

    // Submit form
    fireEvent.click(screen.getByRole('button', { name: 'Create Item' }));

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith({
        title: 'Test Title',
        description: 'Test Description',
        category: 'Work',
        status: 'inactive',
        metadata: {
          tags: ['test-tag'],
          priority: 3,
          dueDate: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/),
        },
      });
    });
  });

  it('calls onCancel when cancel button is clicked', () => {
    render(
      <ItemForm
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(mockOnCancel).toHaveBeenCalled();
  });

  it('shows loading state', () => {
    render(
      <ItemForm
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
        isLoading={true}
      />
    );

    expect(screen.getByRole('button', { name: 'Saving...' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeDisabled();
  });

  it('clears field errors when user starts typing', async () => {
    render(
      <ItemForm
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    // Submit to trigger validation errors
    fireEvent.click(screen.getByRole('button', { name: 'Create Item' }));

    await waitFor(() => {
      expect(screen.getByText('Title is required')).toBeInTheDocument();
    });

    // Start typing in title field
    fireEvent.change(screen.getByLabelText(/Title/), { target: { value: 'T' } });

    // Error should be cleared
    expect(screen.queryByText('Title is required')).not.toBeInTheDocument();
  });

  it('shows character counts', () => {
    render(
      <ItemForm
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    expect(screen.getByText('0/100 characters')).toBeInTheDocument(); // Title
    expect(screen.getByText('0/500 characters')).toBeInTheDocument(); // Description
    expect(screen.getByText('0/10 tags')).toBeInTheDocument(); // Tags
  });
});