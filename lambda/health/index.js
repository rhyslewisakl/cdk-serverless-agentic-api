/**
 * Health check Lambda function
 * Returns basic API status information with structured error handling and logging
 */

// Import structured logging utilities
const { createLoggerFromEvent, MetricsCollector } = require('./logging');

// Standard CORS headers for responses
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token,X-Requested-With',
  'Access-Control-Allow-Methods': 'GET,OPTIONS',
  'Access-Control-Allow-Credentials': 'true',
  'Access-Control-Max-Age': '86400'
};

/**
 * Creates a standardized success response
 */
function createSuccessResponse(data, statusCode = 200, additionalHeaders = {}) {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      ...CORS_HEADERS,
      ...additionalHeaders
    },
    body: JSON.stringify({
      ...data,
      timestamp: new Date().toISOString()
    })
  };
}

/**
 * Creates a standardized error response
 */
function createErrorResponse(statusCode, error, message, requestId, details) {
  const errorResponse = {
    error,
    message,
    timestamp: new Date().toISOString()
  };

  if (requestId) {
    errorResponse.requestId = requestId;
  }

  if (details && process.env.NODE_ENV === 'development') {
    errorResponse.details = details;
  }

  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      ...CORS_HEADERS
    },
    body: JSON.stringify(errorResponse)
  };
}

/**
 * Error handler wrapper for Lambda functions with structured logging
 */
function withErrorHandling(handler) {
  return async (event, context) => {
    const logger = createLoggerFromEvent(event, 'health-api');
    const metrics = new MetricsCollector(logger);
    const startTime = Date.now();

    try {
      logger.logRequestStart(event);

      const result = await handler(event, context, logger, metrics);

      const duration = Date.now() - startTime;
      const responseSize = result.body ? Buffer.byteLength(result.body, 'utf8') : 0;

      logger.logRequestEnd(result.statusCode, duration, responseSize);
      metrics.recordResponseTime('/api/health', event.httpMethod, duration, result.statusCode);

      return result;

    } catch (error) {
      const duration = Date.now() - startTime;
      const requestId = context?.awsRequestId;

      logger.error('Unhandled error in health endpoint', error, { duration });
      metrics.recordError(error.name || 'UnknownError', '/api/health', event.httpMethod);

      return createErrorResponse(
        500,
        'Internal Server Error',
        'An unexpected error occurred while processing the request',
        requestId,
        process.env.NODE_ENV === 'development' ? {
          stack: error.stack,
          originalError: error.message
        } : undefined
      );
    }
  };
}

/**
 * Main health check handler with structured logging
 */
const healthHandler = async (event, context, logger, metrics) => {
  // Handle OPTIONS request for CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    logger.info('CORS preflight request handled');
    return createSuccessResponse({}, 200, {
      'Access-Control-Allow-Methods': 'GET,OPTIONS'
    });
  }

  // Validate HTTP method
  if (event.httpMethod !== 'GET') {
    logger.warn('Invalid HTTP method attempted', {
      method: event.httpMethod,
      allowedMethods: ['GET', 'OPTIONS']
    });

    metrics.recordError('MethodNotAllowed', '/api/health', event.httpMethod);

    return createErrorResponse(
      405,
      'Method Not Allowed',
      `HTTP method ${event.httpMethod} is not allowed for this endpoint`,
      context?.awsRequestId
    );
  }

  logger.info('Performing health checks');

  // Perform basic health checks
  const memoryUsage = process.memoryUsage();
  const uptime = process.uptime();

  const healthData = {
    status: 'healthy',
    version: process.env.API_VERSION || '1.0.0',
    service: 'serverless-web-app-api',
    environment: process.env.NODE_ENV || 'production',
    checks: {
      memory: {
        used: memoryUsage.heapUsed,
        total: memoryUsage.heapTotal,
        external: memoryUsage.external,
        rss: memoryUsage.rss,
        status: memoryUsage.heapUsed < memoryUsage.heapTotal * 0.9 ? 'ok' : 'warning'
      },
      uptime: {
        seconds: uptime,
        status: uptime > 0 ? 'ok' : 'error'
      }
    }
  };

  // Add request context information
  if (event.requestContext) {
    healthData.requestContext = {
      requestId: event.requestContext.requestId,
      stage: event.requestContext.stage,
      httpMethod: event.requestContext.httpMethod,
      path: event.requestContext.path
    };
  }

  // Log health check metrics
  metrics.recordMetric('MemoryUsage', memoryUsage.heapUsed, 'Bytes');
  metrics.recordMetric('Uptime', uptime, 'Seconds');

  logger.info('Health check completed successfully', {
    memoryUsed: memoryUsage.heapUsed,
    memoryTotal: memoryUsage.heapTotal,
    uptime: uptime
  });

  return createSuccessResponse(healthData);
};

// Export the wrapped handler
exports.handler = withErrorHandling(healthHandler);