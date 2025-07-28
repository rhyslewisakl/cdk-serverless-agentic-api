/**
 * ItemManager component that orchestrates CRUD operations for items
 */

import React, { useState, useCallback } from 'react';
import { UserItem, CreateItemRequest, UpdateItemRequest } from '../../types/user-item';
import { ConfirmDialogProps, ToastMessage } from '../../types';
import { itemService } from '../../services';
import { ItemList } from './ItemList';
import { ItemForm } from './ItemForm';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { Toast } from './Toast';

interface ItemManagerProps {
  className?: string;
}

type ViewMode = 'list' | 'create' | 'edit';

export const ItemManager: React.FC<ItemManagerProps> = ({ className = '' }) => {
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedItem, setSelectedItem] = useState<UserItem | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialogProps>({
    open: false,
    title: '',
    message: '',
    onConfirm: () => {},
    onCancel: () => {},
  });

  // Toast management
  const addToast = useCallback((toast: Omit<ToastMessage, 'id'>) => {
    const id = Date.now().toString();
    const newToast: ToastMessage = { ...toast, id };
    setToasts(prev => [...prev, newToast]);

    // Auto-remove toast after duration
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, toast.duration || 5000);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  // Navigation handlers
  const handleCreateNew = () => {
    setSelectedItem(null);
    setViewMode('create');
  };

  const handleEditItem = (item: UserItem) => {
    setSelectedItem(item);
    setViewMode('edit');
  };

  const handleViewItem = (item: UserItem) => {
    // For now, viewing just opens edit mode
    // In a real app, this might open a read-only view
    handleEditItem(item);
  };

  const handleBackToList = () => {
    setSelectedItem(null);
    setViewMode('list');
  };

  // CRUD operations
  const handleCreateItem = async (data: CreateItemRequest): Promise<void> => {
    setIsLoading(true);
    try {
      const newItem = await itemService.createItem(data);
      
      addToast({
        type: 'success',
        message: `Item "${newItem.title}" created successfully!`,
      });
      
      setRefreshTrigger(prev => prev + 1);
      setViewMode('list');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create item';
      addToast({
        type: 'error',
        message: errorMessage,
      });
      throw error; // Re-throw to let form handle it
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateItem = async (data: UpdateItemRequest): Promise<void> => {
    if (!selectedItem) return;

    setIsLoading(true);
    try {
      const updatedItem = await itemService.updateItem(selectedItem.id, data);
      
      addToast({
        type: 'success',
        message: `Item "${updatedItem.title}" updated successfully!`,
      });
      
      setRefreshTrigger(prev => prev + 1);
      setViewMode('list');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update item';
      addToast({
        type: 'error',
        message: errorMessage,
      });
      throw error; // Re-throw to let form handle it
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteItem = (item: UserItem) => {
    setConfirmDialog({
      open: true,
      title: 'Delete Item',
      message: `Are you sure you want to delete "${item.title}"? This action cannot be undone.`,
      confirmText: 'Delete',
      cancelText: 'Cancel',
      onConfirm: () => confirmDeleteItem(item),
      onCancel: () => setConfirmDialog(prev => ({ ...prev, open: false })),
    });
  };

  const confirmDeleteItem = async (item: UserItem) => {
    setConfirmDialog(prev => ({ ...prev, open: false }));
    
    // Optimistic update - remove item from list immediately
    const optimisticUpdate = () => {
      setRefreshTrigger(prev => prev + 1);
    };

    // Rollback function in case of error
    const rollback = () => {
      setRefreshTrigger(prev => prev + 1);
    };

    try {
      // Show optimistic update
      optimisticUpdate();
      
      addToast({
        type: 'info',
        message: `Deleting "${item.title}"...`,
        duration: 2000,
      });

      await itemService.deleteItem(item.id);
      
      addToast({
        type: 'success',
        message: `Item "${item.title}" deleted successfully!`,
      });
    } catch (error) {
      // Rollback optimistic update
      rollback();
      
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete item';
      addToast({
        type: 'error',
        message: errorMessage,
      });
    }
  };

  const handleFormSubmit = async (data: CreateItemRequest | UpdateItemRequest): Promise<void> => {
    if (viewMode === 'create') {
      await handleCreateItem(data as CreateItemRequest);
    } else if (viewMode === 'edit') {
      await handleUpdateItem(data as UpdateItemRequest);
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            {viewMode === 'list' ? 'My Items' : viewMode === 'create' ? 'Create Item' : 'Edit Item'}
          </h1>
          <p className="text-gray-600 mt-1">
            {viewMode === 'list' 
              ? 'Manage your personal items and tasks'
              : viewMode === 'create'
              ? 'Add a new item to your collection'
              : 'Update your item details'
            }
          </p>
        </div>
        
        {viewMode === 'list' && (
          <button
            onClick={handleCreateNew}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
          >
            Create New Item
          </button>
        )}
        
        {(viewMode === 'create' || viewMode === 'edit') && (
          <button
            onClick={handleBackToList}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
          >
            Back to List
          </button>
        )}
      </div>

      {/* Main Content */}
      {viewMode === 'list' && (
        <ItemList
          onEditItem={handleEditItem}
          onDeleteItem={handleDeleteItem}
          onViewItem={handleViewItem}
          refreshTrigger={refreshTrigger}
        />
      )}

      {(viewMode === 'create' || viewMode === 'edit') && (
        <ItemForm
          item={selectedItem || undefined}
          onSubmit={handleFormSubmit}
          onCancel={handleBackToList}
          isLoading={isLoading}
        />
      )}

      {/* Confirmation Dialog */}
      <ConfirmDialog {...confirmDialog} />

      {/* Toast Notifications */}
      <div className="fixed top-4 right-4 z-50 space-y-2">
        {toasts.map((toast) => (
          <Toast
            key={toast.id}
            {...toast}
            onClose={() => removeToast(toast.id)}
          />
        ))}
      </div>
    </div>
  );
};