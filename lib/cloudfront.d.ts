import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import { Construct } from 'constructs';
import { CDKServerlessAgenticAPIProps } from './types';
/**
 * Creates the CloudFront distribution with S3 and API Gateway origins
 *
 * @param scope The construct scope
 * @param id The construct ID
 * @param bucket The S3 bucket for static content
 * @param originAccessIdentity The CloudFront Origin Access Identity
 * @param api The API Gateway REST API
 * @param props Configuration properties
 * @param loggingBucket The S3 bucket for CloudFront access logs
 * @returns The created CloudFront distribution
 */
export declare function createCloudFrontDistribution(scope: Construct, id: string, bucket: s3.Bucket, originAccessIdentity: cloudfront.OriginAccessIdentity, api: apigateway.RestApi, props?: CDKServerlessAgenticAPIProps, loggingBucket?: s3.Bucket): cloudfront.Distribution;
/**
 * Creates a response headers policy for static content with security headers
 *
 * @param scope The construct scope
 * @param id The construct ID
 * @returns The created response headers policy
 */
export declare function createResponseHeadersPolicy(scope: Construct, id: string): cloudfront.ResponseHeadersPolicy;
/**
 * Creates a response headers policy for API Gateway with appropriate CORS settings
 *
 * @param scope The construct scope
 * @param id The construct ID
 * @returns The created response headers policy
 */
export declare function createApiResponseHeadersPolicy(scope: Construct, id: string): cloudfront.ResponseHeadersPolicy;
