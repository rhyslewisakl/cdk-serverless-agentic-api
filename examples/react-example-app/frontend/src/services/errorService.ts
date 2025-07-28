/**
 * Error logging and reporting service
 */

export interface ErrorLog {
  id: string;
  timestamp: string;
  level: 'error' | 'warning' | 'info';
  message: string;
  stack?: string;
  context?: Record<string, any>;
  userAgent?: string;
  url?: string;
  userId?: string;
}

export interface NetworkError {
  url: string;
  method: string;
  status?: number;
  statusText?: string;
  responseData?: any;
  requestData?: any;
}

class ErrorService {
  private logs: ErrorLog[] = [];
  private maxLogs = 100;
  private isProduction = process.env.NODE_ENV === 'production';

  /**
   * Log an error with context information
   */
  logError(
    error: Error | string,
    context?: Record<string, any>,
    level: 'error' | 'warning' | 'info' = 'error'
  ): string {
    const id = this.generateId();
    const timestamp = new Date().toISOString();
    
    const errorLog: ErrorLog = {
      id,
      timestamp,
      level,
      message: typeof error === 'string' ? error : error.message,
      stack: typeof error === 'object' && error.stack ? error.stack : undefined,
      context,
      userAgent: navigator.userAgent,
      url: window.location.href,
      userId: this.getCurrentUserId(),
    };

    // Add to local logs
    this.logs.unshift(errorLog);
    
    // Keep only the most recent logs
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(0, this.maxLogs);
    }

    // Log to console in development
    if (!this.isProduction) {
      console.group(`🚨 Error Log [${level.toUpperCase()}]`);
      console.error('Message:', errorLog.message);
      if (errorLog.stack) {
        console.error('Stack:', errorLog.stack);
      }
      if (context) {
        console.error('Context:', context);
      }
      console.error('Full Log:', errorLog);
      console.groupEnd();
    }

    // In production, you would send this to an error reporting service
    // Example: this.sendToErrorReportingService(errorLog);

    return id;
  }

  /**
   * Log a network error with request/response details
   */
  logNetworkError(networkError: NetworkError, additionalContext?: Record<string, any>): string {
    const context = {
      type: 'network_error',
      url: networkError.url,
      method: networkError.method,
      status: networkError.status,
      statusText: networkError.statusText,
      responseData: networkError.responseData,
      requestData: networkError.requestData,
      ...additionalContext,
    };

    const message = `Network error: ${networkError.method} ${networkError.url} ${
      networkError.status ? `(${networkError.status})` : '(No Response)'
    }`;

    return this.logError(message, context, 'error');
  }

  /**
   * Log authentication errors
   */
  logAuthError(error: Error | string, context?: Record<string, any>): string {
    return this.logError(error, {
      type: 'authentication_error',
      ...context,
    }, 'error');
  }

  /**
   * Log validation errors
   */
  logValidationError(error: Error | string, context?: Record<string, any>): string {
    return this.logError(error, {
      type: 'validation_error',
      ...context,
    }, 'warning');
  }

  /**
   * Log user action errors
   */
  logUserActionError(
    action: string, 
    error: Error | string, 
    context?: Record<string, any>
  ): string {
    return this.logError(error, {
      type: 'user_action_error',
      action,
      ...context,
    }, 'error');
  }

  /**
   * Get recent error logs
   */
  getRecentLogs(limit: number = 10): ErrorLog[] {
    return this.logs.slice(0, limit);
  }

  /**
   * Get logs by level
   */
  getLogsByLevel(level: 'error' | 'warning' | 'info'): ErrorLog[] {
    return this.logs.filter(log => log.level === level);
  }

  /**
   * Clear all logs
   */
  clearLogs(): void {
    this.logs = [];
  }

  /**
   * Export logs for debugging
   */
  exportLogs(): string {
    return JSON.stringify(this.logs, null, 2);
  }

  /**
   * Get error statistics
   */
  getErrorStats(): {
    total: number;
    byLevel: Record<string, number>;
    recentErrors: number;
  } {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

    const byLevel = this.logs.reduce((acc, log) => {
      acc[log.level] = (acc[log.level] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const recentErrors = this.logs.filter(
      log => new Date(log.timestamp) > oneHourAgo
    ).length;

    return {
      total: this.logs.length,
      byLevel,
      recentErrors,
    };
  }

  /**
   * Generate unique ID for error logs
   */
  private generateId(): string {
    return `error-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get current user ID if available
   */
  private getCurrentUserId(): string | undefined {
    try {
      // Try to get user ID from auth context or local storage
      const userInfo = localStorage.getItem('userInfo');
      if (userInfo) {
        const parsed = JSON.parse(userInfo);
        return parsed.sub || parsed.id;
      }
    } catch (error) {
      // Ignore errors when getting user ID
    }
    return undefined;
  }

  /**
   * Send error to external error reporting service
   * This would be implemented based on your chosen service (Sentry, Bugsnag, etc.)
   */
  private async sendToErrorReportingService(errorLog: ErrorLog): Promise<void> {
    if (!this.isProduction) {
      return;
    }

    try {
      // Example implementation for external service
      // await fetch('/api/errors', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(errorLog),
      // });
    } catch (error) {
      console.error('Failed to send error to reporting service:', error);
    }
  }
}

// Export singleton instance
export const errorService = new ErrorService();
export default errorService;