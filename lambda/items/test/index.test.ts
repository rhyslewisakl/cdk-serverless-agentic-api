/**
 * Unit tests for Items API Lambda functions
 * Tests all CRUD endpoints with authentication and validation
 */

import { describe, it, expect, beforeEach, vi, Mock } from 'vitest';
import { APIGatewayProxyEvent, Context } from 'aws-lambda';
import * as itemsHandler from '../index';
import { DynamoDBService } from '../dynamodb-service';

// No need to mock the DynamoDB service since we're injecting it

describe('Items API Lambda Functions', () => {
  let mockDynamoService: {
    listItems: Mock;
    createItem: Mock;
    getItem: Mock;
    updateItem: Mock;
    deleteItem: Mock;
  };

  const mockContext: Context = {
    callbackWaitsForEmptyEventLoop: false,
    functionName: 'test-function',
    functionVersion: '1',
    invokedFunctionArn: 'arn:aws:lambda:us-east-1:123456789012:function:test-function',
    memoryLimitInMB: '128',
    awsRequestId: 'test-request-id',
    logGroupName: '/aws/lambda/test-function',
    logStreamName: '2023/01/01/[$LATEST]test-stream',
    getRemainingTimeInMillis: () => 30000,
    done: vi.fn(),
    fail: vi.fn(),
    succeed: vi.fn()
  };

  const createMockEvent = (overrides: Partial<APIGatewayProxyEvent> = {}): APIGatewayProxyEvent => ({
    body: null,
    headers: {},
    multiValueHeaders: {},
    httpMethod: 'GET',
    isBase64Encoded: false,
    path: '/api/items',
    pathParameters: null,
    queryStringParameters: null,
    multiValueQueryStringParameters: null,
    stageVariables: null,
    requestContext: {
      accountId: '123456789012',
      apiId: 'test-api',
      authorizer: {
        claims: {
          sub: 'user-123',
          email: 'test@example.com'
        }
      },
      httpMethod: 'GET',
      identity: {
        accessKey: null,
        accountId: null,
        apiKey: null,
        apiKeyId: null,
        caller: null,
        cognitoAuthenticationProvider: null,
        cognitoAuthenticationType: null,
        cognitoIdentityId: null,
        cognitoIdentityPoolId: null,
        principalOrgId: null,
        sourceIp: '127.0.0.1',
        user: null,
        userAgent: 'test-agent',
        userArn: null,
        clientCert: null
      },
      path: '/api/items',
      protocol: 'HTTP/1.1',
      requestId: 'test-request-id',
      requestTime: '01/Jan/2023:00:00:00 +0000',
      requestTimeEpoch: 1672531200,
      resourceId: 'test-resource',
      resourcePath: '/api/items',
      stage: 'test'
    },
    resource: '/api/items',
    ...overrides
  });

  beforeEach(() => {
    vi.clearAllMocks();
    
    mockDynamoService = {
      listItems: vi.fn(),
      createItem: vi.fn(),
      getItem: vi.fn(),
      updateItem: vi.fn(),
      deleteItem: vi.fn()
    };

    // Set the mock service for testing
    itemsHandler.setDynamoService(mockDynamoService as any);
  });

  describe('listItems', () => {
    it('should list items successfully', async () => {
      const mockItems = {
        items: [
          {
            id: 'item-1',
            userId: 'user-123',
            title: 'Test Item',
            description: 'Test Description',
            category: 'test',
            status: 'active',
            createdAt: '2023-01-01T00:00:00.000Z',
            updatedAt: '2023-01-01T00:00:00.000Z'
          }
        ],
        count: 1
      };

      mockDynamoService.listItems.mockResolvedValueOnce(mockItems);

      const event = createMockEvent();
      const result = await itemsHandler.listItems(event, mockContext);

      expect(result.statusCode).toBe(200);
      expect(JSON.parse(result.body)).toEqual(mockItems);
      expect(mockDynamoService.listItems).toHaveBeenCalledWith('user-123', {});
    });

    it('should handle query parameters', async () => {
      const mockItems = { items: [], count: 0 };
      mockDynamoService.listItems.mockResolvedValueOnce(mockItems);

      const event = createMockEvent({
        queryStringParameters: {
          limit: '10',
          status: 'active',
          lastEvaluatedKey: 'test-key'
        }
      });

      const result = await itemsHandler.listItems(event, mockContext);

      expect(result.statusCode).toBe(200);
      expect(mockDynamoService.listItems).toHaveBeenCalledWith('user-123', {
        limit: 10,
        status: 'active',
        lastEvaluatedKey: 'test-key'
      });
    });

    it('should return 401 if user not authenticated', async () => {
      const event = createMockEvent({
        requestContext: {
          ...createMockEvent().requestContext,
          authorizer: null
        }
      });

      const result = await itemsHandler.listItems(event, mockContext);

      expect(result.statusCode).toBe(401);
      expect(JSON.parse(result.body).message).toBe('Unauthorized: User not authenticated');
    });

    it('should validate limit parameter', async () => {
      const event = createMockEvent({
        queryStringParameters: { limit: '200' }
      });

      const result = await itemsHandler.listItems(event, mockContext);

      expect(result.statusCode).toBe(400);
      expect(JSON.parse(result.body).message).toContain('Invalid limit parameter');
    });

    it('should handle DynamoDB errors', async () => {
      const error = new Error('DynamoDB error');
      error.statusCode = 500;
      mockDynamoService.listItems.mockRejectedValueOnce(error);

      const event = createMockEvent();
      const result = await itemsHandler.listItems(event, mockContext);

      expect(result.statusCode).toBe(500);
      expect(JSON.parse(result.body).message).toBe('DynamoDB error');
    });
  });

  describe('createItem', () => {
    it('should create item successfully', async () => {
      const mockItem = {
        id: 'item-1',
        userId: 'user-123',
        title: 'Test Item',
        description: 'Test Description',
        category: 'test',
        status: 'active',
        createdAt: '2023-01-01T00:00:00.000Z',
        updatedAt: '2023-01-01T00:00:00.000Z'
      };

      mockDynamoService.createItem.mockResolvedValueOnce(mockItem);

      const event = createMockEvent({
        httpMethod: 'POST',
        body: JSON.stringify({
          title: 'Test Item',
          description: 'Test Description',
          category: 'test'
        })
      });

      const result = await itemsHandler.createItem(event, mockContext);

      expect(result.statusCode).toBe(201);
      expect(JSON.parse(result.body)).toEqual(mockItem);
      expect(mockDynamoService.createItem).toHaveBeenCalledWith('user-123', {
        title: 'Test Item',
        description: 'Test Description',
        category: 'test',
        status: 'active'
      });
    });

    it('should return 401 if user not authenticated', async () => {
      const event = createMockEvent({
        httpMethod: 'POST',
        body: JSON.stringify({ title: 'Test', description: 'Test', category: 'test' }),
        requestContext: {
          ...createMockEvent().requestContext,
          authorizer: null
        }
      });

      const result = await itemsHandler.createItem(event, mockContext);

      expect(result.statusCode).toBe(401);
    });

    it('should return 400 if body is missing', async () => {
      const event = createMockEvent({
        httpMethod: 'POST',
        body: null
      });

      const result = await itemsHandler.createItem(event, mockContext);

      expect(result.statusCode).toBe(400);
      expect(JSON.parse(result.body).message).toBe('Request body is required');
    });

    it('should return 400 if JSON is invalid', async () => {
      const event = createMockEvent({
        httpMethod: 'POST',
        body: 'invalid json'
      });

      const result = await itemsHandler.createItem(event, mockContext);

      expect(result.statusCode).toBe(400);
      expect(JSON.parse(result.body).message).toBe('Invalid JSON in request body');
    });

    it('should return 400 if required fields are missing', async () => {
      const event = createMockEvent({
        httpMethod: 'POST',
        body: JSON.stringify({ title: 'Test' })
      });

      const result = await itemsHandler.createItem(event, mockContext);

      expect(result.statusCode).toBe(400);
      expect(JSON.parse(result.body).message).toContain('Invalid request body');
    });

    it('should handle DynamoDB errors', async () => {
      const error = new Error('DynamoDB error');
      error.statusCode = 500;
      mockDynamoService.createItem.mockRejectedValueOnce(error);

      const event = createMockEvent({
        httpMethod: 'POST',
        body: JSON.stringify({
          title: 'Test Item',
          description: 'Test Description',
          category: 'test'
        })
      });

      const result = await itemsHandler.createItem(event, mockContext);

      expect(result.statusCode).toBe(500);
    });
  });

  describe('getItem', () => {
    it('should get item successfully', async () => {
      const mockItem = {
        id: 'item-1',
        userId: 'user-123',
        title: 'Test Item',
        description: 'Test Description',
        category: 'test',
        status: 'active',
        createdAt: '2023-01-01T00:00:00.000Z',
        updatedAt: '2023-01-01T00:00:00.000Z'
      };

      mockDynamoService.getItem.mockResolvedValueOnce(mockItem);

      const event = createMockEvent({
        pathParameters: { id: 'item-1' }
      });

      const result = await itemsHandler.getItem(event, mockContext);

      expect(result.statusCode).toBe(200);
      expect(JSON.parse(result.body)).toEqual(mockItem);
      expect(mockDynamoService.getItem).toHaveBeenCalledWith('user-123', 'item-1');
    });

    it('should return 401 if user not authenticated', async () => {
      const event = createMockEvent({
        pathParameters: { id: 'item-1' },
        requestContext: {
          ...createMockEvent().requestContext,
          authorizer: null
        }
      });

      const result = await itemsHandler.getItem(event, mockContext);

      expect(result.statusCode).toBe(401);
    });

    it('should return 400 if item ID is missing', async () => {
      const event = createMockEvent({
        pathParameters: null
      });

      const result = await itemsHandler.getItem(event, mockContext);

      expect(result.statusCode).toBe(400);
      expect(JSON.parse(result.body).message).toBe('Item ID is required');
    });

    it('should return 404 if item not found', async () => {
      mockDynamoService.getItem.mockResolvedValueOnce(null);

      const event = createMockEvent({
        pathParameters: { id: 'item-1' }
      });

      const result = await itemsHandler.getItem(event, mockContext);

      expect(result.statusCode).toBe(404);
      expect(JSON.parse(result.body).message).toBe('Item not found');
    });

    it('should handle DynamoDB errors', async () => {
      const error = new Error('DynamoDB error');
      error.statusCode = 500;
      mockDynamoService.getItem.mockRejectedValueOnce(error);

      const event = createMockEvent({
        pathParameters: { id: 'item-1' }
      });

      const result = await itemsHandler.getItem(event, mockContext);

      expect(result.statusCode).toBe(500);
    });
  });

  describe('updateItem', () => {
    it('should update item successfully', async () => {
      const mockItem = {
        id: 'item-1',
        userId: 'user-123',
        title: 'Updated Item',
        description: 'Updated Description',
        category: 'test',
        status: 'active',
        createdAt: '2023-01-01T00:00:00.000Z',
        updatedAt: '2023-01-02T00:00:00.000Z'
      };

      mockDynamoService.updateItem.mockResolvedValueOnce(mockItem);

      const event = createMockEvent({
        httpMethod: 'PUT',
        pathParameters: { id: 'item-1' },
        body: JSON.stringify({
          title: 'Updated Item',
          description: 'Updated Description'
        })
      });

      const result = await itemsHandler.updateItem(event, mockContext);

      expect(result.statusCode).toBe(200);
      expect(JSON.parse(result.body)).toEqual(mockItem);
      expect(mockDynamoService.updateItem).toHaveBeenCalledWith('user-123', 'item-1', {
        title: 'Updated Item',
        description: 'Updated Description'
      });
    });

    it('should return 401 if user not authenticated', async () => {
      const event = createMockEvent({
        httpMethod: 'PUT',
        pathParameters: { id: 'item-1' },
        body: JSON.stringify({ title: 'Updated' }),
        requestContext: {
          ...createMockEvent().requestContext,
          authorizer: null
        }
      });

      const result = await itemsHandler.updateItem(event, mockContext);

      expect(result.statusCode).toBe(401);
    });

    it('should return 400 if item ID is missing', async () => {
      const event = createMockEvent({
        httpMethod: 'PUT',
        pathParameters: null,
        body: JSON.stringify({ title: 'Updated' })
      });

      const result = await itemsHandler.updateItem(event, mockContext);

      expect(result.statusCode).toBe(400);
      expect(JSON.parse(result.body).message).toBe('Item ID is required');
    });

    it('should return 400 if body is missing', async () => {
      const event = createMockEvent({
        httpMethod: 'PUT',
        pathParameters: { id: 'item-1' },
        body: null
      });

      const result = await itemsHandler.updateItem(event, mockContext);

      expect(result.statusCode).toBe(400);
      expect(JSON.parse(result.body).message).toBe('Request body is required');
    });

    it('should return 400 if no fields to update', async () => {
      const event = createMockEvent({
        httpMethod: 'PUT',
        pathParameters: { id: 'item-1' },
        body: JSON.stringify({})
      });

      const result = await itemsHandler.updateItem(event, mockContext);

      expect(result.statusCode).toBe(400);
      expect(JSON.parse(result.body).message).toBe('At least one field must be provided for update');
    });

    it('should return 404 if item not found', async () => {
      mockDynamoService.updateItem.mockResolvedValueOnce(null);

      const event = createMockEvent({
        httpMethod: 'PUT',
        pathParameters: { id: 'item-1' },
        body: JSON.stringify({ title: 'Updated' })
      });

      const result = await itemsHandler.updateItem(event, mockContext);

      expect(result.statusCode).toBe(404);
      expect(JSON.parse(result.body).message).toBe('Item not found');
    });

    it('should handle DynamoDB errors', async () => {
      const error = new Error('DynamoDB error');
      error.statusCode = 500;
      mockDynamoService.updateItem.mockRejectedValueOnce(error);

      const event = createMockEvent({
        httpMethod: 'PUT',
        pathParameters: { id: 'item-1' },
        body: JSON.stringify({ title: 'Updated' })
      });

      const result = await itemsHandler.updateItem(event, mockContext);

      expect(result.statusCode).toBe(500);
    });
  });

  describe('deleteItem', () => {
    it('should delete item successfully', async () => {
      mockDynamoService.deleteItem.mockResolvedValueOnce(true);

      const event = createMockEvent({
        httpMethod: 'DELETE',
        pathParameters: { id: 'item-1' }
      });

      const result = await itemsHandler.deleteItem(event, mockContext);

      expect(result.statusCode).toBe(204);
      expect(mockDynamoService.deleteItem).toHaveBeenCalledWith('user-123', 'item-1');
    });

    it('should return 401 if user not authenticated', async () => {
      const event = createMockEvent({
        httpMethod: 'DELETE',
        pathParameters: { id: 'item-1' },
        requestContext: {
          ...createMockEvent().requestContext,
          authorizer: null
        }
      });

      const result = await itemsHandler.deleteItem(event, mockContext);

      expect(result.statusCode).toBe(401);
    });

    it('should return 400 if item ID is missing', async () => {
      const event = createMockEvent({
        httpMethod: 'DELETE',
        pathParameters: null
      });

      const result = await itemsHandler.deleteItem(event, mockContext);

      expect(result.statusCode).toBe(400);
      expect(JSON.parse(result.body).message).toBe('Item ID is required');
    });

    it('should return 404 if item not found', async () => {
      mockDynamoService.deleteItem.mockResolvedValueOnce(false);

      const event = createMockEvent({
        httpMethod: 'DELETE',
        pathParameters: { id: 'item-1' }
      });

      const result = await itemsHandler.deleteItem(event, mockContext);

      expect(result.statusCode).toBe(404);
      expect(JSON.parse(result.body).message).toBe('Item not found');
    });

    it('should handle DynamoDB errors', async () => {
      const error = new Error('DynamoDB error');
      error.statusCode = 500;
      mockDynamoService.deleteItem.mockRejectedValueOnce(error);

      const event = createMockEvent({
        httpMethod: 'DELETE',
        pathParameters: { id: 'item-1' }
      });

      const result = await itemsHandler.deleteItem(event, mockContext);

      expect(result.statusCode).toBe(500);
    });
  });
});