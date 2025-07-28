/**
 * Unit tests for ApiService
 */

import axios from 'axios';
import { apiService } from '../apiService';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

// Mock auth service
jest.mock('../authService', () => ({
  authService: {
    getAuthToken: jest.fn(),
  },
}));

describe('ApiService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup axios mock
    mockedAxios.create.mockReturnValue({
      interceptors: {
        request: { use: jest.fn() },
        response: { use: jest.fn() },
      },
      defaults: { baseURL: '' },
      get: jest.fn(),
      post: jest.fn(),
      put: jest.fn(),
      delete: jest.fn(),
    } as any);
  });

  describe('initialization', () => {
    it('should create axios instance with correct configuration', () => {
      expect(mockedAxios.create).toHaveBeenCalledWith({
        baseURL: '',
        timeout: 30000,
        headers: {
          'Content-Type': 'application/json',
        },
      });
    });
  });

  describe('updateBaseURL', () => {
    it('should update the base URL', () => {
      const mockAxiosInstance = {
        defaults: { baseURL: '' },
        interceptors: {
          request: { use: jest.fn() },
          response: { use: jest.fn() },
        },
      };
      
      mockedAxios.create.mockReturnValue(mockAxiosInstance as any);
      
      apiService.updateBaseURL('https://api.example.com');
      
      expect(mockAxiosInstance.defaults.baseURL).toBe('https://api.example.com');
    });
  });

  describe('HTTP methods', () => {
    let mockAxiosInstance: any;

    beforeEach(() => {
      mockAxiosInstance = {
        get: jest.fn(),
        post: jest.fn(),
        put: jest.fn(),
        delete: jest.fn(),
        interceptors: {
          request: { use: jest.fn() },
          response: { use: jest.fn() },
        },
        defaults: { baseURL: '' },
      };
      
      mockedAxios.create.mockReturnValue(mockAxiosInstance);
    });

    describe('get', () => {
      it('should make GET request and return data', async () => {
        const mockResponse = { data: { data: { id: 1, name: 'Test' } } };
        mockAxiosInstance.get.mockResolvedValue(mockResponse);

        const result = await apiService.get('/test');

        expect(mockAxiosInstance.get).toHaveBeenCalledWith('/test', undefined);
        expect(result).toEqual({ id: 1, name: 'Test' });
      });

      it('should handle API response without data wrapper', async () => {
        const mockResponse = { data: { id: 1, name: 'Test' } };
        mockAxiosInstance.get.mockResolvedValue(mockResponse);

        const result = await apiService.get('/test');

        expect(result).toEqual({ id: 1, name: 'Test' });
      });
    });

    describe('post', () => {
      it('should make POST request with data', async () => {
        const mockResponse = { data: { data: { id: 1, name: 'Created' } } };
        const postData = { name: 'Test' };
        
        mockAxiosInstance.post.mockResolvedValue(mockResponse);

        const result = await apiService.post('/test', postData);

        expect(mockAxiosInstance.post).toHaveBeenCalledWith('/test', postData, undefined);
        expect(result).toEqual({ id: 1, name: 'Created' });
      });
    });

    describe('put', () => {
      it('should make PUT request with data', async () => {
        const mockResponse = { data: { data: { id: 1, name: 'Updated' } } };
        const putData = { name: 'Updated Test' };
        
        mockAxiosInstance.put.mockResolvedValue(mockResponse);

        const result = await apiService.put('/test/1', putData);

        expect(mockAxiosInstance.put).toHaveBeenCalledWith('/test/1', putData, undefined);
        expect(result).toEqual({ id: 1, name: 'Updated' });
      });
    });

    describe('delete', () => {
      it('should make DELETE request', async () => {
        const mockResponse = { data: { success: true } };
        
        mockAxiosInstance.delete.mockResolvedValue(mockResponse);

        const result = await apiService.delete('/test/1');

        expect(mockAxiosInstance.delete).toHaveBeenCalledWith('/test/1', undefined);
        expect(result).toEqual({ success: true });
      });
    });
  });

  describe('error handling', () => {
    let mockAxiosInstance: any;

    beforeEach(() => {
      mockAxiosInstance = {
        get: jest.fn(),
        interceptors: {
          request: { use: jest.fn() },
          response: { use: jest.fn() },
        },
        defaults: { baseURL: '' },
      };
      
      mockedAxios.create.mockReturnValue(mockAxiosInstance);
    });

    it('should handle API errors', async () => {
      const mockError = {
        error: 'Not Found',
        message: 'Resource not found',
      };
      
      mockAxiosInstance.get.mockRejectedValue(mockError);

      await expect(apiService.get('/test')).rejects.toThrow('Resource not found');
    });

    it('should handle generic errors', async () => {
      const mockError = new Error('Network error');
      
      mockAxiosInstance.get.mockRejectedValue(mockError);

      await expect(apiService.get('/test')).rejects.toThrow('Network error');
    });
  });

  describe('API endpoints', () => {
    let mockAxiosInstance: any;

    beforeEach(() => {
      mockAxiosInstance = {
        get: jest.fn(),
        post: jest.fn(),
        interceptors: {
          request: { use: jest.fn() },
          response: { use: jest.fn() },
        },
        defaults: { baseURL: '' },
      };
      
      mockedAxios.create.mockReturnValue(mockAxiosInstance);
    });

    describe('getConfig', () => {
      it('should fetch configuration', async () => {
        const mockConfig = {
          region: 'us-east-1',
          userPoolId: 'us-east-1_test',
          userPoolWebClientId: 'test-client-id',
          apiEndpoint: 'https://api.example.com',
        };
        
        mockAxiosInstance.get.mockResolvedValue({ data: mockConfig });

        const result = await apiService.getConfig();

        expect(mockAxiosInstance.get).toHaveBeenCalledWith('/api/config');
        expect(result).toEqual(mockConfig);
      });
    });

    describe('getCurrentUserInfo', () => {
      it('should fetch current user info', async () => {
        const mockUser = {
          userId: 'user-123',
          email: 'test@example.com',
          emailVerified: true,
        };
        
        mockAxiosInstance.get.mockResolvedValue({ data: mockUser });

        const result = await apiService.getCurrentUserInfo();

        expect(mockAxiosInstance.get).toHaveBeenCalledWith('/api/whoami');
        expect(result).toEqual(mockUser);
      });
    });

    describe('changePassword', () => {
      it('should change password', async () => {
        mockAxiosInstance.post.mockResolvedValue({ data: { success: true } });

        await apiService.changePassword('oldPass', 'newPass');

        expect(mockAxiosInstance.post).toHaveBeenCalledWith('/api/auth/change-password', {
          oldPassword: 'oldPass',
          newPassword: 'newPass',
        });
      });
    });
  });
});