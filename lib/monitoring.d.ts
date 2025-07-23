import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import { Construct } from 'constructs';
import { LambdaFunctionEntry } from './types';
/**
 * Creates CloudWatch alarms for API Gateway metrics
 *
 * @param scope The construct scope
 * @param api The API Gateway REST API
 * @param dashboard The CloudWatch dashboard to add widgets to
 * @param constructId The ID of the parent construct
 */
export declare function createApiGatewayAlarms(scope: Construct, api: apigateway.RestApi, dashboard: cloudwatch.Dashboard, constructId: string): void;
/**
 * Creates CloudWatch alarms for Lambda function metrics
 *
 * @param scope The construct scope
 * @param lambdaFunctions Map of Lambda functions
 * @param dashboard The CloudWatch dashboard to add widgets to
 * @param constructId The ID of the parent construct
 */
export declare function createLambdaAlarms(scope: Construct, lambdaFunctions: Record<string, LambdaFunctionEntry>, dashboard: cloudwatch.Dashboard, constructId: string): void;
/**
 * Creates CloudWatch alarms for CloudFront metrics
 *
 * @param scope The construct scope
 * @param distribution The CloudFront distribution
 * @param dashboard The CloudWatch dashboard to add widgets to
 * @param constructId The ID of the parent construct
 */
export declare function createCloudFrontAlarms(scope: Construct, distribution: cloudfront.Distribution, dashboard: cloudwatch.Dashboard, constructId: string): void;
/**
 * Creates monitoring resources including CloudWatch alarms and dashboards
 *
 * @param scope The construct scope
 * @param api The API Gateway REST API
 * @param lambdaFunctions Map of Lambda functions
 * @param distribution The CloudFront distribution
 * @param constructId The ID of the parent construct
 * @returns The created CloudWatch dashboard
 */
export declare function createMonitoringResources(scope: Construct, api: apigateway.RestApi, lambdaFunctions: Record<string, LambdaFunctionEntry>, distribution: cloudfront.Distribution, constructId: string): cloudwatch.Dashboard;
