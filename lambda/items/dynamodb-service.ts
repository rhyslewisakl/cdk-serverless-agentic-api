/**
 * DynamoDB service layer with CRUD operations
 * Provides abstraction layer for DynamoDB operations with error handling and user isolation
 */

import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { 
  DynamoDBDocumentClient, 
  PutCommand, 
  GetCommand, 
  UpdateCommand, 
  DeleteCommand, 
  QueryCommand,
  PutCommandInput,
  GetCommandInput,
  UpdateCommandInput,
  DeleteCommandInput,
  QueryCommandInput
} from '@aws-sdk/lib-dynamodb';
import { v4 as uuidv4 } from 'uuid';
import { 
  UserItem, 
  CreateUserItemRequest, 
  UpdateUserItemRequest, 
  ListUserItemsRequest, 
  ListUserItemsResponse,
  DynamoDBError 
} from './types';

export class DynamoDBService {
  private client: DynamoDBDocumentClient;
  private tableName: string;
  private gsiName: string;

  constructor() {
    const dynamoClient = new DynamoDBClient({
      region: process.env.AWS_REGION || 'us-east-1',
    });
    
    this.client = DynamoDBDocumentClient.from(dynamoClient);
    this.tableName = process.env.USER_ITEMS_TABLE_NAME!;
    this.gsiName = process.env.USER_ITEMS_GSI_NAME!;

    if (!this.tableName || !this.gsiName) {
      throw new Error('Required environment variables USER_ITEMS_TABLE_NAME and USER_ITEMS_GSI_NAME are not set');
    }
  }

  /**
   * Create a new user item
   */
  async createItem(userId: string, request: CreateUserItemRequest): Promise<UserItem> {
    try {
      const now = new Date().toISOString();
      const item: UserItem = {
        id: uuidv4(),
        userId,
        title: request.title,
        description: request.description,
        category: request.category,
        status: request.status || 'active',
        createdAt: now,
        updatedAt: now,
        metadata: request.metadata
      };

      const params: PutCommandInput = {
        TableName: this.tableName,
        Item: item,
        ConditionExpression: 'attribute_not_exists(id)'
      };

      await this.client.send(new PutCommand(params));
      return item;
    } catch (error) {
      throw this.handleDynamoDBError(error, 'Failed to create item');
    }
  }

  /**
   * Get a specific user item by ID
   */
  async getItem(userId: string, itemId: string): Promise<UserItem | null> {
    try {
      const params: GetCommandInput = {
        TableName: this.tableName,
        Key: { id: itemId }
      };

      const result = await this.client.send(new GetCommand(params));
      
      if (!result.Item) {
        return null;
      }

      const item = result.Item as UserItem;
      
      // Ensure user can only access their own items
      if (item.userId !== userId) {
        return null;
      }

      return item;
    } catch (error) {
      throw this.handleDynamoDBError(error, 'Failed to get item');
    }
  }

  /**
   * Update an existing user item
   */
  async updateItem(userId: string, itemId: string, request: UpdateUserItemRequest): Promise<UserItem | null> {
    try {
      // First check if item exists and belongs to user
      const existingItem = await this.getItem(userId, itemId);
      if (!existingItem) {
        return null;
      }

      const now = new Date().toISOString();
      const updateExpressions: string[] = [];
      const expressionAttributeNames: Record<string, string> = {};
      const expressionAttributeValues: Record<string, any> = {};

      // Build dynamic update expression
      if (request.title !== undefined) {
        updateExpressions.push('#title = :title');
        expressionAttributeNames['#title'] = 'title';
        expressionAttributeValues[':title'] = request.title;
      }

      if (request.description !== undefined) {
        updateExpressions.push('#description = :description');
        expressionAttributeNames['#description'] = 'description';
        expressionAttributeValues[':description'] = request.description;
      }

      if (request.category !== undefined) {
        updateExpressions.push('#category = :category');
        expressionAttributeNames['#category'] = 'category';
        expressionAttributeValues[':category'] = request.category;
      }

      if (request.status !== undefined) {
        updateExpressions.push('#status = :status');
        expressionAttributeNames['#status'] = 'status';
        expressionAttributeValues[':status'] = request.status;
      }

      if (request.metadata !== undefined) {
        updateExpressions.push('#metadata = :metadata');
        expressionAttributeNames['#metadata'] = 'metadata';
        expressionAttributeValues[':metadata'] = request.metadata;
      }

      // Always update the updatedAt timestamp
      updateExpressions.push('#updatedAt = :updatedAt');
      expressionAttributeNames['#updatedAt'] = 'updatedAt';
      expressionAttributeValues[':updatedAt'] = now;

      const params: UpdateCommandInput = {
        TableName: this.tableName,
        Key: { id: itemId },
        UpdateExpression: `SET ${updateExpressions.join(', ')}`,
        ExpressionAttributeNames: expressionAttributeNames,
        ExpressionAttributeValues: expressionAttributeValues,
        ConditionExpression: 'userId = :userId',
        ReturnValues: 'ALL_NEW'
      };

      expressionAttributeValues[':userId'] = userId;

      const result = await this.client.send(new UpdateCommand(params));
      return result.Attributes as UserItem;
    } catch (error) {
      if (error.name === 'ConditionalCheckFailedException') {
        return null;
      }
      throw this.handleDynamoDBError(error, 'Failed to update item');
    }
  }

  /**
   * Delete a user item
   */
  async deleteItem(userId: string, itemId: string): Promise<boolean> {
    try {
      const params: DeleteCommandInput = {
        TableName: this.tableName,
        Key: { id: itemId },
        ConditionExpression: 'userId = :userId',
        ExpressionAttributeValues: {
          ':userId': userId
        }
      };

      await this.client.send(new DeleteCommand(params));
      return true;
    } catch (error) {
      if (error.name === 'ConditionalCheckFailedException') {
        return false;
      }
      throw this.handleDynamoDBError(error, 'Failed to delete item');
    }
  }

  /**
   * List user items with pagination and filtering
   */
  async listItems(userId: string, request: ListUserItemsRequest = {}): Promise<ListUserItemsResponse> {
    try {
      const limit = request.limit || 50;
      let filterExpression: string | undefined;
      let expressionAttributeValues: Record<string, any> = {
        ':userId': userId
      };

      // Add status filter if provided
      if (request.status) {
        filterExpression = '#status = :status';
        expressionAttributeValues[':status'] = request.status;
      }

      const params: QueryCommandInput = {
        TableName: this.tableName,
        IndexName: this.gsiName,
        KeyConditionExpression: 'userId = :userId',
        ExpressionAttributeValues: expressionAttributeValues,
        Limit: limit,
        ScanIndexForward: false, // Sort by createdAt descending
      };

      if (filterExpression) {
        params.FilterExpression = filterExpression;
        params.ExpressionAttributeNames = { '#status': 'status' };
      }

      if (request.lastEvaluatedKey) {
        try {
          params.ExclusiveStartKey = JSON.parse(request.lastEvaluatedKey);
        } catch (error) {
          throw new Error('Invalid lastEvaluatedKey format');
        }
      }

      const result = await this.client.send(new QueryCommand(params));

      return {
        items: (result.Items || []) as UserItem[],
        lastEvaluatedKey: result.LastEvaluatedKey ? JSON.stringify(result.LastEvaluatedKey) : undefined,
        count: result.Count || 0
      };
    } catch (error) {
      throw this.handleDynamoDBError(error, 'Failed to list items');
    }
  }

  /**
   * Handle DynamoDB errors and convert to application errors
   */
  private handleDynamoDBError(error: any, message: string): DynamoDBError {
    const dynamoError = new Error(`${message}: ${error.message}`) as DynamoDBError;
    dynamoError.code = error.name || error.code;
    dynamoError.statusCode = this.getStatusCodeFromError(error);
    return dynamoError;
  }

  /**
   * Map DynamoDB error types to HTTP status codes
   */
  private getStatusCodeFromError(error: any): number {
    switch (error.name || error.code) {
      case 'ConditionalCheckFailedException':
        return 404;
      case 'ValidationException':
        return 400;
      case 'ResourceNotFoundException':
        return 404;
      case 'ProvisionedThroughputExceededException':
      case 'ThrottlingException':
        return 429;
      case 'AccessDeniedException':
        return 403;
      default:
        return 500;
    }
  }
}