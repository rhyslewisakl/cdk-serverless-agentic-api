/**
 * Unit tests for DynamoDB service layer
 * Tests CRUD operations with mocked DynamoDB client
 */

import { describe, it, expect, beforeEach, vi, Mock } from 'vitest';
import { DynamoDBService } from '../dynamodb-service';
import { DynamoDBDocumentClient, PutCommand, GetCommand, UpdateCommand, DeleteCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';
import { CreateUserItemRequest, UpdateUserItemRequest, ListUserItemsRequest } from '../types';

// Mock the AWS SDK
vi.mock('@aws-sdk/client-dynamodb');
vi.mock('@aws-sdk/lib-dynamodb');
vi.mock('uuid', () => ({
  v4: () => 'test-uuid-123'
}));

describe('DynamoDBService', () => {
  let service: DynamoDBService;
  let mockSend: Mock;

  beforeEach(() => {
    // Set up environment variables
    process.env.USER_ITEMS_TABLE_NAME = 'test-table';
    process.env.USER_ITEMS_GSI_NAME = 'test-gsi';
    process.env.AWS_REGION = 'us-east-1';

    // Mock the DynamoDB client
    mockSend = vi.fn();
    (DynamoDBDocumentClient.from as Mock).mockReturnValue({
      send: mockSend
    });

    service = new DynamoDBService();
  });

  describe('constructor', () => {
    it('should throw error if required environment variables are missing', () => {
      delete process.env.USER_ITEMS_TABLE_NAME;
      expect(() => new DynamoDBService()).toThrow('Required environment variables');
    });
  });

  describe('createItem', () => {
    it('should create a new item successfully', async () => {
      const userId = 'user-123';
      const request: CreateUserItemRequest = {
        title: 'Test Item',
        description: 'Test Description',
        category: 'test',
        status: 'active',
        metadata: {
          tags: ['tag1', 'tag2'],
          priority: 1
        }
      };

      mockSend.mockResolvedValueOnce({});

      const result = await service.createItem(userId, request);

      expect(result).toMatchObject({
        id: 'test-uuid-123',
        userId: 'user-123',
        title: 'Test Item',
        description: 'Test Description',
        category: 'test',
        status: 'active',
        metadata: {
          tags: ['tag1', 'tag2'],
          priority: 1
        }
      });
      expect(result.createdAt).toBeDefined();
      expect(result.updatedAt).toBeDefined();
      expect(mockSend).toHaveBeenCalledWith(expect.any(PutCommand));
    });

    it('should use default status if not provided', async () => {
      const userId = 'user-123';
      const request: CreateUserItemRequest = {
        title: 'Test Item',
        description: 'Test Description',
        category: 'test'
      };

      mockSend.mockResolvedValueOnce({});

      const result = await service.createItem(userId, request);

      expect(result.status).toBe('active');
    });

    it('should handle DynamoDB errors', async () => {
      const userId = 'user-123';
      const request: CreateUserItemRequest = {
        title: 'Test Item',
        description: 'Test Description',
        category: 'test'
      };

      mockSend.mockRejectedValueOnce(new Error('DynamoDB error'));

      await expect(service.createItem(userId, request)).rejects.toThrow('Failed to create item');
    });
  });

  describe('getItem', () => {
    it('should return item if it exists and belongs to user', async () => {
      const userId = 'user-123';
      const itemId = 'item-123';
      const mockItem = {
        id: itemId,
        userId: userId,
        title: 'Test Item',
        description: 'Test Description',
        category: 'test',
        status: 'active',
        createdAt: '2023-01-01T00:00:00.000Z',
        updatedAt: '2023-01-01T00:00:00.000Z'
      };

      mockSend.mockResolvedValueOnce({ Item: mockItem });

      const result = await service.getItem(userId, itemId);

      expect(result).toEqual(mockItem);
      expect(mockSend).toHaveBeenCalledWith(expect.any(GetCommand));
    });

    it('should return null if item does not exist', async () => {
      const userId = 'user-123';
      const itemId = 'item-123';

      mockSend.mockResolvedValueOnce({});

      const result = await service.getItem(userId, itemId);

      expect(result).toBeNull();
    });

    it('should return null if item belongs to different user', async () => {
      const userId = 'user-123';
      const itemId = 'item-123';
      const mockItem = {
        id: itemId,
        userId: 'different-user',
        title: 'Test Item',
        description: 'Test Description',
        category: 'test',
        status: 'active',
        createdAt: '2023-01-01T00:00:00.000Z',
        updatedAt: '2023-01-01T00:00:00.000Z'
      };

      mockSend.mockResolvedValueOnce({ Item: mockItem });

      const result = await service.getItem(userId, itemId);

      expect(result).toBeNull();
    });

    it('should handle DynamoDB errors', async () => {
      const userId = 'user-123';
      const itemId = 'item-123';

      mockSend.mockRejectedValueOnce(new Error('DynamoDB error'));

      await expect(service.getItem(userId, itemId)).rejects.toThrow('Failed to get item');
    });
  });

  describe('updateItem', () => {
    it('should update item successfully', async () => {
      const userId = 'user-123';
      const itemId = 'item-123';
      const existingItem = {
        id: itemId,
        userId: userId,
        title: 'Old Title',
        description: 'Old Description',
        category: 'old',
        status: 'active' as const,
        createdAt: '2023-01-01T00:00:00.000Z',
        updatedAt: '2023-01-01T00:00:00.000Z'
      };
      const updateRequest: UpdateUserItemRequest = {
        title: 'New Title',
        description: 'New Description'
      };
      const updatedItem = {
        ...existingItem,
        title: 'New Title',
        description: 'New Description',
        updatedAt: '2023-01-02T00:00:00.000Z'
      };

      // Mock getItem call
      mockSend.mockResolvedValueOnce({ Item: existingItem });
      // Mock updateItem call
      mockSend.mockResolvedValueOnce({ Attributes: updatedItem });

      const result = await service.updateItem(userId, itemId, updateRequest);

      expect(result).toEqual(updatedItem);
      expect(mockSend).toHaveBeenCalledTimes(2);
      expect(mockSend).toHaveBeenNthCalledWith(2, expect.any(UpdateCommand));
    });

    it('should return null if item does not exist', async () => {
      const userId = 'user-123';
      const itemId = 'item-123';
      const updateRequest: UpdateUserItemRequest = {
        title: 'New Title'
      };

      // Mock getItem call returning null
      mockSend.mockResolvedValueOnce({});

      const result = await service.updateItem(userId, itemId, updateRequest);

      expect(result).toBeNull();
      expect(mockSend).toHaveBeenCalledTimes(1);
    });

    it('should handle conditional check failures', async () => {
      const userId = 'user-123';
      const itemId = 'item-123';
      const existingItem = {
        id: itemId,
        userId: userId,
        title: 'Old Title',
        description: 'Old Description',
        category: 'old',
        status: 'active' as const,
        createdAt: '2023-01-01T00:00:00.000Z',
        updatedAt: '2023-01-01T00:00:00.000Z'
      };
      const updateRequest: UpdateUserItemRequest = {
        title: 'New Title'
      };

      // Mock getItem call
      mockSend.mockResolvedValueOnce({ Item: existingItem });
      // Mock updateItem call with conditional check failure
      const error = new Error('Conditional check failed');
      error.name = 'ConditionalCheckFailedException';
      mockSend.mockRejectedValueOnce(error);

      const result = await service.updateItem(userId, itemId, updateRequest);

      expect(result).toBeNull();
    });
  });

  describe('deleteItem', () => {
    it('should delete item successfully', async () => {
      const userId = 'user-123';
      const itemId = 'item-123';

      mockSend.mockResolvedValueOnce({});

      const result = await service.deleteItem(userId, itemId);

      expect(result).toBe(true);
      expect(mockSend).toHaveBeenCalledWith(expect.any(DeleteCommand));
    });

    it('should return false if item does not exist or belongs to different user', async () => {
      const userId = 'user-123';
      const itemId = 'item-123';

      const error = new Error('Conditional check failed');
      error.name = 'ConditionalCheckFailedException';
      mockSend.mockRejectedValueOnce(error);

      const result = await service.deleteItem(userId, itemId);

      expect(result).toBe(false);
    });

    it('should handle DynamoDB errors', async () => {
      const userId = 'user-123';
      const itemId = 'item-123';

      mockSend.mockRejectedValueOnce(new Error('DynamoDB error'));

      await expect(service.deleteItem(userId, itemId)).rejects.toThrow('Failed to delete item');
    });
  });

  describe('listItems', () => {
    it('should list items successfully', async () => {
      const userId = 'user-123';
      const mockItems = [
        {
          id: 'item-1',
          userId: userId,
          title: 'Item 1',
          description: 'Description 1',
          category: 'test',
          status: 'active',
          createdAt: '2023-01-01T00:00:00.000Z',
          updatedAt: '2023-01-01T00:00:00.000Z'
        },
        {
          id: 'item-2',
          userId: userId,
          title: 'Item 2',
          description: 'Description 2',
          category: 'test',
          status: 'active',
          createdAt: '2023-01-02T00:00:00.000Z',
          updatedAt: '2023-01-02T00:00:00.000Z'
        }
      ];

      mockSend.mockResolvedValueOnce({
        Items: mockItems,
        Count: 2
      });

      const result = await service.listItems(userId);

      expect(result.items).toEqual(mockItems);
      expect(result.count).toBe(2);
      expect(result.lastEvaluatedKey).toBeUndefined();
      expect(mockSend).toHaveBeenCalledWith(expect.any(QueryCommand));
    });

    it('should handle pagination', async () => {
      const userId = 'user-123';
      const request: ListUserItemsRequest = {
        limit: 10,
        lastEvaluatedKey: JSON.stringify({ id: 'item-1', userId: userId })
      };

      mockSend.mockResolvedValueOnce({
        Items: [],
        Count: 0,
        LastEvaluatedKey: { id: 'item-2', userId: userId }
      });

      const result = await service.listItems(userId, request);

      expect(result.lastEvaluatedKey).toBeDefined();
    });

    it('should handle status filtering', async () => {
      const userId = 'user-123';
      const request: ListUserItemsRequest = {
        status: 'archived'
      };

      mockSend.mockResolvedValueOnce({
        Items: [],
        Count: 0
      });

      await service.listItems(userId, request);

      expect(mockSend).toHaveBeenCalledWith(expect.any(QueryCommand));
      expect(mockSend).toHaveBeenCalledTimes(1);
    });

    it('should handle invalid lastEvaluatedKey', async () => {
      const userId = 'user-123';
      const request: ListUserItemsRequest = {
        lastEvaluatedKey: 'invalid-json'
      };

      await expect(service.listItems(userId, request)).rejects.toThrow('Invalid lastEvaluatedKey format');
    });

    it('should handle DynamoDB errors', async () => {
      const userId = 'user-123';

      mockSend.mockRejectedValueOnce(new Error('DynamoDB error'));

      await expect(service.listItems(userId)).rejects.toThrow('Failed to list items');
    });
  });

  describe('error handling', () => {
    it('should map DynamoDB errors to appropriate status codes', async () => {
      const userId = 'user-123';
      const itemId = 'item-123';

      const validationError = new Error('Validation error');
      validationError.name = 'ValidationException';
      mockSend.mockRejectedValueOnce(validationError);

      try {
        await service.getItem(userId, itemId);
      } catch (error: any) {
        expect(error.statusCode).toBe(400);
      }
    });
  });
});