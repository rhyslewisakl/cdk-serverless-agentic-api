import React, { useState, useEffect } from 'react';
import {
  Container,
  Header,
  SpaceBetween,
  Modal,
  Button,
  Box,
} from '@cloudscape-design/components';
import { ItemsList } from '../components/items/ItemsList';
import { ItemForm } from '../components/items/ItemForm';
import { useAppDispatch } from '../hooks/redux';
import { signOutAsync } from '../store/authSlice';
import { apiService } from '../services/api';
import { type Item } from '../types/item';

export const ItemsPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingItem, setEditingItem] = useState<Item | null>(null);

  useEffect(() => {
    apiService.initialize().catch(console.error);
  }, []);

  const handleCreateClick = () => {
    setShowCreateModal(true);
  };

  const handleEditClick = (item: Item) => {
    setEditingItem(item);
    setShowEditModal(true);
  };

  const handleFormSuccess = () => {
    setShowCreateModal(false);
    setShowEditModal(false);
    setEditingItem(null);
  };

  const handleFormCancel = () => {
    setShowCreateModal(false);
    setShowEditModal(false);
    setEditingItem(null);
  };

  const handleSignOut = () => {
    dispatch(signOutAsync());
  };

  return (
    <SpaceBetween direction="vertical" size="l">
      <Container>
        <SpaceBetween direction="vertical" size="l">
          <Box float="right">
            <Button onClick={handleSignOut}>Sign Out</Button>
          </Box>
          
          <Header variant="h1">Items Management</Header>
          
          <ItemsList
            onCreateClick={handleCreateClick}
            onEditClick={handleEditClick}
          />
        </SpaceBetween>
      </Container>

      <Modal
        visible={showCreateModal}
        onDismiss={() => setShowCreateModal(false)}
        header="Create New Item"
        size="medium"
      >
        <ItemForm
          onSuccess={handleFormSuccess}
          onCancel={handleFormCancel}
        />
      </Modal>

      <Modal
        visible={showEditModal}
        onDismiss={() => setShowEditModal(false)}
        header="Edit Item"
        size="medium"
      >
        {editingItem && (
          <ItemForm
            item={editingItem}
            onSuccess={handleFormSuccess}
            onCancel={handleFormCancel}
          />
        )}
      </Modal>
    </SpaceBetween>
  );
};