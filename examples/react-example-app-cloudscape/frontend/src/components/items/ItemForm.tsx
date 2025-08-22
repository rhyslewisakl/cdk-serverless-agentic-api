import React, { useState, useEffect } from 'react';
import {
  Form,
  FormField,
  Input,
  Textarea,
  Select,
  Button,
  SpaceBetween,
  Alert,
} from '@cloudscape-design/components';
import { useAppDispatch, useAppSelector } from '../../hooks/redux';
import { createItemAsync, updateItemAsync, clearError } from '../../store/itemsSlice';
import { type Item, type CreateItemRequest, type UpdateItemRequest } from '../../types/item';

interface ItemFormProps {
  item?: Item;
  onSuccess: () => void;
  onCancel: () => void;
}

const statusOptions = [
  { label: 'Active', value: 'active' },
  { label: 'Inactive', value: 'inactive' },
  { label: 'Pending', value: 'pending' },
];

const categoryOptions = [
  { label: 'General', value: 'general' },
  { label: 'Work', value: 'work' },
  { label: 'Personal', value: 'personal' },
  { label: 'Project', value: 'project' },
];

export const ItemForm: React.FC<ItemFormProps> = ({ item, onSuccess, onCancel }) => {
  const dispatch = useAppDispatch();
  const { isLoading, error } = useAppSelector((state) => state.items);
  
  const [title, setTitle] = useState(item?.title || '');
  const [description, setDescription] = useState(item?.description || '');
  const [status, setStatus] = useState(item?.status || 'active');
  const [category, setCategory] = useState(item?.category || 'general');

  const [titleError, setTitleError] = useState('');
  const [descriptionError, setDescriptionError] = useState('');

  useEffect(() => {
    if (item) {
      setTitle(item.title);
      setDescription(item.description);
      setStatus(item.status);
      setCategory(item.category);
    }
  }, [item]);

  const validateForm = () => {
    let isValid = true;
    
    if (!title.trim()) {
      setTitleError('Title is required');
      isValid = false;
    } else {
      setTitleError('');
    }
    
    if (!description.trim()) {
      setDescriptionError('Description is required');
      isValid = false;
    } else {
      setDescriptionError('');
    }
    
    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    dispatch(clearError());

    try {
      if (item) {
        const updates: UpdateItemRequest = {
          title: title.trim(),
          description: description.trim(),
          status: status as 'active' | 'inactive' | 'pending',
          category: category.trim(),
        };
        
        const result = await dispatch(updateItemAsync({ itemId: item.itemId, updates }));
        if (updateItemAsync.fulfilled.match(result)) {
          onSuccess();
        }
      } else {
        const newItem: CreateItemRequest = {
          title: title.trim(),
          description: description.trim(),
          status: status as 'active' | 'inactive' | 'pending',
          category: category.trim(),
        };
        
        const result = await dispatch(createItemAsync(newItem));
        if (createItemAsync.fulfilled.match(result)) {
          onSuccess();
        }
      }
    } catch (error) {
      console.error('Form submission error:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <Form
        actions={
          <SpaceBetween direction="horizontal" size="xs">
            <Button variant="link" onClick={onCancel}>
              Cancel
            </Button>
            <Button variant="primary" loading={isLoading} formAction="submit">
              {item ? 'Update' : 'Create'} Item
            </Button>
          </SpaceBetween>
        }
      >
        <SpaceBetween direction="vertical" size="l">
          {error && (
            <Alert type="error" dismissible onDismiss={() => dispatch(clearError())}>
              {error}
            </Alert>
          )}
          
          <FormField 
            label="Title" 
            errorText={titleError}
            description="Enter a descriptive title for your item"
          >
            <Input
              value={title}
              onChange={({ detail }) => {
                setTitle(detail.value);
                if (titleError) setTitleError('');
              }}
              placeholder="Enter item title"
              ariaLabel="Item title"
              invalid={!!titleError}
            />
          </FormField>
          
          <FormField 
            label="Description" 
            errorText={descriptionError}
            description="Provide a detailed description of your item"
          >
            <Textarea
              value={description}
              onChange={({ detail }) => {
                setDescription(detail.value);
                if (descriptionError) setDescriptionError('');
              }}
              placeholder="Enter item description"
              rows={4}
              ariaLabel="Item description"
              invalid={!!descriptionError}
            />
          </FormField>
          
          <FormField 
            label="Category"
            description="Choose the category that best fits your item"
          >
            <Select
              selectedOption={categoryOptions.find(opt => opt.value === category) || null}
              onChange={({ detail }) => setCategory(detail.selectedOption.value || 'general')}
              options={categoryOptions}
              placeholder="Select category"
              ariaLabel="Item category"
            />
          </FormField>
          
          <FormField 
            label="Status"
            description="Set the current status of your item"
          >
            <Select
              selectedOption={statusOptions.find(opt => opt.value === status) || null}
              onChange={({ detail }) => setStatus((detail.selectedOption.value as 'active' | 'inactive' | 'pending') || 'active')}
              options={statusOptions}
              placeholder="Select status"
              ariaLabel="Item status"
            />
          </FormField>
        </SpaceBetween>
      </Form>
    </form>
  );
};