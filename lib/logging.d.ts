/**
 * Structured logging utilities for Lambda functions
 * Provides consistent logging format across all Lambda functions
 */
export declare enum LogLevel {
    ERROR = "ERROR",
    WARN = "WARN",
    INFO = "INFO",
    DEBUG = "DEBUG"
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
export declare class Logger {
    private context;
    private service;
    private version;
    private logLevel;
    constructor(service: string, context?: LogContext, version?: string);
    /**
     * Parse log level from string
     */
    private parseLogLevel;
    /**
     * Check if log level should be logged
     */
    private shouldLog;
    /**
     * Create structured log entry
     */
    private createLogEntry;
    /**
     * Log structured entry to console
     */
    private log;
    /**
     * Log error message
     */
    error(message: string, error?: Error, data?: any): void;
    /**
     * Log warning message
     */
    warn(message: string, data?: any): void;
    /**
     * Log info message
     */
    info(message: string, data?: any): void;
    /**
     * Log debug message
     */
    debug(message: string, data?: any): void;
    /**
     * Log request start
     */
    logRequestStart(event: any): void;
    /**
     * Log request end with duration
     */
    logRequestEnd(statusCode: number, duration: number, responseSize?: number): void;
    /**
     * Log authentication event
     */
    logAuthentication(success: boolean, userId?: string, groups?: string[], reason?: string): void;
    /**
     * Log authorization event
     */
    logAuthorization(success: boolean, requiredGroup?: string, userGroups?: string[], reason?: string): void;
    /**
     * Sanitize headers to remove sensitive information
     */
    private sanitizeHeaders;
    /**
     * Create child logger with additional context
     */
    child(additionalContext: Partial<LogContext>): Logger;
    /**
     * Update context for current logger
     */
    updateContext(additionalContext: Partial<LogContext>): void;
}
/**
 * Create logger from API Gateway event
 */
export declare function createLoggerFromEvent(event: any, service?: string): Logger;
/**
 * Performance monitoring decorator for Lambda handlers
 */
export declare function withPerformanceLogging<T extends (...args: any[]) => Promise<any>>(handler: T, logger: Logger): T;
/**
 * Metrics collection utilities
 */
export declare class MetricsCollector {
    private logger;
    constructor(logger: Logger);
    /**
     * Record custom metric
     */
    recordMetric(name: string, value: number, unit?: string, dimensions?: Record<string, string>): void;
    /**
     * Record API response time
     */
    recordResponseTime(endpoint: string, method: string, duration: number, statusCode: number): void;
    /**
     * Record error count
     */
    recordError(errorType: string, endpoint?: string, method?: string): void;
    /**
     * Record business metric
     */
    recordBusinessMetric(name: string, value: number, userId?: string, userGroups?: string[]): void;
}
