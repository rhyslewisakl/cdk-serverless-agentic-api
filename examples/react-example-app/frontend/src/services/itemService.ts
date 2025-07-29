import { apiService } from './apiService';
import { API_ENDPOINTS } from '../utils/constants';
import { UserItem } from '../types/user-item';

export interface CreateItemRequest {
  title: string;
  description?: string;
  category?: string;
  priority?: number;
}

export interface UpdateItemRequest {
  title?: string;
  description?: string;
  category?: string;
  priority?: number;
  status?: string;
}

class ItemService {
  async getItems(): Promise<UserItem[]> {
    const response = await apiService.get<{ items: UserItem[] }>(API_ENDPOINTS.ITEMS.LIST);
    return response.items || [];
  }

  async createItem(item: CreateItemRequest): Promise<UserItem> {
    return apiService.post<UserItem>(API_ENDPOINTS.ITEMS.CREATE, item);
  }

  async updateItem(id: string, item: UpdateItemRequest): Promise<UserItem> {
    return apiService.put<UserItem>(API_ENDPOINTS.ITEMS.UPDATE(id), item);
  }

  async deleteItem(id: string): Promise<void> {
    await apiService.delete(API_ENDPOINTS.ITEMS.DELETE(id));
  }
}

export const itemService = new ItemService();