/**
 * Items API Lambda functions
 * Handles CRUD operations for user items with proper authentication and validation
 */

import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import { DynamoDBService } from './dynamodb-service';
import { CreateUserItemRequest, UpdateUserItemRequest, ListUserItemsRequest } from './types';

let dynamoService: DynamoDBService;

function getDynamoService(): DynamoDBService {
  if (!dynamoService) {
    dynamoService = new DynamoDBService();
  }
  return dynamoService;
}

// For testing purposes
export function setDynamoService(service: DynamoDBService): void {
  dynamoService = service;
}

/**
 * Extract user ID from Cognito JWT claims
 */
function getUserIdFromEvent(event: APIGatewayProxyEvent): string | null {
  try {
    const claims = event.requestContext.authorizer?.claims;
    return claims?.sub || null;
  } catch (error) {
    console.error('Error extracting user ID:', error);
    return null;
  }
}

/**
 * Create standardized API response
 */
function createResponse(statusCode: number, body: any, headers: Record<string, string> = {}): APIGatewayProxyResult {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
      'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
      ...headers
    },
    body: JSON.stringify(body)
  };
}

/**
 * Create error response
 */
function createErrorResponse(statusCode: number, message: string, error?: any): APIGatewayProxyResult {
  const errorBody = {
    error: 'API Error',
    message,
    timestamp: new Date().toISOString(),
    requestId: error?.requestId
  };

  if (error?.details) {
    errorBody.details = error.details;
  }

  return createResponse(statusCode, errorBody);
}

/**
 * Validate request body
 */
function validateCreateRequest(body: any): CreateUserItemRequest | null {
  if (!body || typeof body !== 'object') {
    return null;
  }

  if (!body.title || typeof body.title !== 'string' || body.title.trim().length === 0) {
    return null;
  }

  if (!body.description || typeof body.description !== 'string') {
    return null;
  }

  if (!body.category || typeof body.category !== 'string' || body.category.trim().length === 0) {
    return null;
  }

  const validStatuses = ['active', 'inactive', 'archived'];
  if (body.status && !validStatuses.includes(body.status)) {
    return null;
  }

  return {
    title: body.title.trim(),
    description: body.description.trim(),
    category: body.category.trim(),
    status: body.status || 'active',
    metadata: body.metadata
  };
}

/**
 * Validate update request body
 */
function validateUpdateRequest(body: any): UpdateUserItemRequest | null {
  if (!body || typeof body !== 'object') {
    return null;
  }

  const updateRequest: UpdateUserItemRequest = {};

  if (body.title !== undefined) {
    if (typeof body.title !== 'string' || body.title.trim().length === 0) {
      return null;
    }
    updateRequest.title = body.title.trim();
  }

  if (body.description !== undefined) {
    if (typeof body.description !== 'string') {
      return null;
    }
    updateRequest.description = body.description.trim();
  }

  if (body.category !== undefined) {
    if (typeof body.category !== 'string' || body.category.trim().length === 0) {
      return null;
    }
    updateRequest.category = body.category.trim();
  }

  if (body.status !== undefined) {
    const validStatuses = ['active', 'inactive', 'archived'];
    if (!validStatuses.includes(body.status)) {
      return null;
    }
    updateRequest.status = body.status;
  }

  if (body.metadata !== undefined) {
    updateRequest.metadata = body.metadata;
  }

  return updateRequest;
}

/**
 * GET /api/items - List user's items with pagination
 */
export async function listItems(event: APIGatewayProxyEvent, context: Context): Promise<APIGatewayProxyResult> {
  try {
    const userId = getUserIdFromEvent(event);
    if (!userId) {
      return createErrorResponse(401, 'Unauthorized: User not authenticated');
    }

    const queryParams = event.queryStringParameters || {};
    const request: ListUserItemsRequest = {
      limit: queryParams.limit ? parseInt(queryParams.limit, 10) : undefined,
      lastEvaluatedKey: queryParams.lastEvaluatedKey || undefined,
      status: queryParams.status as any || undefined
    };

    // Validate limit parameter
    if (request.limit && (request.limit < 1 || request.limit > 100)) {
      return createErrorResponse(400, 'Invalid limit parameter. Must be between 1 and 100');
    }

    const result = await getDynamoService().listItems(userId, request);
    return createResponse(200, result);

  } catch (error: any) {
    console.error('Error listing items:', error);
    return createErrorResponse(error.statusCode || 500, error.message || 'Internal server error', error);
  }
}

/**
 * POST /api/items - Create new item with validation
 */
export async function createItem(event: APIGatewayProxyEvent, context: Context): Promise<APIGatewayProxyResult> {
  try {
    const userId = getUserIdFromEvent(event);
    if (!userId) {
      return createErrorResponse(401, 'Unauthorized: User not authenticated');
    }

    if (!event.body) {
      return createErrorResponse(400, 'Request body is required');
    }

    let requestBody;
    try {
      requestBody = JSON.parse(event.body);
    } catch (error) {
      return createErrorResponse(400, 'Invalid JSON in request body');
    }

    const createRequest = validateCreateRequest(requestBody);
    if (!createRequest) {
      return createErrorResponse(400, 'Invalid request body. Required fields: title, description, category');
    }

    const result = await getDynamoService().createItem(userId, createRequest);
    return createResponse(201, result);

  } catch (error: any) {
    console.error('Error creating item:', error);
    return createErrorResponse(error.statusCode || 500, error.message || 'Internal server error', error);
  }
}

/**
 * GET /api/items/{id} - Retrieve specific item
 */
export async function getItem(event: APIGatewayProxyEvent, context: Context): Promise<APIGatewayProxyResult> {
  try {
    const userId = getUserIdFromEvent(event);
    if (!userId) {
      return createErrorResponse(401, 'Unauthorized: User not authenticated');
    }

    const itemId = event.pathParameters?.id;
    if (!itemId) {
      return createErrorResponse(400, 'Item ID is required');
    }

    const result = await getDynamoService().getItem(userId, itemId);
    if (!result) {
      return createErrorResponse(404, 'Item not found');
    }

    return createResponse(200, result);

  } catch (error: any) {
    console.error('Error getting item:', error);
    return createErrorResponse(error.statusCode || 500, error.message || 'Internal server error', error);
  }
}

/**
 * PUT /api/items/{id} - Update existing item
 */
export async function updateItem(event: APIGatewayProxyEvent, context: Context): Promise<APIGatewayProxyResult> {
  try {
    const userId = getUserIdFromEvent(event);
    if (!userId) {
      return createErrorResponse(401, 'Unauthorized: User not authenticated');
    }

    const itemId = event.pathParameters?.id;
    if (!itemId) {
      return createErrorResponse(400, 'Item ID is required');
    }

    if (!event.body) {
      return createErrorResponse(400, 'Request body is required');
    }

    let requestBody;
    try {
      requestBody = JSON.parse(event.body);
    } catch (error) {
      return createErrorResponse(400, 'Invalid JSON in request body');
    }

    const updateRequest = validateUpdateRequest(requestBody);
    if (!updateRequest) {
      return createErrorResponse(400, 'Invalid request body');
    }

    // Check if at least one field is being updated
    if (Object.keys(updateRequest).length === 0) {
      return createErrorResponse(400, 'At least one field must be provided for update');
    }

    const result = await getDynamoService().updateItem(userId, itemId, updateRequest);
    if (!result) {
      return createErrorResponse(404, 'Item not found');
    }

    return createResponse(200, result);

  } catch (error: any) {
    console.error('Error updating item:', error);
    return createErrorResponse(error.statusCode || 500, error.message || 'Internal server error', error);
  }
}

/**
 * DELETE /api/items/{id} - Remove item
 */
export async function deleteItem(event: APIGatewayProxyEvent, context: Context): Promise<APIGatewayProxyResult> {
  try {
    const userId = getUserIdFromEvent(event);
    if (!userId) {
      return createErrorResponse(401, 'Unauthorized: User not authenticated');
    }

    const itemId = event.pathParameters?.id;
    if (!itemId) {
      return createErrorResponse(400, 'Item ID is required');
    }

    const result = await getDynamoService().deleteItem(userId, itemId);
    if (!result) {
      return createErrorResponse(404, 'Item not found');
    }

    return createResponse(204, null);

  } catch (error: any) {
    console.error('Error deleting item:', error);
    return createErrorResponse(error.statusCode || 500, error.message || 'Internal server error', error);
  }
}