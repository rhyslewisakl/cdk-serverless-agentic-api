/**
 * Error handling utilities for the serverless web app construct
 * Provides structured error responses and error page configuration
 */

import { Duration } from 'aws-cdk-lib';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as s3deploy from 'aws-cdk-lib/aws-s3-deployment';
import { Construct } from 'constructs';

/**
 * Standard error response structure for Lambda functions
 */
export interface ErrorResponse {
  error: string;
  message: string;
  timestamp: string;
  requestId?: string;
  details?: any;
}

/**
 * HTTP status codes for common error scenarios
 */
export enum HttpStatusCode {
  BAD_REQUEST = 400,
  UNAUTHORIZED = 401,
  FORBIDDEN = 403,
  NOT_FOUND = 404,
  METHOD_NOT_ALLOWED = 405,
  CONFLICT = 409,
  UNPROCESSABLE_ENTITY = 422,
  TOO_MANY_REQUESTS = 429,
  INTERNAL_SERVER_ERROR = 500,
  BAD_GATEWAY = 502,
  SERVICE_UNAVAILABLE = 503,
  GATEWAY_TIMEOUT = 504
}

/**
 * Standard CORS headers for error responses
 */
export const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token,X-Requested-With',
  'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,PATCH,OPTIONS',
  'Access-Control-Allow-Credentials': 'true',
  'Access-Control-Max-Age': '86400'
};

/**
 * Creates a standardized error response for Lambda functions
 */
export function createErrorResponse(
  statusCode: HttpStatusCode,
  error: string,
  message: string,
  requestId?: string,
  details?: any
): any {
  const errorResponse: ErrorResponse = {
    error,
    message,
    timestamp: new Date().toISOString(),
    requestId,
    details
  };

  // Remove undefined values
  Object.keys(errorResponse).forEach(key => {
    if (errorResponse[key as keyof ErrorResponse] === undefined) {
      delete errorResponse[key as keyof ErrorResponse];
    }
  });

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
 * Creates a standardized success response for Lambda functions
 */
export function createSuccessResponse(
  data: any,
  statusCode: number = 200,
  additionalHeaders?: { [key: string]: string }
): any {
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
 * Error handler wrapper for Lambda functions
 */
export function withErrorHandling(handler: (event: any, context?: any) => Promise<any>) {
  return async (event: any, context?: any) => {
    try {
      console.log('Request received:', JSON.stringify(event, null, 2));
      
      const result = await handler(event, context);
      
      console.log('Response:', JSON.stringify(result, null, 2));
      return result;
      
    } catch (error) {
      console.error('Unhandled error:', error);
      
      // Extract request ID from context if available
      const requestId = context?.awsRequestId;
      
      // Determine error type and status code
      let statusCode = HttpStatusCode.INTERNAL_SERVER_ERROR;
      let errorType = 'Internal Server Error';
      let errorMessage = 'An unexpected error occurred while processing the request';
      
      if (error instanceof ValidationError) {
        statusCode = HttpStatusCode.BAD_REQUEST;
        errorType = 'Validation Error';
        errorMessage = error.message;
      } else if (error instanceof AuthenticationError) {
        statusCode = HttpStatusCode.UNAUTHORIZED;
        errorType = 'Authentication Error';
        errorMessage = error.message;
      } else if (error instanceof AuthorizationError) {
        statusCode = HttpStatusCode.FORBIDDEN;
        errorType = 'Authorization Error';
        errorMessage = error.message;
      } else if (error instanceof NotFoundError) {
        statusCode = HttpStatusCode.NOT_FOUND;
        errorType = 'Not Found';
        errorMessage = error.message;
      } else if (error instanceof ConflictError) {
        statusCode = HttpStatusCode.CONFLICT;
        errorType = 'Conflict';
        errorMessage = error.message;
      } else if (error instanceof RateLimitError) {
        statusCode = HttpStatusCode.TOO_MANY_REQUESTS;
        errorType = 'Rate Limit Exceeded';
        errorMessage = error.message;
      }
      
      return createErrorResponse(
        statusCode,
        errorType,
        errorMessage,
        requestId,
        process.env.NODE_ENV === 'development' ? {
          stack: error instanceof Error ? error.stack : undefined,
          originalError: error instanceof Error ? error.message : String(error)
        } : undefined
      );
    }
  };
}

/**
 * Custom error classes for different error scenarios
 */
export class ValidationError extends Error {
  constructor(message: string, public field?: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class AuthenticationError extends Error {
  constructor(message: string = 'Authentication required') {
    super(message);
    this.name = 'AuthenticationError';
  }
}

export class AuthorizationError extends Error {
  constructor(message: string = 'Insufficient permissions') {
    super(message);
    this.name = 'AuthorizationError';
  }
}

export class NotFoundError extends Error {
  constructor(message: string = 'Resource not found') {
    super(message);
    this.name = 'NotFoundError';
  }
}

export class ConflictError extends Error {
  constructor(message: string = 'Resource conflict') {
    super(message);
    this.name = 'ConflictError';
  }
}

export class RateLimitError extends Error {
  constructor(message: string = 'Rate limit exceeded') {
    super(message);
    this.name = 'RateLimitError';
  }
}

/**
 * Validates Cognito claims and throws appropriate errors
 */
export function validateCognitoClaims(event: any, requiredGroup?: string): any {
  const claims = event.requestContext?.authorizer?.claims;
  
  if (!claims) {
    throw new AuthenticationError('No authentication claims found');
  }
  
  if (requiredGroup) {
    const userGroups = claims['cognito:groups'] ? claims['cognito:groups'].split(',') : [];
    if (!userGroups.includes(requiredGroup)) {
      throw new AuthorizationError(`Access denied. Required group: ${requiredGroup}`);
    }
  }
  
  return claims;
}

/**
 * Validates request body and throws validation errors
 */
export function validateRequestBody(event: any, requiredFields: string[] = []): any {
  if (!event.body) {
    if (requiredFields.length > 0) {
      throw new ValidationError('Request body is required');
    }
    return {};
  }
  
  let body;
  try {
    body = JSON.parse(event.body);
  } catch (error) {
    throw new ValidationError('Invalid JSON in request body');
  }
  
  // Check required fields
  for (const field of requiredFields) {
    if (body[field] === undefined || body[field] === null || body[field] === '') {
      throw new ValidationError(`Missing required field: ${field}`, field);
    }
  }
  
  return body;
}

/**
 * Creates custom error pages for CloudFront distribution
 */
export function createErrorPages(
  scope: Construct,
  bucket: s3.Bucket,
  constructId: string
): cloudfront.ErrorResponse[] {
  // Get custom error pages path if provided
  const errorPagesPath = scope instanceof Construct && 
                        scope.node.tryGetContext('props')?.errorPagesPath || 
                        'error-pages';
  
  // Deploy error page assets to S3
  new s3deploy.BucketDeployment(scope, `${constructId}ErrorPages`, {
    sources: [s3deploy.Source.asset(errorPagesPath)],
    destinationBucket: bucket,
    destinationKeyPrefix: 'error-pages/',
    cacheControl: [
      s3deploy.CacheControl.setPublic(),
      s3deploy.CacheControl.maxAge(Duration.hours(1))
    ],
  });

  // Define custom error responses
  return [
    {
      httpStatus: 400,
      responseHttpStatus: 400,
      responsePagePath: '/error-pages/400.html',
      ttl: Duration.minutes(5)
    },
    {
      httpStatus: 403,
      responseHttpStatus: 403,
      responsePagePath: '/error-pages/403.html',
      ttl: Duration.minutes(5)
    },
    {
      httpStatus: 404,
      responseHttpStatus: 404,
      responsePagePath: '/error-pages/404.html',
      ttl: Duration.hours(1)
    },
    {
      httpStatus: 500,
      responseHttpStatus: 500,
      responsePagePath: '/error-pages/500.html',
      ttl: Duration.minutes(1)
    },
    {
      httpStatus: 502,
      responseHttpStatus: 502,
      responsePagePath: '/error-pages/502.html',
      ttl: Duration.minutes(1)
    },
    {
      httpStatus: 503,
      responseHttpStatus: 503,
      responsePagePath: '/error-pages/503.html',
      ttl: Duration.minutes(1)
    },
    {
      httpStatus: 504,
      responseHttpStatus: 504,
      responsePagePath: '/error-pages/504.html',
      ttl: Duration.minutes(1)
    }
  ];
}