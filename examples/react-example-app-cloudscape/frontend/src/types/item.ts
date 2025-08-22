export interface Item {
  itemId: string;
  userId: string;
  title: string;
  description: string;
  status: 'active' | 'inactive' | 'pending';
  category: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateItemRequest {
  title: string;
  description: string;
  status: 'active' | 'inactive' | 'pending';
  category: string;
}

export interface UpdateItemRequest {
  title?: string;
  description?: string;
  status?: 'active' | 'inactive' | 'pending';
  category?: string;
}