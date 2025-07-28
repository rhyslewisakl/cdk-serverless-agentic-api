/**
 * Tests for ErrorService
 */

import { errorService } from '../errorService';

// Mock console methods
const originalConsole = {
  group: console.group,
  error: console.error,
  groupEnd: console.groupEnd,
};

beforeAll(() => {
  console.group = jest.fn();
  console.error = jest.fn();
  console.groupEnd = jest.fn();
});

afterAll(() => {
  console.group = originalConsole.group;
  console.error = originalConsole.error;
  console.groupEnd = originalConsole.groupEnd;
});

// Mock localStorage
const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
});

describe('ErrorService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    errorService.clearLogs();
    
    // Mock window.location
    Object.defineProperty(window, 'location', {
      value: { href: 'https://example.com/test' },
      writable: true,
    });

    // Mock navigator.userAgent
    Object.defineProperty(navigator, 'userAgent', {
      value: 'Test User Agent',
      writable: true,
    });
  });

  describe('logError', () => {
    it('logs error with basic information', () => {
      const error = new Error('Test error');
      const errorId = errorService.logError(error);

      expect(errorId).toMatch(/^error-\d+-[a-z0-9]+$/);

      const logs = errorService.getRecentLogs(1);
      expect(logs).toHaveLength(1);
      expect(logs[0]).toMatchObject({
        id: errorId,
        level: 'error',
        message: 'Test error',
        stack: expect.any(String),
        userAgent: 'Test User Agent',
        url: 'https://example.com/test',
      });
    });

    it('logs string error message', () => {
      const errorId = errorService.logError('String error message');

      const logs = errorService.getRecentLogs(1);
      expect(logs[0]).toMatchObject({
        message: 'String error message',
        stack: undefined,
      });
    });

    it('logs error with context', () => {
      const error = new Error('Test error');
      const context = { userId: '123', action: 'test' };
      
      errorService.logError(error, context);

      const logs = errorService.getRecentLogs(1);
      expect(logs[0].context).toEqual(context);
    });

    it('logs error with different levels', () => {
      errorService.logError('Warning message', {}, 'warning');
      errorService.logError('Info message', {}, 'info');

      const logs = errorService.getRecentLogs(2);
      expect(logs[0].level).toBe('info');
      expect(logs[1].level).toBe('warning');
    });

    it('includes user ID when available in localStorage', () => {
      mockLocalStorage.getItem.mockReturnValue(
        JSON.stringify({ sub: 'user-123' })
      );

      errorService.logError('Test error');

      const logs = errorService.getRecentLogs(1);
      expect(logs[0].userId).toBe('user-123');
    });

    it('handles localStorage errors gracefully', () => {
      mockLocalStorage.getItem.mockImplementation(() => {
        throw new Error('localStorage error');
      });

      expect(() => {
        errorService.logError('Test error');
      }).not.toThrow();

      const logs = errorService.getRecentLogs(1);
      expect(logs[0].userId).toBeUndefined();
    });
  });

  describe('logNetworkError', () => {
    it('logs network error with request details', () => {
      const networkError = {
        url: '/api/test',
        method: 'GET',
        status: 500,
        statusText: 'Internal Server Error',
        responseData: { error: 'Server error' },
        requestData: { param: 'value' },
      };

      const errorId = errorService.logNetworkError(networkError);

      const logs = errorService.getRecentLogs(1);
      expect(logs[0]).toMatchObject({
        id: errorId,
        level: 'error',
        message: 'Network error: GET /api/test (500)',
        context: expect.objectContaining({
          type: 'network_error',
          url: '/api/test',
          method: 'GET',
          status: 500,
          statusText: 'Internal Server Error',
          responseData: { error: 'Server error' },
          requestData: { param: 'value' },
        }),
      });
    });

    it('logs network error without response status', () => {
      const networkError = {
        url: '/api/test',
        method: 'POST',
      };

      errorService.logNetworkError(networkError);

      const logs = errorService.getRecentLogs(1);
      expect(logs[0].message).toBe('Network error: POST /api/test (No Response)');
    });
  });

  describe('specialized error logging methods', () => {
    it('logs authentication errors', () => {
      errorService.logAuthError('Invalid credentials', { attempt: 1 });

      const logs = errorService.getRecentLogs(1);
      expect(logs[0]).toMatchObject({
        message: 'Invalid credentials',
        context: expect.objectContaining({
          type: 'authentication_error',
          attempt: 1,
        }),
      });
    });

    it('logs validation errors', () => {
      errorService.logValidationError('Invalid email format', { field: 'email' });

      const logs = errorService.getRecentLogs(1);
      expect(logs[0]).toMatchObject({
        level: 'warning',
        message: 'Invalid email format',
        context: expect.objectContaining({
          type: 'validation_error',
          field: 'email',
        }),
      });
    });

    it('logs user action errors', () => {
      errorService.logUserActionError('create_item', 'Failed to create item', { itemId: '123' });

      const logs = errorService.getRecentLogs(1);
      expect(logs[0]).toMatchObject({
        message: 'Failed to create item',
        context: expect.objectContaining({
          type: 'user_action_error',
          action: 'create_item',
          itemId: '123',
        }),
      });
    });
  });

  describe('log management', () => {
    it('limits number of stored logs', () => {
      // Log more than the max limit (100)
      for (let i = 0; i < 105; i++) {
        errorService.logError(`Error ${i}`);
      }

      const logs = errorService.getRecentLogs(200);
      expect(logs).toHaveLength(100);
      
      // Should keep the most recent logs
      expect(logs[0].message).toBe('Error 104');
      expect(logs[99].message).toBe('Error 5');
    });

    it('gets logs by level', () => {
      errorService.logError('Error 1', {}, 'error');
      errorService.logError('Warning 1', {}, 'warning');
      errorService.logError('Error 2', {}, 'error');
      errorService.logError('Info 1', {}, 'info');

      const errorLogs = errorService.getLogsByLevel('error');
      const warningLogs = errorService.getLogsByLevel('warning');
      const infoLogs = errorService.getLogsByLevel('info');

      expect(errorLogs).toHaveLength(2);
      expect(warningLogs).toHaveLength(1);
      expect(infoLogs).toHaveLength(1);
    });

    it('clears all logs', () => {
      errorService.logError('Error 1');
      errorService.logError('Error 2');

      expect(errorService.getRecentLogs()).toHaveLength(2);

      errorService.clearLogs();

      expect(errorService.getRecentLogs()).toHaveLength(0);
    });

    it('exports logs as JSON', () => {
      errorService.logError('Error 1');
      errorService.logError('Error 2');

      const exported = errorService.exportLogs();
      const parsed = JSON.parse(exported);

      expect(parsed).toHaveLength(2);
      expect(parsed[0].message).toBe('Error 2');
      expect(parsed[1].message).toBe('Error 1');
    });
  });

  describe('getErrorStats', () => {
    beforeEach(() => {
      // Mock Date.now for consistent testing
      jest.spyOn(Date, 'now').mockReturnValue(1000000000000); // Fixed timestamp
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('returns error statistics', () => {
      errorService.logError('Error 1', {}, 'error');
      errorService.logError('Warning 1', {}, 'warning');
      errorService.logError('Error 2', {}, 'error');
      errorService.logError('Info 1', {}, 'info');

      const stats = errorService.getErrorStats();

      expect(stats).toEqual({
        total: 4,
        byLevel: {
          error: 2,
          warning: 1,
          info: 1,
        },
        recentErrors: 4, // All errors are recent since we mocked the timestamp
      });
    });

    it('counts recent errors correctly', () => {
      // Create old timestamp (more than 1 hour ago)
      const oldTimestamp = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
      
      // Manually add an old log
      const logs = errorService.getRecentLogs();
      (logs as any).push({
        id: 'old-error',
        timestamp: oldTimestamp,
        level: 'error',
        message: 'Old error',
      });

      // Add a recent error
      errorService.logError('Recent error');

      const stats = errorService.getErrorStats();
      expect(stats.recentErrors).toBe(1); // Only the recent error
    });
  });
});