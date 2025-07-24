import { Construct } from 'constructs';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { CDKServerlessAgenticAPIProps, AddResourceOptions, LambdaFunctionEntry } from './types';
import * as iam from 'aws-cdk-lib/aws-iam';
import { SecurityValidationResult, SecurityValidationOptions, SecurityEnforcementOptions } from './security-validation';
/**
 * CDK construct that creates a complete serverless web application infrastructure
 * including CloudFront, S3, Cognito, API Gateway, and Lambda functions.
 */
export declare class CDKServerlessAgenticAPI extends Construct {
    /**
     * The CloudFront distribution that serves as the main entry point
     */
    readonly distribution: cloudfront.Distribution;
    /**
     * The S3 bucket used for static website hosting
     */
    readonly bucket: s3.Bucket;
    /**
     * The CloudFront Origin Access Identity for S3 bucket access
     */
    readonly originAccessIdentity: cloudfront.OriginAccessIdentity;
    /**
     * The Cognito User Pool for authentication
     */
    readonly userPool: cognito.UserPool;
    /**
     * The Cognito User Pool Client for API Gateway integration
     */
    private _userPoolClient;
    /**
     * Gets the Cognito User Pool Client for API Gateway integration
     */
    get userPoolClient(): cognito.UserPoolClient;
    /**
     * The API Gateway REST API
     */
    readonly api: apigateway.RestApi;
    /**
     * The Cognito authorizer for authenticated API endpoints
     */
    readonly cognitoAuthorizer: apigateway.CfnAuthorizer;
    /**
     * Registry of Lambda functions indexed by their resource path
     */
    readonly lambdaFunctions: Record<string, LambdaFunctionEntry>;
    /**
     * Internal registry of resource configurations
     */
    private readonly resourceConfigs;
    /**
     * Creates a new CDKServerlessAgenticAPI
     *
     * @param scope The parent construct
     * @param id The construct ID
     * @param props Configuration properties
     */
    constructor(scope: any, id: string, props?: CDKServerlessAgenticAPIProps);
    /**
     * Creates default health, whoami, and config endpoints
     */
    private createDefaultEndpoints;
    /**
     * Adds a new API resource with an associated Lambda function
     *
     * @param options Configuration for the new resource
     * @returns The created Lambda function
     */
    addResource(options: AddResourceOptions): lambda.Function;
    /**
     * Validates the options provided to addResource method
     *
     * @param options The options to validate
     * @throws Error if validation fails
     */
    private validateAddResourceOptions;
    /**
     * Creates a Lambda function from a source directory with proper IAM role and configuration
     *
     * @param functionName Unique name for the Lambda function
     * @param sourcePath Path to the directory containing the Lambda function source code
     * @param environment Environment variables to pass to the Lambda function
     * @param additionalPolicies Additional IAM policies to attach to the Lambda execution role
     * @returns The created Lambda function
     */
    createLambdaFunction(functionName: string, sourcePath: string, environment?: {
        [key: string]: string;
    }, additionalPolicies?: iam.PolicyStatement[]): lambda.Function;
    /**
     * Validates the security configuration of the construct
     *
     * @param options Security validation options
     * @returns Array of validation results
     */
    validateSecurity(options?: SecurityValidationOptions): SecurityValidationResult[];
    /**
     * Enforces security best practices for the construct
     *
     * @param options Security enforcement options
     */
    enforceSecurityBestPractices(options?: SecurityEnforcementOptions): void;
}
