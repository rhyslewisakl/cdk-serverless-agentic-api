/**
 * User Item data model types
 */

export type ItemStatus = 'active' | 'inactive' | 'archived';

export interface ItemMetadata {
  tags: string[];
  priority: number;
  dueDate?: string;
}

export interface UserItem {
  id: string;           // UUID primary key
  userId: string;       // Cognito user ID (GSI partition key)
  title: string;        // Item title
  description: string;  // Item description
  category: string;     // Item category
  status: ItemStatus;
  createdAt: string;    // ISO timestamp
  updatedAt: string;    // ISO timestamp
  metadata?: ItemMetadata; // Optional metadata
}

// Request types for CRUD operations
export interface CreateItemRequest {
  title: string;
  description: string;
  category: string;
  status?: ItemStatus;
  metadata?: Partial<ItemMetadata>;
}

export interface UpdateItemRequest {
  title?: string;
  description?: string;
  category?: string;
  status?: ItemStatus;
  metadata?: Partial<ItemMetadata>;
}

// Response types
export interface ItemListResponse {
  items: UserItem[];
  nextToken?: string;
  count: number;
}

// Form validation types
export interface ItemFormData {
  title: string;
  description: string;
  category: string;
  status: ItemStatus;
  tags: string[];
  priority: number;
  dueDate?: string;
}

export interface ItemFormErrors {
  title?: string;
  description?: string;
  category?: string;
  status?: string;
  tags?: string;
  priority?: string;
  dueDate?: string;
}