import React, { useEffect, useState } from 'react';
import {
  Table,
  Box,
  SpaceBetween,
  Button,
  Header,
  Modal,
  Alert,
  Badge,
} from '@cloudscape-design/components';
import { useAppDispatch, useAppSelector } from '../../hooks/redux';
import { fetchItemsAsync, deleteItemAsync, clearError } from '../../store/itemsSlice';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { type Item } from '../../types/item';

interface ItemsListProps {
  onCreateClick: () => void;
  onEditClick: (item: Item) => void;
}

export const ItemsList: React.FC<ItemsListProps> = ({ onCreateClick, onEditClick }) => {
  const dispatch = useAppDispatch();
  const { items, isLoading, error } = useAppSelector((state) => state.items);
  const [selectedItems, setSelectedItems] = useState<Item[]>([]);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<Item | null>(null);
  const [deletingItemId, setDeletingItemId] = useState<string | null>(null);

  useEffect(() => {
    dispatch(fetchItemsAsync());
  }, [dispatch]);

  const handleDelete = (item: Item) => {
    setItemToDelete(item);
    setDeleteModalVisible(true);
  };

  const confirmDelete = async () => {
    if (itemToDelete) {
      setDeletingItemId(itemToDelete.itemId);
      await dispatch(deleteItemAsync(itemToDelete.itemId));
      setDeleteModalVisible(false);
      setItemToDelete(null);
      setDeletingItemId(null);
    }
  };

  const getStatusBadge = (status: string) => {
    const colorMap = {
      active: 'green',
      inactive: 'red',
      pending: 'blue',
    } as const;
    
    return <Badge color={colorMap[status as keyof typeof colorMap] || 'grey'}>{status}</Badge>;
  };

  const columnDefinitions = [
    {
      id: 'title',
      header: 'Title',
      cell: (item: Item) => item.title,
      sortingField: 'title',
    },
    {
      id: 'description',
      header: 'Description',
      cell: (item: Item) => item.description,
    },
    {
      id: 'category',
      header: 'Category',
      cell: (item: Item) => item.category,
      sortingField: 'category',
    },
    {
      id: 'status',
      header: 'Status',
      cell: (item: Item) => getStatusBadge(item.status),
      sortingField: 'status',
    },
    {
      id: 'createdAt',
      header: 'Created',
      cell: (item: Item) => new Date(item.createdAt).toLocaleDateString(),
      sortingField: 'createdAt',
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: (item: Item) => (
        <SpaceBetween direction="horizontal" size="xs">
          <Button onClick={() => onEditClick(item)}>
            Edit
          </Button>
          <Button 
            variant="normal" 
            onClick={() => handleDelete(item)}
            loading={deletingItemId === item.itemId}
          >
            Delete
          </Button>
        </SpaceBetween>
      ),
    },
  ];

  return (
    <SpaceBetween direction="vertical" size="l">
      {error && (
        <Alert
          type="error"
          dismissible
          onDismiss={() => dispatch(clearError())}
        >
          {error}
        </Alert>
      )}

      <Table
        columnDefinitions={columnDefinitions}
        items={items}
        loading={isLoading && items.length === 0}
        loadingText="Loading items..."
        selectedItems={selectedItems}
        onSelectionChange={({ detail }) => setSelectedItems(detail.selectedItems)}
        selectionType="multi"
        header={
          <Header
            counter={`(${items.length})`}
            actions={
              <Button variant="primary" onClick={onCreateClick}>
                Create Item
              </Button>
            }
          >
            Items
          </Header>
        }
        empty={
          isLoading ? (
            <LoadingSpinner text="Loading items..." />
          ) : (
            <Box margin={{ vertical: 'xs' }} textAlign="center" color="inherit">
              <SpaceBetween size="m">
                <b>No items</b>
                <Button onClick={onCreateClick}>Create Item</Button>
              </SpaceBetween>
            </Box>
          )
        }
        sortingDisabled={false}
      />

      <Modal
        visible={deleteModalVisible}
        onDismiss={() => setDeleteModalVisible(false)}
        header="Delete Item"
        closeAriaLabel="Close modal"
        footer={
          <Box float="right">
            <SpaceBetween direction="horizontal" size="xs">
              <Button variant="link" onClick={() => setDeleteModalVisible(false)}>
                Cancel
              </Button>
              <Button variant="primary" onClick={confirmDelete}>
                Delete
              </Button>
            </SpaceBetween>
          </Box>
        }
      >
        Are you sure you want to delete "{itemToDelete?.title}"? This action cannot be undone.
      </Modal>
    </SpaceBetween>
  );
};