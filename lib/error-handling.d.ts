/**
 * Error handling utilities for the serverless web app construct
 * Provides structured error responses and error page configuration
 */
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as s3 from 'aws-cdk-lib/aws-s3';
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
export declare enum HttpStatusCode {
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
export declare const CORS_HEADERS: {
    'Access-Control-Allow-Origin': string;
    'Access-Control-Allow-Headers': string;
    'Access-Control-Allow-Methods': string;
    'Access-Control-Allow-Credentials': string;
    'Access-Control-Max-Age': string;
};
/**
 * Creates a standardized error response for Lambda functions
 */
export declare function createErrorResponse(statusCode: HttpStatusCode, error: string, message: string, requestId?: string, details?: any): any;
/**
 * Creates a standardized success response for Lambda functions
 */
export declare function createSuccessResponse(data: any, statusCode?: number, additionalHeaders?: {
    [key: string]: string;
}): any;
/**
 * Error handler wrapper for Lambda functions
 */
export declare function withErrorHandling(handler: (event: any, context?: any) => Promise<any>): (event: any, context?: any) => Promise<any>;
/**
 * Custom error classes for different error scenarios
 */
export declare class ValidationError extends Error {
    field?: string | undefined;
    constructor(message: string, field?: string | undefined);
}
export declare class AuthenticationError extends Error {
    constructor(message?: string);
}
export declare class AuthorizationError extends Error {
    constructor(message?: string);
}
export declare class NotFoundError extends Error {
    constructor(message?: string);
}
export declare class ConflictError extends Error {
    constructor(message?: string);
}
export declare class RateLimitError extends Error {
    constructor(message?: string);
}
/**
 * Validates Cognito claims and throws appropriate errors
 */
export declare function validateCognitoClaims(event: any, requiredGroup?: string): any;
/**
 * Validates request body and throws validation errors
 */
export declare function validateRequestBody(event: any, requiredFields?: string[]): any;
/**
 * Creates custom error pages for CloudFront distribution
 */
export declare function createErrorPages(scope: Construct, bucket: s3.Bucket, constructId: string): cloudfront.ErrorResponse[];
