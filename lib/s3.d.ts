import * as s3 from 'aws-cdk-lib/aws-s3';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import { Construct } from 'constructs';
import { CDKServerlessAgenticAPIProps } from './types';
/**
 * Creates the S3 bucket for static website hosting
 *
 * @param scope The construct scope
 * @param id The construct ID
 * @param props Configuration properties
 * @returns The created S3 bucket
 */
export declare function createS3Bucket(scope: Construct, _id: string, // Prefix with underscore to indicate it's not used
props?: CDKServerlessAgenticAPIProps): s3.Bucket;
/**
 * Creates CloudFront Origin Access Identity for secure S3 access
 *
 * @param scope The construct scope
 * @param id The construct ID
 * @returns The created Origin Access Identity
 */
export declare function createOriginAccessIdentity(scope: Construct, id: string): cloudfront.OriginAccessIdentity;
/**
 * Configures the S3 bucket policy to allow CloudFront access
 *
 * @param bucket The S3 bucket
 * @param originAccessIdentity The CloudFront Origin Access Identity
 */
export declare function configureBucketPolicy(bucket: s3.Bucket, originAccessIdentity: cloudfront.OriginAccessIdentity): void;
/**
 * Creates a dedicated S3 bucket for CloudFront access logs with ACLs enabled
 *
 * @param scope The construct scope
 * @returns The created S3 bucket
 */
export declare function createLoggingBucket(scope: Construct): s3.Bucket;
