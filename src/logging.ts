/**
 * Structured logging utilities for Lambda functions
 * Provides consistent logging format across all Lambda functions
 */

export enum LogLevel {
  ERROR = 'ERROR',
  WARN = 'WARN',
  INFO = 'INFO',
  DEBUG = 'DEBUG'
}

export interface LogContext {
  requestId?: string;
  userId?: string;
  userGroups?: string[];
  path?: string;
  method?: string;
  stage?: string;
  sourceIp?: string;
  userAgent?: string;
  correlationId?: string;
}

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: LogContext;
  data?: any;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
  duration?: number;
  service: string;
  version: string;
}

/**
 * Structured logger class for Lambda functions
 */
export class Logger {
  private context: LogContext;
  private service: string;
  private version: string;
  private logLevel: LogLevel;

  constructor(service: string, context: LogContext = {}, version: string = '1.0.0') {
    this.service = service;
    this.context = context;
    this.version = version;
    this.logLevel = this.parseLogLevel(process.env.LOG_LEVEL || 'INFO');
  }

  /**
   * Parse log level from string
   */
  private parseLogLevel(level: string): LogLevel {
    const upperLevel = level.toUpperCase();
    return Object.values(LogLevel).includes(upperLevel as LogLevel) 
      ? upperLevel as LogLevel 
      : LogLevel.INFO;
  }

  /**
   * Check if log level should be logged
   */
  private shouldLog(level: LogLevel): boolean {
    const levels = [LogLevel.ERROR, LogLevel.WARN, LogLevel.INFO, LogLevel.DEBUG];
    const currentLevelIndex = levels.indexOf(this.logLevel);
    const messageLevelIndex = levels.indexOf(level);
    return messageLevelIndex <= currentLevelIndex;
  }

  /**
   * Create structured log entry
   */
  private createLogEntry(level: LogLevel, message: string, data?: any, error?: Error, duration?: number): LogEntry {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      service: this.service,
      version: this.version,
      context: this.context
    };

    if (data !== undefined) {
      entry.data = data;
    }

    if (error) {
      entry.error = {
        name: error.name,
        message: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      };
    }

    if (duration !== undefined) {
      entry.duration = duration;
    }

    return entry;
  }

  /**
   * Log structured entry to console
   */
  private log(entry: LogEntry): void {
    if (!this.shouldLog(entry.level)) {
      return;
    }

    const logMessage = JSON.stringify(entry);
    
    switch (entry.level) {
      case LogLevel.ERROR:
        console.error(logMessage);
        break;
      case LogLevel.WARN:
        console.warn(logMessage);
        break;
      case LogLevel.DEBUG:
        console.debug(logMessage);
        break;
      default:
        console.log(logMessage);
    }
  }

  /**
   * Log error message
   */
  error(message: string, error?: Error, data?: any): void {
    this.log(this.createLogEntry(LogLevel.ERROR, message, data, error));
  }

  /**
   * Log warning message
   */
  warn(message: string, data?: any): void {
    this.log(this.createLogEntry(LogLevel.WARN, message, data));
  }

  /**
   * Log info message
   */
  info(message: string, data?: any): void {
    this.log(this.createLogEntry(LogLevel.INFO, message, data));
  }

  /**
   * Log debug message
   */
  debug(message: string, data?: any): void {
    this.log(this.createLogEntry(LogLevel.DEBUG, message, data));
  }

  /**
   * Log request start
   */
  logRequestStart(event: any): void {
    this.info('Request started', {
      httpMethod: event.httpMethod,
      path: event.path,
      queryStringParameters: event.queryStringParameters,
      headers: this.sanitizeHeaders(event.headers),
      isBase64Encoded: event.isBase64Encoded
    });
  }

  /**
   * Log request end with duration
   */
  logRequestEnd(statusCode: number, duration: number, responseSize?: number): void {
    this.info('Request completed', {
      statusCode,
      duration,
      responseSize
    });
  }

  /**
   * Log authentication event
   */
  logAuthentication(success: boolean, userId?: string, groups?: string[], reason?: string): void {
    this.info('Authentication event', {
      success,
      userId,
      groups,
      reason
    });
  }

  /**
   * Log authorization event
   */
  logAuthorization(success: boolean, requiredGroup?: string, userGroups?: string[], reason?: string): void {
    this.info('Authorization event', {
      success,
      requiredGroup,
      userGroups,
      reason
    });
  }

  /**
   * Sanitize headers to remove sensitive information
   */
  private sanitizeHeaders(headers: any): any {
    if (!headers) return headers;

    const sanitized = { ...headers };
    const sensitiveHeaders = ['authorization', 'cookie', 'x-api-key', 'x-auth-token'];
    
    sensitiveHeaders.forEach(header => {
      if (sanitized[header]) {
        sanitized[header] = '[REDACTED]';
      }
      if (sanitized[header.toLowerCase()]) {
        sanitized[header.toLowerCase()] = '[REDACTED]';
      }
    });

    return sanitized;
  }

  /**
   * Create child logger with additional context
   */
  child(additionalContext: Partial<LogContext>): Logger {
    const newContext = { ...this.context, ...additionalContext };
    return new Logger(this.service, newContext, this.version);
  }

  /**
   * Update context for current logger
   */
  updateContext(additionalContext: Partial<LogContext>): void {
    this.context = { ...this.context, ...additionalContext };
  }
}

/**
 * Create logger from API Gateway event
 */
export function createLoggerFromEvent(event: any, service: string = 'lambda-function'): Logger {
  // Handle null or undefined events
  if (!event) {
    return new Logger(service, {}, process.env.API_VERSION || '1.0.0');
  }

  const context: LogContext = {
    requestId: event.requestContext?.requestId,
    path: event.path,
    method: event.httpMethod,
    stage: event.requestContext?.stage,
    sourceIp: event.requestContext?.identity?.sourceIp,
    userAgent: event.headers?.['User-Agent'] || event.headers?.['user-agent'],
    correlationId: event.headers?.['X-Correlation-ID'] || event.headers?.['x-correlation-id']
  };

  // Extract user information from Cognito claims if available
  const claims = event.requestContext?.authorizer?.claims;
  if (claims) {
    context.userId = claims['cognito:username'] || claims.sub;
    context.userGroups = claims['cognito:groups'] ? claims['cognito:groups'].split(',') : [];
  }

  return new Logger(service, context, process.env.API_VERSION || '1.0.0');
}

/**
 * Performance monitoring decorator for Lambda handlers
 */
export function withPerformanceLogging<T extends (...args: any[]) => Promise<any>>(
  handler: T,
  logger: Logger
): T {
  return (async (...args: any[]) => {
    const startTime = Date.now();
    
    try {
      const result = await handler(...args);
      const duration = Date.now() - startTime;
      
      logger.info('Handler execution completed', { duration });
      
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      
      logger.error('Handler execution failed', error as Error, { duration });
      
      throw error;
    }
  }) as T;
}

/**
 * Metrics collection utilities
 */
export class MetricsCollector {
  private logger: Logger;

  constructor(logger: Logger) {
    this.logger = logger;
  }

  /**
   * Record custom metric
   */
  recordMetric(name: string, value: number, unit: string = 'Count', dimensions?: Record<string, string>): void {
    this.logger.info('Custom metric recorded', {
      metricName: name,
      value,
      unit,
      dimensions
    });
  }

  /**
   * Record API response time
   */
  recordResponseTime(endpoint: string, method: string, duration: number, statusCode: number): void {
    this.recordMetric('ResponseTime', duration, 'Milliseconds', {
      endpoint,
      method,
      statusCode: statusCode.toString()
    });
  }

  /**
   * Record error count
   */
  recordError(errorType: string, endpoint?: string, method?: string): void {
    this.recordMetric('ErrorCount', 1, 'Count', {
      errorType,
      endpoint: endpoint || 'unknown',
      method: method || 'unknown'
    });
  }

  /**
   * Record business metric
   */
  recordBusinessMetric(name: string, value: number, userId?: string, userGroups?: string[]): void {
    this.recordMetric(name, value, 'Count', {
      userId: userId || 'anonymous',
      userGroups: userGroups?.join(',') || 'none'
    });
  }
}