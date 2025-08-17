import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import { Construct } from 'constructs';
import { ResourceConfig } from './types';
/**
 * Creates a Lambda function from a source directory with proper IAM role and configuration
 *
 * @param scope The construct scope
 * @param functionName Unique name for the Lambda function
 * @param sourcePath Path to the directory containing the Lambda function source code
 * @param constructId The ID of the parent construct
 * @param environment Environment variables to pass to the Lambda function
 * @param additionalPolicies Additional IAM policies to attach to the Lambda execution role
 * @returns The created Lambda function
 */
export declare function createLambdaFunction(scope: Construct, functionName: string, sourcePath: string, constructId: string, environment?: {
    [key: string]: string;
}, additionalPolicies?: iam.PolicyStatement[], enableDLQ?: boolean): lambda.Function;
/**
 * Creates a Lambda function specifically for API Gateway integration
 *
 * @param scope The construct scope
 * @param resourcePath The API resource path (e.g., '/users', '/products')
 * @param config Resource configuration containing Lambda source path and other settings
 * @param userPool The Cognito user pool
 * @param userPoolClient The Cognito user pool client
 * @param api The API Gateway REST API
 * @param constructId The ID of the parent construct
 * @returns The created Lambda function configured for API Gateway
 */
export declare function createApiLambdaFunction(scope: Construct, resourcePath: string, config: ResourceConfig, userPool: cognito.UserPool, userPoolClient: cognito.UserPoolClient, constructId: string): lambda.Function;
