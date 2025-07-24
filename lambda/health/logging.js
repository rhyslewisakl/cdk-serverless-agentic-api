/**
 * Simplified logging utilities for Lambda functions
 */

const LogLevel = {
  ERROR: 'ERROR',
  WARN: 'WARN',
  INFO: 'INFO',
  DEBUG: 'DEBUG'
};

class Logger {
  constructor(service, context = {}, version = '1.0.0') {
    this.service = service;
    this.context = context;
    this.version = version;
    this.logLevel = this.parseLogLevel(process.env.LOG_LEVEL || 'INFO');
  }

  parseLogLevel(level) {
    const upperLevel = level.toUpperCase();
    return Object.values(LogLevel).includes(upperLevel) ? upperLevel : LogLevel.INFO;
  }

  shouldLog(level) {
    const levels = [LogLevel.ERROR, LogLevel.WARN, LogLevel.INFO, LogLevel.DEBUG];
    const currentLevelIndex = levels.indexOf(this.logLevel);
    const messageLevelIndex = levels.indexOf(level);
    return messageLevelIndex <= currentLevelIndex;
  }

  createLogEntry(level, message, data, error, duration) {
    const entry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      service: this.service,
      version: this.version,
      context: this.context
    };

    if (data !== undefined) entry.data = data;
    if (error) {
      entry.error = {
        name: error.name,
        message: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      };
    }
    if (duration !== undefined) entry.duration = duration;

    return entry;
  }

  log(entry) {
    if (!this.shouldLog(entry.level)) return;
    
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

  error(message, error, data) {
    this.log(this.createLogEntry(LogLevel.ERROR, message, data, error));
  }

  warn(message, data) {
    this.log(this.createLogEntry(LogLevel.WARN, message, data));
  }

  info(message, data) {
    this.log(this.createLogEntry(LogLevel.INFO, message, data));
  }

  debug(message, data) {
    this.log(this.createLogEntry(LogLevel.DEBUG, message, data));
  }

  logRequestStart(event) {
    this.info('Request started', {
      httpMethod: event.httpMethod,
      path: event.path,
      queryStringParameters: event.queryStringParameters
    });
  }

  logRequestEnd(statusCode, duration, responseSize) {
    this.info('Request completed', {
      statusCode,
      duration,
      responseSize
    });
  }
}

class MetricsCollector {
  constructor(logger) {
    this.logger = logger;
  }

  recordMetric(name, value, unit = 'Count', dimensions) {
    this.logger.info('Custom metric recorded', {
      metricName: name,
      value,
      unit,
      dimensions
    });
  }

  recordResponseTime(endpoint, method, duration, statusCode) {
    this.recordMetric('ResponseTime', duration, 'Milliseconds', {
      endpoint,
      method,
      statusCode: statusCode.toString()
    });
  }

  recordError(errorType, endpoint, method) {
    this.recordMetric('ErrorCount', 1, 'Count', {
      errorType,
      endpoint: endpoint || 'unknown',
      method: method || 'unknown'
    });
  }
}

function createLoggerFromEvent(event, service = 'lambda-function') {
  if (!event) {
    return new Logger(service, {}, process.env.API_VERSION || '1.0.0');
  }

  const context = {
    requestId: event.requestContext?.requestId,
    path: event.path,
    method: event.httpMethod,
    stage: event.requestContext?.stage
  };

  return new Logger(service, context, process.env.API_VERSION || '1.0.0');
}

module.exports = {
  Logger,
  LogLevel,
  MetricsCollector,
  createLoggerFromEvent
};