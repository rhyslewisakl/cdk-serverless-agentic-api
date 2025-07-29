import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Button,
  Card,
  CardContent,
  CardActions,
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  IconButton,
  Chip,
  Alert,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { itemService, CreateItemRequest, UpdateItemRequest } from '../../services/itemService';
import { UserItem } from '../../types/user-item';
import { useToast } from '../../contexts/ToastContext';

const CATEGORIES = ['Personal', 'Work', 'Shopping', 'Health', 'Finance', 'Education', 'Travel', 'Other'];
const PRIORITIES = [
  { value: 1, label: 'Low' },
  { value: 2, label: 'Medium' },
  { value: 3, label: 'High' },
  { value: 4, label: 'Urgent' },
];

export const ItemsPage: React.FC = () => {
  const [items, setItems] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<UserItem | null>(null);
  const [formData, setFormData] = useState<CreateItemRequest>({
    title: '',
    description: '',
    category: 'Personal',
    priority: 2,
  });
  const { showToast } = useToast();

  const loadItems = async () => {
    try {
      setLoading(true);
      const data = await itemService.getItems();
      setItems(data);
    } catch (error) {
      showToast('Failed to load items', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadItems();
  }, []);

  const handleCreate = async () => {
    try {
      const createData = {
        title: formData.title,
        description: formData.description || '',
        category: formData.category,
        metadata: {
          priority: formData.priority,
          tags: []
        }
      };
      const newItem = await itemService.createItem(createData);
      setItems([newItem, ...items]);
      setDialogOpen(false);
      resetForm();
      showToast('Item created successfully', 'success');
    } catch (error) {
      showToast('Failed to create item', 'error');
    }
  };

  const handleUpdate = async () => {
    if (!editingItem) return;
    
    try {
      const updateData = {
        title: formData.title,
        description: formData.description,
        category: formData.category,
        metadata: {
          ...editingItem.metadata,
          priority: formData.priority,
        }
      };
      
      const updatedItem = await itemService.updateItem(editingItem.id, updateData);
      setItems(items.map(item => item.id === editingItem.id ? updatedItem : item));
      setDialogOpen(false);
      resetForm();
      showToast('Item updated successfully', 'success');
    } catch (error) {
      showToast('Failed to update item', 'error');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this item?')) return;
    
    try {
      await itemService.deleteItem(id);
      setItems(items.filter(item => item.id !== id));
      showToast('Item deleted successfully', 'success');
    } catch (error) {
      showToast('Failed to delete item', 'error');
    }
  };

  const openCreateDialog = () => {
    setEditingItem(null);
    resetForm();
    setDialogOpen(true);
  };

  const openEditDialog = (item: UserItem) => {
    setEditingItem(item);
    setFormData({
      title: item.title,
      description: item.description,
      category: item.category,
      priority: item.metadata?.priority || 2,
    });
    setDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      category: 'Personal',
      priority: 2,
    });
    setEditingItem(null);
  };

  const getPriorityColor = (priority: number) => {
    switch (priority) {
      case 1: return 'default';
      case 2: return 'primary';
      case 3: return 'warning';
      case 4: return 'error';
      default: return 'default';
    }
  };

  const getPriorityLabel = (priority: number) => {
    return PRIORITIES.find(p => p.value === priority)?.label || 'Unknown';
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
        <Typography variant="h4" component="h1">
          My Items
        </Typography>
        <Box display="flex" gap={2}>
          <IconButton onClick={loadItems} disabled={loading}>
            <RefreshIcon />
          </IconButton>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={openCreateDialog}
          >
            Add Item
          </Button>
        </Box>
      </Box>

      {loading ? (
        <Alert severity="info">Loading items...</Alert>
      ) : items.length === 0 ? (
        <Alert severity="info">
          No items found. Click "Add Item" to create your first item.
        </Alert>
      ) : (
        <Grid container spacing={3}>
          {items.map((item) => (
            <Grid item xs={12} sm={6} md={4} key={item.id}>
              <Card>
                <CardContent>
                  <Typography variant="h6" component="h2" gutterBottom>
                    {item.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" paragraph>
                    {item.description || 'No description'}
                  </Typography>
                  <Box display="flex" gap={1} mb={2}>
                    <Chip label={item.category} size="small" />
                    <Chip
                      label={getPriorityLabel(item.metadata?.priority || 2)}
                      size="small"
                      color={getPriorityColor(item.metadata?.priority || 2) as any}
                    />
                  </Box>
                  <Typography variant="caption" color="text.secondary">
                    Created: {new Date(item.createdAt).toLocaleDateString()}
                  </Typography>
                </CardContent>
                <CardActions>
                  <IconButton
                    size="small"
                    onClick={() => openEditDialog(item)}
                    color="primary"
                  >
                    <EditIcon />
                  </IconButton>
                  <IconButton
                    size="small"
                    onClick={() => handleDelete(item.id)}
                    color="error"
                  >
                    <DeleteIcon />
                  </IconButton>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingItem ? 'Edit Item' : 'Create New Item'}
        </DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Title"
            fullWidth
            variant="outlined"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label="Description"
            fullWidth
            multiline
            rows={3}
            variant="outlined"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            sx={{ mb: 2 }}
          />
          <TextField
            select
            margin="dense"
            label="Category"
            fullWidth
            variant="outlined"
            value={formData.category}
            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            sx={{ mb: 2 }}
          >
            {CATEGORIES.map((category) => (
              <MenuItem key={category} value={category}>
                {category}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            select
            margin="dense"
            label="Priority"
            fullWidth
            variant="outlined"
            value={formData.priority}
            onChange={(e) => setFormData({ ...formData, priority: Number(e.target.value) })}
          >
            {PRIORITIES.map((priority) => (
              <MenuItem key={priority.value} value={priority.value}>
                {priority.label}
              </MenuItem>
            ))}
          </TextField>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={editingItem ? handleUpdate : handleCreate}
            variant="contained"
            disabled={!formData.title.trim()}
          >
            {editingItem ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default ItemsPage;