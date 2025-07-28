/**
 * User Items service for CRUD operations
 */

import { UserItem, CreateItemRequest, UpdateItemRequest, ItemListResponse } from '../types/user-item';
import { PaginationParams } from '../types/api';
import { API_ENDPOINTS } from '../utils/constants';
import { apiService } from './apiService';

class ItemService {
  /**
   * Get list of user's items with pagination
   */
  async getItems(params?: PaginationParams): Promise<ItemListResponse> {
    const queryParams = new URLSearchParams();
    
    if (params?.limit) {
      queryParams.append('limit', params.limit.toString());
    }
    
    if (params?.nextToken) {
      queryParams.append('nextToken', params.nextToken);
    }

    const url = `${API_ENDPOINTS.ITEMS.LIST}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    return apiService.get<ItemListResponse>(url);
  }

  /**
   * Get a specific item by ID
   */
  async getItem(id: string): Promise<UserItem> {
    return apiService.get<UserItem>(API_ENDPOINTS.ITEMS.GET(id));
  }

  /**
   * Create a new item
   */
  async createItem(itemData: CreateItemRequest): Promise<UserItem> {
    return apiService.post<UserItem>(API_ENDPOINTS.ITEMS.CREATE, itemData);
  }

  /**
   * Update an existing item
   */
  async updateItem(id: string, itemData: UpdateItemRequest): Promise<UserItem> {
    return apiService.put<UserItem>(API_ENDPOINTS.ITEMS.UPDATE(id), itemData);
  }

  /**
   * Delete an item
   */
  async deleteItem(id: string): Promise<void> {
    return apiService.delete(API_ENDPOINTS.ITEMS.DELETE(id));
  }

  /**
   * Search items by title or description
   */
  async searchItems(query: string, params?: PaginationParams): Promise<ItemListResponse> {
    const queryParams = new URLSearchParams();
    queryParams.append('search', query);
    
    if (params?.limit) {
      queryParams.append('limit', params.limit.toString());
    }
    
    if (params?.nextToken) {
      queryParams.append('nextToken', params.nextToken);
    }

    const url = `${API_ENDPOINTS.ITEMS.LIST}?${queryParams.toString()}`;
    return apiService.get<ItemListResponse>(url);
  }

  /**
   * Filter items by category
   */
  async getItemsByCategory(category: string, params?: PaginationParams): Promise<ItemListResponse> {
    const queryParams = new URLSearchParams();
    queryParams.append('category', category);
    
    if (params?.limit) {
      queryParams.append('limit', params.limit.toString());
    }
    
    if (params?.nextToken) {
      queryParams.append('nextToken', params.nextToken);
    }

    const url = `${API_ENDPOINTS.ITEMS.LIST}?${queryParams.toString()}`;
    return apiService.get<ItemListResponse>(url);
  }

  /**
   * Filter items by status
   */
  async getItemsByStatus(status: string, params?: PaginationParams): Promise<ItemListResponse> {
    const queryParams = new URLSearchParams();
    queryParams.append('status', status);
    
    if (params?.limit) {
      queryParams.append('limit', params.limit.toString());
    }
    
    if (params?.nextToken) {
      queryParams.append('nextToken', params.nextToken);
    }

    const url = `${API_ENDPOINTS.ITEMS.LIST}?${queryParams.toString()}`;
    return apiService.get<ItemListResponse>(url);
  }
}

// Export singleton instance
export const itemService = new ItemService();