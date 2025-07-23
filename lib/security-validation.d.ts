/**
 * Security validation utilities for the serverless web app construct
 * Provides validation for IAM policies, HTTPS enforcement, and CORS configuration
 */
import * as iam from 'aws-cdk-lib/aws-iam';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import { Construct } from 'constructs';
/**
 * Result of a security validation check
 */
export interface SecurityValidationResult {
    /**
     * Whether the validation passed
     */
    readonly passed: boolean;
    /**
     * Message describing the validation result
     */
    readonly message: string;
    /**
     * Detailed information about the validation
     */
    readonly details?: Record<string, any>;
}
/**
 * Security validation options
 */
export interface SecurityValidationOptions {
    /**
     * Whether to throw an error when validation fails
     * @default false
     */
    readonly throwOnFailure?: boolean;
    /**
     * Whether to log validation results
     * @default true
     */
    readonly logResults?: boolean;
}
/**
 * Options for enforcing security best practices
 */
export interface SecurityEnforcementOptions {
    /**
     * Whether to enforce IAM least privilege
     * @default true
     */
    readonly enforceIamLeastPrivilege?: boolean;
    /**
     * Whether to enforce HTTPS
     * @default true
     */
    readonly enforceHttps?: boolean;
    /**
     * Whether to enforce secure CORS configuration
     * @default true
     */
    readonly enforceSecureCors?: boolean;
    /**
     * Whether to enforce S3 bucket security
     * @default true
     */
    readonly enforceS3Security?: boolean;
    /**
     * Whether to enforce Lambda function security
     * @default true
     */
    readonly enforceLambdaSecurity?: boolean;
    /**
     * Whether to enforce API Gateway security
     * @default true
     */
    readonly enforceApiGatewaySecurity?: boolean;
    /**
     * Whether to enforce Cognito User Pool security
     * @default true
     */
    readonly enforceCognitoSecurity?: boolean;
}
/**
 * Validates IAM policies for least privilege access
 *
 * @param role The IAM role to validate
 * @param options Validation options
 * @returns Validation result
 */
export declare function validateIamPolicyLeastPrivilege(role: iam.Role, options?: SecurityValidationOptions): SecurityValidationResult;
/**
 * Validates HTTPS enforcement for CloudFront distribution
 *
 * @param distribution The CloudFront distribution to validate
 * @param options Validation options
 * @returns Validation result
 */
export declare function validateHttpsEnforcement(distribution: cloudfront.Distribution, options?: SecurityValidationOptions): SecurityValidationResult;
/**
 * Validates CORS configuration for API Gateway
 *
 * @param api The API Gateway REST API to validate
 * @param options Validation options
 * @returns Validation result
 */
export declare function validateCorsConfiguration(api: apigateway.RestApi, options?: SecurityValidationOptions): SecurityValidationResult;
/**
 * Validates S3 bucket security configuration
 *
 * @param bucket The S3 bucket to validate
 * @param options Validation options
 * @returns Validation result
 */
export declare function validateS3BucketSecurity(bucket: s3.Bucket, options?: SecurityValidationOptions): SecurityValidationResult;
/**
 * Validates Lambda function security configuration
 *
 * @param lambdaFunction The Lambda function to validate
 * @param options Validation options
 * @returns Validation result
 */
export declare function validateLambdaFunctionSecurity(lambdaFunction: lambda.Function, options?: SecurityValidationOptions): SecurityValidationResult;
/**
 * Validates API Gateway security configuration
 *
 * @param api The API Gateway REST API to validate
 * @param options Validation options
 * @returns Validation result
 */
export declare function validateApiGatewaySecurity(api: apigateway.RestApi, options?: SecurityValidationOptions): SecurityValidationResult;
/**
 * Validates Cognito User Pool security configuration
 *
 * @param userPool The Cognito User Pool to validate
 * @param options Validation options
 * @returns Validation result
 */
export declare function validateCognitoUserPoolSecurity(userPool: cognito.UserPool, options?: SecurityValidationOptions): SecurityValidationResult;
/**
 * Validates all security aspects of the ServerlessWebAppConstruct
 *
 * @param scope The construct scope
 * @param options Validation options
 * @returns Array of validation results
 */
export declare function validateSecurityConfiguration(scope: Construct, options?: SecurityValidationOptions): SecurityValidationResult[];
/**
 * Enforces security best practices for CloudFront distribution
 *
 * @param distribution The CloudFront distribution to secure
 */
export declare function enforceHttpsSecurity(distribution: cloudfront.Distribution): void;
/**
 * Enforces security best practices for S3 bucket
 *
 * @param bucket The S3 bucket to secure
 */
export declare function enforceS3Security(bucket: s3.Bucket): void;
/**
 * Enforces security best practices for API Gateway
 *
 * @param api The API Gateway REST API to secure
 */
export declare function enforceApiGatewaySecurity(api: apigateway.RestApi): void;
/**
 * Enforces security best practices for Lambda function
 *
 * @param lambdaFunction The Lambda function to secure
 */
export declare function enforceLambdaSecurity(lambdaFunction: lambda.Function): void;
/**
 * Enforces security best practices for Cognito User Pool
 *
 * @param userPool The Cognito User Pool to secure
 */
export declare function enforceCognitoSecurity(userPool: cognito.UserPool): void;
/**
 * Enforces security best practices for IAM roles
 *
 * @param role The IAM role to secure
 */
export declare function enforceIamLeastPrivilege(role: iam.Role): void;
/**
 * Enforces all security best practices for the ServerlessWebAppConstruct
 *
 * @param scope The construct scope
 * @param options Security enforcement options
 */
export declare function enforceSecurityBestPractices(scope: Construct, options?: SecurityEnforcementOptions): void;
