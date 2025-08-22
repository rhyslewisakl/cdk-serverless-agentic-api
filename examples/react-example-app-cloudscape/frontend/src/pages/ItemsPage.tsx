import React, { useState, useEffect } from 'react';
import {
  Container,
  Header,
  SpaceBetween,
  Modal,
} from '@cloudscape-design/components';
import { ItemsList } from '../components/items/ItemsList';
import { ItemForm } from '../components/items/ItemForm';
import { AppLayout } from '../components/layout/AppLayout';
import { apiService } from '../services/api';
import { type Item } from '../types/item';

export const ItemsPage: React.FC = () => {
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

  return (
    <AppLayout 
      breadcrumbs={[{ text: 'Items' }]}
    >
      <Container>
        <SpaceBetween direction="vertical" size="l">
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
    </AppLayout>
  );
};