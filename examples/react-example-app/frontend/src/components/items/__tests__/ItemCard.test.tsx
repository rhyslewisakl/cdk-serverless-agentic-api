/**
 * ItemCard component tests
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ItemCard } from '../ItemCard';
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

describe('ItemCard', () => {
  it('renders item information correctly', () => {
    render(<ItemCard item={mockItem} />);

    expect(screen.getByText('Test Item')).toBeInTheDocument();
    expect(screen.getByText('Work')).toBeInTheDocument();
    expect(screen.getByText('This is a test item description')).toBeInTheDocument();
    expect(screen.getByText('Active')).toBeInTheDocument();
    expect(screen.getByText('High')).toBeInTheDocument();
  });

  it('displays tags when present', () => {
    render(<ItemCard item={mockItem} />);

    expect(screen.getByText('#urgent')).toBeInTheDocument();
    expect(screen.getByText('#important')).toBeInTheDocument();
  });

  it('displays due date when present', () => {
    render(<ItemCard item={mockItem} />);

    expect(screen.getByText(/Due: Dec 31, 2024/)).toBeInTheDocument();
  });

  it('displays created and updated dates', () => {
    render(<ItemCard item={mockItem} />);

    expect(screen.getByText(/Created: Jan 1, 2024/)).toBeInTheDocument();
    expect(screen.getByText(/Updated: Jan 2, 2024/)).toBeInTheDocument();
  });

  it('does not show updated date if same as created date', () => {
    const itemWithSameDate = {
      ...mockItem,
      updatedAt: mockItem.createdAt,
    };

    render(<ItemCard item={itemWithSameDate} />);

    expect(screen.getByText(/Created: Jan 1, 2024/)).toBeInTheDocument();
    expect(screen.queryByText(/Updated:/)).not.toBeInTheDocument();
  });

  it('handles item without metadata', () => {
    const itemWithoutMetadata = {
      ...mockItem,
      metadata: undefined,
    };

    render(<ItemCard item={itemWithoutMetadata} />);

    expect(screen.getByText('Test Item')).toBeInTheDocument();
    expect(screen.queryByText('#urgent')).not.toBeInTheDocument();
    expect(screen.queryByText('High')).not.toBeInTheDocument();
    expect(screen.queryByText(/Due:/)).not.toBeInTheDocument();
  });

  it('calls onEdit when edit button is clicked', () => {
    const onEdit = jest.fn();
    render(<ItemCard item={mockItem} onEdit={onEdit} />);

    fireEvent.click(screen.getByText('Edit'));
    expect(onEdit).toHaveBeenCalledWith(mockItem);
  });

  it('calls onDelete when delete button is clicked', () => {
    const onDelete = jest.fn();
    render(<ItemCard item={mockItem} onDelete={onDelete} />);

    fireEvent.click(screen.getByText('Delete'));
    expect(onDelete).toHaveBeenCalledWith(mockItem);
  });

  it('calls onView when view button is clicked', () => {
    const onView = jest.fn();
    render(<ItemCard item={mockItem} onView={onView} />);

    fireEvent.click(screen.getByText('View'));
    expect(onView).toHaveBeenCalledWith(mockItem);
  });

  it('does not render action buttons when handlers are not provided', () => {
    render(<ItemCard item={mockItem} />);

    expect(screen.queryByText('Edit')).not.toBeInTheDocument();
    expect(screen.queryByText('Delete')).not.toBeInTheDocument();
    expect(screen.queryByText('View')).not.toBeInTheDocument();
  });

  it('applies correct status colors', () => {
    const { rerender } = render(<ItemCard item={mockItem} />);
    
    // Active status
    expect(screen.getByText('Active')).toHaveClass('bg-green-100', 'text-green-800');

    // Inactive status
    const inactiveItem = { ...mockItem, status: 'inactive' as const };
    rerender(<ItemCard item={inactiveItem} />);
    expect(screen.getByText('Inactive')).toHaveClass('bg-yellow-100', 'text-yellow-800');

    // Archived status
    const archivedItem = { ...mockItem, status: 'archived' as const };
    rerender(<ItemCard item={archivedItem} />);
    expect(screen.getByText('Archived')).toHaveClass('bg-gray-100', 'text-gray-800');
  });

  it('applies correct priority colors', () => {
    const { rerender } = render(<ItemCard item={mockItem} />);
    
    // High priority (3)
    expect(screen.getByText('High')).toHaveClass('bg-orange-100', 'text-orange-800');

    // Low priority (1)
    const lowPriorityItem = {
      ...mockItem,
      metadata: { ...mockItem.metadata!, priority: 1 },
    };
    rerender(<ItemCard item={lowPriorityItem} />);
    expect(screen.getByText('Low')).toHaveClass('bg-blue-100', 'text-blue-800');

    // Urgent priority (4)
    const urgentPriorityItem = {
      ...mockItem,
      metadata: { ...mockItem.metadata!, priority: 4 },
    };
    rerender(<ItemCard item={urgentPriorityItem} />);
    expect(screen.getByText('Urgent')).toHaveClass('bg-red-100', 'text-red-800');
  });
});