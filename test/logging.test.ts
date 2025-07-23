import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { Logger, LogLevel, createLoggerFromEvent, withPerformanceLogging, MetricsCollector } from '../src/logging';

describe('Logger', () => {
  let consoleLogSpy: any;
  let consoleErrorSpy: any;
  let consoleWarnSpy: any;
  let consoleDebugSpy: any;

  beforeEach(() => {
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    consoleDebugSpy = vi.spyOn(console, 'debug').mockImplementation(() => {});
    
    // Reset environment variables
    delete process.env.LOG_LEVEL;
    delete process.env.NODE_ENV;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Constructor', () => {
    it('should create logger with default values', () => {
      const logger = new Logger('test-service');
      
      expect(logger).toBeDefined();
    });

    it('should create logger with custom context', () => {
      const context = {
        requestId: 'test-request-id',
        userId: 'test-user',
        path: '/test'
      };
      
      const logger = new Logger('test-service', context, '2.0.0');
      
      expect(logger).toBeDefined();
    });

    it('should parse log level from environment variable', () => {
      process.env.LOG_LEVEL = 'DEBUG';
      
      const logger = new Logger('test-service');
      
      logger.debug('test debug message');
      expect(consoleDebugSpy).toHaveBeenCalled();
    });

    it('should default to INFO log level for invalid values', () => {
      process.env.LOG_LEVEL = 'INVALID';
      
      const logger = new Logger('test-service');
      
      logger.debug('test debug message');
      expect(consoleDebugSpy).not.toHaveBeenCalled();
      
      logger.info('test info message');
      expect(consoleLogSpy).toHaveBeenCalled();
    });
  });

  describe('Log Level Filtering', () => {
    it('should log ERROR messages at ERROR level', () => {
      process.env.LOG_LEVEL = 'ERROR';
      const logger = new Logger('test-service');
      
      logger.error('error message');
      logger.warn('warn message');
      logger.info('info message');
      logger.debug('debug message');
      
      expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
      expect(consoleWarnSpy).not.toHaveBeenCalled();
      expect(consoleLogSpy).not.toHaveBeenCalled();
      expect(consoleDebugSpy).not.toHaveBeenCalled();
    });

    it('should log ERROR and WARN messages at WARN level', () => {
      process.env.LOG_LEVEL = 'WARN';
      const logger = new Logger('test-service');
      
      logger.error('error message');
      logger.warn('warn message');
      logger.info('info message');
      logger.debug('debug message');
      
      expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
      expect(consoleWarnSpy).toHaveBeenCalledTimes(1);
      expect(consoleLogSpy).not.toHaveBeenCalled();
      expect(consoleDebugSpy).not.toHaveBeenCalled();
    });

    it('should log ERROR, WARN, and INFO messages at INFO level', () => {
      process.env.LOG_LEVEL = 'INFO';
      const logger = new Logger('test-service');
      
      logger.error('error message');
      logger.warn('warn message');
      logger.info('info message');
      logger.debug('debug message');
      
      expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
      expect(consoleWarnSpy).toHaveBeenCalledTimes(1);
      expect(consoleLogSpy).toHaveBeenCalledTimes(1);
      expect(consoleDebugSpy).not.toHaveBeenCalled();
    });

    it('should log all messages at DEBUG level', () => {
      process.env.LOG_LEVEL = 'DEBUG';
      const logger = new Logger('test-service');
      
      logger.error('error message');
      logger.warn('warn message');
      logger.info('info message');
      logger.debug('debug message');
      
      expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
      expect(consoleWarnSpy).toHaveBeenCalledTimes(1);
      expect(consoleLogSpy).toHaveBeenCalledTimes(1);
      expect(consoleDebugSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('Structured Logging', () => {
    it('should create structured log entries with all required fields', () => {
      const logger = new Logger('test-service', { requestId: 'test-123' }, '1.0.0');
      
      logger.info('test message', { key: 'value' });
      
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('"level":"INFO"')
      );
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('"message":"test message"')
      );
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('"service":"test-service"')
      );
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('"version":"1.0.0"')
      );
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('"requestId":"test-123"')
      );
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('"data":{"key":"value"}')
      );
    });

    it('should include error information in error logs', () => {
      const logger = new Logger('test-service');
      const error = new Error('Test error');
      error.stack = 'Error stack trace';
      
      logger.error('Error occurred', error, { context: 'test' });
      
      const logCall = consoleErrorSpy.mock.calls[0][0];
      const logEntry = JSON.parse(logCall);
      
      expect(logEntry.error).toBeDefined();
      expect(logEntry.error.name).toBe('Error');
      expect(logEntry.error.message).toBe('Test error');
      expect(logEntry.data).toEqual({ context: 'test' });
    });

    it('should include stack trace in development mode', () => {
      process.env.NODE_ENV = 'development';
      const logger = new Logger('test-service');
      const error = new Error('Test error');
      error.stack = 'Error stack trace';
      
      logger.error('Error occurred', error);
      
      const logCall = consoleErrorSpy.mock.calls[0][0];
      const logEntry = JSON.parse(logCall);
      
      expect(logEntry.error.stack).toBe('Error stack trace');
    });

    it('should not include stack trace in production mode', () => {
      process.env.NODE_ENV = 'production';
      const logger = new Logger('test-service');
      const error = new Error('Test error');
      error.stack = 'Error stack trace';
      
      logger.error('Error occurred', error);
      
      const logCall = consoleErrorSpy.mock.calls[0][0];
      const logEntry = JSON.parse(logCall);
      
      expect(logEntry.error.stack).toBeUndefined();
    });

    it('should include duration in log entries when provided', () => {
      const logger = new Logger('test-service');
      
      // Access private method for testing
      const createLogEntry = (logger as any).createLogEntry.bind(logger);
      const entry = createLogEntry(LogLevel.INFO, 'test message', undefined, undefined, 1500);
      
      expect(entry.duration).toBe(1500);
    });
  });

  describe('Request Logging', () => {
    it('should log request start with sanitized headers', () => {
      const logger = new Logger('test-service');
      const event = {
        httpMethod: 'GET',
        path: '/test',
        queryStringParameters: { param: 'value' },
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer secret-token',
          'X-API-Key': 'secret-key'
        },
        isBase64Encoded: false
      };
      
      logger.logRequestStart(event);
      
      const logCall = consoleLogSpy.mock.calls[0][0];
      const logEntry = JSON.parse(logCall);
      
      expect(logEntry.data.httpMethod).toBe('GET');
      expect(logEntry.data.path).toBe('/test');
      expect(logEntry.data.headers['Content-Type']).toBe('application/json');
      expect(logEntry.data.headers['Authorization']).toBe('[REDACTED]');
      expect(logEntry.data.headers['X-API-Key']).toBe('[REDACTED]');
    });

    it('should log request end with duration and response size', () => {
      const logger = new Logger('test-service');
      
      logger.logRequestEnd(200, 1500, 2048);
      
      const logCall = consoleLogSpy.mock.calls[0][0];
      const logEntry = JSON.parse(logCall);
      
      expect(logEntry.data.statusCode).toBe(200);
      expect(logEntry.data.duration).toBe(1500);
      expect(logEntry.data.responseSize).toBe(2048);
    });

    it('should log authentication events', () => {
      const logger = new Logger('test-service');
      
      logger.logAuthentication(true, 'user123', ['admin', 'user'], 'Valid token');
      
      const logCall = consoleLogSpy.mock.calls[0][0];
      const logEntry = JSON.parse(logCall);
      
      expect(logEntry.data.success).toBe(true);
      expect(logEntry.data.userId).toBe('user123');
      expect(logEntry.data.groups).toEqual(['admin', 'user']);
      expect(logEntry.data.reason).toBe('Valid token');
    });

    it('should log authorization events', () => {
      const logger = new Logger('test-service');
      
      logger.logAuthorization(false, 'admin', ['user'], 'Insufficient permissions');
      
      const logCall = consoleLogSpy.mock.calls[0][0];
      const logEntry = JSON.parse(logCall);
      
      expect(logEntry.data.success).toBe(false);
      expect(logEntry.data.requiredGroup).toBe('admin');
      expect(logEntry.data.userGroups).toEqual(['user']);
      expect(logEntry.data.reason).toBe('Insufficient permissions');
    });
  });

  describe('Child Logger', () => {
    it('should create child logger with additional context', () => {
      const parentLogger = new Logger('test-service', { requestId: 'req-123' });
      const childLogger = parentLogger.child({ userId: 'user-456' });
      
      childLogger.info('child log message');
      
      const logCall = consoleLogSpy.mock.calls[0][0];
      const logEntry = JSON.parse(logCall);
      
      expect(logEntry.context.requestId).toBe('req-123');
      expect(logEntry.context.userId).toBe('user-456');
    });

    it('should override parent context in child logger', () => {
      const parentLogger = new Logger('test-service', { requestId: 'req-123', userId: 'user-old' });
      const childLogger = parentLogger.child({ userId: 'user-new' });
      
      childLogger.info('child log message');
      
      const logCall = consoleLogSpy.mock.calls[0][0];
      const logEntry = JSON.parse(logCall);
      
      expect(logEntry.context.requestId).toBe('req-123');
      expect(logEntry.context.userId).toBe('user-new');
    });
  });

  describe('Context Updates', () => {
    it('should update logger context', () => {
      const logger = new Logger('test-service', { requestId: 'req-123' });
      
      logger.updateContext({ userId: 'user-456', path: '/test' });
      logger.info('updated context message');
      
      const logCall = consoleLogSpy.mock.calls[0][0];
      const logEntry = JSON.parse(logCall);
      
      expect(logEntry.context.requestId).toBe('req-123');
      expect(logEntry.context.userId).toBe('user-456');
      expect(logEntry.context.path).toBe('/test');
    });
  });
});

describe('createLoggerFromEvent', () => {
  it('should create logger from API Gateway event', () => {
    const event = {
      requestContext: {
        requestId: 'req-123',
        stage: 'prod',
        identity: {
          sourceIp: '192.168.1.1'
        }
      },
      path: '/api/test',
      httpMethod: 'GET',
      headers: {
        'User-Agent': 'test-agent',
        'X-Correlation-ID': 'corr-456'
      }
    };
    
    const logger = createLoggerFromEvent(event, 'test-api');
    
    // Test by logging a message and checking the context
    logger.info('test message');
    
    const logCall = vi.spyOn(console, 'log').mock.calls[0][0];
    const logEntry = JSON.parse(logCall);
    
    expect(logEntry.service).toBe('test-api');
    expect(logEntry.context.requestId).toBe('req-123');
    expect(logEntry.context.path).toBe('/api/test');
    expect(logEntry.context.method).toBe('GET');
    expect(logEntry.context.stage).toBe('prod');
    expect(logEntry.context.sourceIp).toBe('192.168.1.1');
    expect(logEntry.context.userAgent).toBe('test-agent');
    expect(logEntry.context.correlationId).toBe('corr-456');
  });

  it('should extract user information from Cognito claims', () => {
    const event = {
      requestContext: {
        requestId: 'req-123',
        authorizer: {
          claims: {
            'cognito:username': 'testuser',
            'cognito:groups': 'admin,user',
            sub: 'user-sub-123'
          }
        }
      },
      path: '/api/test',
      httpMethod: 'GET',
      headers: {}
    };
    
    const logger = createLoggerFromEvent(event);
    
    logger.info('test message');
    
    const logCall = vi.spyOn(console, 'log').mock.calls[0][0];
    const logEntry = JSON.parse(logCall);
    
    expect(logEntry.context.userId).toBe('testuser');
    expect(logEntry.context.userGroups).toEqual(['admin', 'user']);
  });

  it('should handle missing optional fields gracefully', () => {
    const event = {
      path: '/api/test',
      httpMethod: 'GET'
    };
    
    const logger = createLoggerFromEvent(event);
    
    expect(logger).toBeDefined();
    
    logger.info('test message');
    
    const logCall = vi.spyOn(console, 'log').mock.calls[0][0];
    const logEntry = JSON.parse(logCall);
    
    expect(logEntry.context.path).toBe('/api/test');
    expect(logEntry.context.method).toBe('GET');
    expect(logEntry.context.requestId).toBeUndefined();
  });
});

describe('withPerformanceLogging', () => {
  it('should wrap handler with performance logging', async () => {
    const logger = new Logger('test-service');
    const mockHandler = vi.fn().mockResolvedValue({ statusCode: 200 });
    
    const wrappedHandler = withPerformanceLogging(mockHandler, logger);
    
    await wrappedHandler('event', 'context');
    
    expect(mockHandler).toHaveBeenCalledWith('event', 'context');
    
    // Check that performance log was created
    const logCalls = vi.spyOn(console, 'log').mock.calls;
    const performanceLog = logCalls.find(call => 
      call[0].includes('Handler execution completed')
    );
    expect(performanceLog).toBeDefined();
  });

  it('should log errors and re-throw them', async () => {
    const logger = new Logger('test-service');
    const error = new Error('Handler failed');
    const mockHandler = vi.fn().mockRejectedValue(error);
    
    const wrappedHandler = withPerformanceLogging(mockHandler, logger);
    
    await expect(wrappedHandler('event', 'context')).rejects.toThrow('Handler failed');
    
    // Check that error log was created
    const errorCalls = vi.spyOn(console, 'error').mock.calls;
    const errorLog = errorCalls.find(call => 
      call[0].includes('Handler execution failed')
    );
    expect(errorLog).toBeDefined();
  });
});

describe('MetricsCollector', () => {
  let logger: Logger;
  let metrics: MetricsCollector;

  beforeEach(() => {
    logger = new Logger('test-service');
    metrics = new MetricsCollector(logger);
    vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  it('should record custom metrics', () => {
    metrics.recordMetric('TestMetric', 42, 'Count', { dimension1: 'value1' });
    
    const logCall = vi.spyOn(console, 'log').mock.calls[0][0];
    const logEntry = JSON.parse(logCall);
    
    expect(logEntry.data.metricName).toBe('TestMetric');
    expect(logEntry.data.value).toBe(42);
    expect(logEntry.data.unit).toBe('Count');
    expect(logEntry.data.dimensions).toEqual({ dimension1: 'value1' });
  });

  it('should record response time metrics', () => {
    metrics.recordResponseTime('/api/test', 'GET', 1500, 200);
    
    const logCall = vi.spyOn(console, 'log').mock.calls[0][0];
    const logEntry = JSON.parse(logCall);
    
    expect(logEntry.data.metricName).toBe('ResponseTime');
    expect(logEntry.data.value).toBe(1500);
    expect(logEntry.data.unit).toBe('Milliseconds');
    expect(logEntry.data.dimensions.endpoint).toBe('/api/test');
    expect(logEntry.data.dimensions.method).toBe('GET');
    expect(logEntry.data.dimensions.statusCode).toBe('200');
  });

  it('should record error metrics', () => {
    metrics.recordError('ValidationError', '/api/test', 'POST');
    
    const logCall = vi.spyOn(console, 'log').mock.calls[0][0];
    const logEntry = JSON.parse(logCall);
    
    expect(logEntry.data.metricName).toBe('ErrorCount');
    expect(logEntry.data.value).toBe(1);
    expect(logEntry.data.unit).toBe('Count');
    expect(logEntry.data.dimensions.errorType).toBe('ValidationError');
    expect(logEntry.data.dimensions.endpoint).toBe('/api/test');
    expect(logEntry.data.dimensions.method).toBe('POST');
  });

  it('should record business metrics', () => {
    metrics.recordBusinessMetric('UserLogin', 1, 'user123', ['admin', 'user']);
    
    const logCall = vi.spyOn(console, 'log').mock.calls[0][0];
    const logEntry = JSON.parse(logCall);
    
    expect(logEntry.data.metricName).toBe('UserLogin');
    expect(logEntry.data.value).toBe(1);
    expect(logEntry.data.unit).toBe('Count');
    expect(logEntry.data.dimensions.userId).toBe('user123');
    expect(logEntry.data.dimensions.userGroups).toBe('admin,user');
  });

  it('should handle missing optional parameters in business metrics', () => {
    metrics.recordBusinessMetric('AnonymousAccess', 1);
    
    const logCall = vi.spyOn(console, 'log').mock.calls[0][0];
    const logEntry = JSON.parse(logCall);
    
    expect(logEntry.data.dimensions.userId).toBe('anonymous');
    expect(logEntry.data.dimensions.userGroups).toBe('none');
  });
});