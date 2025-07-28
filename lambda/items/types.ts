/**
 * TypeScript interfaces for UserItem data model
 * Defines the structure for CRUD operations on user items
 */

export interface UserItem {
  id: string;           // UUID primary key
  userId: string;       // Cognito user ID (GSI partition key)
  title: string;        // Item title
  description: string;  // Item description
  category: string;     // Item category
  status: 'active' | 'inactive' | 'archived';
  createdAt: string;    // ISO timestamp
  updatedAt: string;    // ISO timestamp
  metadata?: {          // Optional metadata
    tags: string[];
    priority: number;
    dueDate?: string;
  };
}

export interface CreateUserItemRequest {
  title: string;
  description: string;
  category: string;
  status?: 'active' | 'inactive' | 'archived';
  metadata?: {
    tags?: string[];
    priority?: number;
    dueDate?: string;
  };
}

export interface UpdateUserItemRequest {
  title?: string;
  description?: string;
  category?: string;
  status?: 'active' | 'inactive' | 'archived';
  metadata?: {
    tags?: string[];
    priority?: number;
    dueDate?: string;
  };
}

export interface ListUserItemsRequest {
  limit?: number;
  lastEvaluatedKey?: string;
  status?: 'active' | 'inactive' | 'archived';
}

export interface ListUserItemsResponse {
  items: UserItem[];
  lastEvaluatedKey?: string;
  count: number;
}

export interface DynamoDBError extends Error {
  code?: string;
  statusCode?: number;
}