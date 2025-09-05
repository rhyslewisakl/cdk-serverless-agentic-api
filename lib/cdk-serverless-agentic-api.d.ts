import { Construct } from 'constructs';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { CDKServerlessAgenticAPIProps, AddResourceOptions, LambdaFunctionEntry, ExportableResourceIds } from './types';
import * as iam from 'aws-cdk-lib/aws-iam';
/**
 * CDK construct that creates a complete serverless web application infrastructure
 * including CloudFront, S3, Cognito, API Gateway, and Lambda functions.
 */
export declare class CDKServerlessAgenticAPI extends Construct {
    /**
     * The S3 bucket used for static website hosting (optional in extension mode)
     */
    readonly bucket?: s3.Bucket;
    /**
     * The CloudFront Origin Access Identity for S3 bucket access (optional in extension mode)
     */
    readonly originAccessIdentity?: cloudfront.OriginAccessIdentity;
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
     * The CloudFront distribution (optional in extension mode)
     */
    readonly distribution?: cloudfront.Distribution;
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
     * Gets a Lambda function by path and method
     *
     * @param path The API path (e.g., '/users')
     * @param method The HTTP method (defaults to 'GET')
     * @returns The Lambda function or undefined if not found
     */
    getLambdaFunction(path: string, method?: string): lambda.Function | undefined;
    /**
     * Gets exportable resource IDs for use in extension stacks
     *
     * @returns Object containing resource IDs that can be used by extension stacks
     */
    getExportableResourceIds(): ExportableResourceIds;
    /**
     * Grants DynamoDB access to a Lambda function
     *
     * @param lambdaFunction The Lambda function to grant access to
     * @param table The DynamoDB table to grant access to
     * @param accessType The type of access to grant ('read', 'write', or 'readwrite')
     */
    grantDynamoDBAccess(lambdaFunction: lambda.Function, table: any, accessType?: 'read' | 'write' | 'readwrite'): void;
}
