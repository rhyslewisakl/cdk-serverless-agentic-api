import axios, { type AxiosInstance, type AxiosResponse } from 'axios';
import { authService } from './auth';
import { type Item, type CreateItemRequest, type UpdateItemRequest } from '../types/item';

class ApiService {
  private client: AxiosInstance;
  private baseURL: string = '';

  constructor() {
    this.client = axios.create();
    this.setupInterceptors();
  }

  async initialize() {
    try {
      const response = await fetch('/api/config');
      const config = await response.json();
      this.baseURL = config.api.endpoints[0].endpoint;
      this.client.defaults.baseURL = this.baseURL;
    } catch (error) {
      console.error('Failed to initialize API service:', error);
      throw error;
    }
  }

  private setupInterceptors() {
    // Request interceptor to add auth token
    this.client.interceptors.request.use(
      async (config) => {
        const token = await authService.getAuthToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          // Handle unauthorized - could trigger logout
          console.error('Unauthorized request');
        }
        return Promise.reject(error);
      }
    );
  }

  // Items API methods
  async getItems(): Promise<Item[]> {
    const response: AxiosResponse<Item[]> = await this.client.get('/items');
    return response.data;
  }

  async createItem(item: CreateItemRequest): Promise<Item> {
    const response: AxiosResponse<Item> = await this.client.post('/items', item);
    return response.data;
  }

  async updateItem(itemId: string, updates: UpdateItemRequest): Promise<Item> {
    const response: AxiosResponse<Item> = await this.client.put(`/items/${itemId}`, updates);
    return response.data;
  }

  async deleteItem(itemId: string): Promise<void> {
    await this.client.delete(`/items/${itemId}`);
  }
}

export const apiService = new ApiService();