import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import { Construct } from 'constructs';
import { CDKServerlessAgenticAPIProps, ResourceConfig } from './types';
/**
 * Creates CloudWatch log group for API Gateway
 *
 * @param scope The construct scope
 * @param id The construct ID
 * @returns The created log group
 */
export declare function createApiGatewayLogGroup(scope: Construct, id: string): logs.LogGroup;
/**
 * Creates the API Gateway REST API with comprehensive logging configuration
 *
 * @param scope The construct scope
 * @param id The construct ID
 * @param props Configuration properties
 * @returns The created API Gateway REST API
 */
export declare function createApiGateway(scope: Construct, id: string, props?: CDKServerlessAgenticAPIProps): apigateway.RestApi;
/**
 * Creates the Cognito authorizer for authenticated API endpoints
 *
 * @param scope The construct scope
 * @param api The API Gateway REST API
 * @param userPool The Cognito User Pool
 * @param id The construct ID
 * @returns The created Cognito authorizer
 */
export declare function createCognitoAuthorizer(scope: Construct, api: apigateway.RestApi, userPool: cognito.UserPool, id: string): apigateway.CfnAuthorizer;
/**
 * Creates or retrieves an API Gateway resource for the given path
 *
 * @param api The API Gateway REST API
 * @param resourcePath The full resource path (e.g., '/api/users')
 * @returns The API Gateway resource
 */
export declare function createApiGatewayResource(api: apigateway.RestApi, resourcePath: string): apigateway.Resource;
/**
 * Creates an API Gateway method and connects it to a Lambda function
 *
 * @param resource The API Gateway resource
 * @param config Resource configuration
 * @param lambdaFunction The Lambda function to connect
 * @param cognitoAuthorizer The Cognito authorizer
 * @param api The API Gateway REST API
 * @returns The created API Gateway method
 */
export declare function createApiGatewayMethod(resource: apigateway.Resource, config: ResourceConfig, lambdaFunction: lambda.Function, cognitoAuthorizer: apigateway.CfnAuthorizer, api: apigateway.RestApi): apigateway.Method;
