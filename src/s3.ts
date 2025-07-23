import * as s3 from 'aws-cdk-lib/aws-s3';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import { RemovalPolicy, Duration } from 'aws-cdk-lib';
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
export function createS3Bucket(
  scope: Construct,
  _id: string, // Prefix with underscore to indicate it's not used
  props?: CDKServerlessAgenticAPIProps
): s3.Bucket {
  return new s3.Bucket(scope, 'StaticWebsiteBucket', {
    bucketName: props?.bucketName,
    // Block all public access - access will be granted only to CloudFront
    blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
    // Enable versioning for deployment rollbacks
    versioned: true,
    // Configure removal policy based on environment
    removalPolicy: RemovalPolicy.DESTROY,
    // Enable server access logging if logging is enabled
    serverAccessLogsPrefix: props?.enableLogging !== false ? 'access-logs/' : undefined,
    // Configure lifecycle rules for cost optimization
    lifecycleRules: [
      {
        id: 'DeleteIncompleteMultipartUploads',
        abortIncompleteMultipartUploadAfter: Duration.days(7),
        enabled: true,
      },
      {
        id: 'DeleteOldVersions',
        noncurrentVersionExpiration: Duration.days(30),
        enabled: true,
      },
    ],
    // Enable event notifications for monitoring
    eventBridgeEnabled: true,
  });
}

/**
 * Creates CloudFront Origin Access Identity for secure S3 access
 * 
 * @param scope The construct scope
 * @param id The construct ID
 * @returns The created Origin Access Identity
 */
export function createOriginAccessIdentity(
  scope: Construct,
  id: string
): cloudfront.OriginAccessIdentity {
  return new cloudfront.OriginAccessIdentity(scope, 'OriginAccessIdentity', {
    comment: `OAI for ${id} static website bucket`,
  });
}

/**
 * Configures the S3 bucket policy to allow CloudFront access
 * 
 * @param bucket The S3 bucket
 * @param originAccessIdentity The CloudFront Origin Access Identity
 */
export function configureBucketPolicy(
  bucket: s3.Bucket,
  originAccessIdentity: cloudfront.OriginAccessIdentity
): void {
  // Grant CloudFront OAI read access to the bucket
  bucket.addToResourcePolicy(
    new iam.PolicyStatement({
      sid: 'AllowCloudFrontAccess',
      effect: iam.Effect.ALLOW,
      principals: [originAccessIdentity.grantPrincipal],
      actions: ['s3:GetObject'],
      resources: [bucket.arnForObjects('*')],
    })
  );

  // Grant CloudFront OAI list access to the bucket for error handling
  bucket.addToResourcePolicy(
    new iam.PolicyStatement({
      sid: 'AllowCloudFrontListBucket',
      effect: iam.Effect.ALLOW,
      principals: [originAccessIdentity.grantPrincipal],
      actions: ['s3:ListBucket'],
      resources: [bucket.bucketArn],
    })
  );
}

/**
 * Creates a dedicated S3 bucket for CloudFront access logs with ACLs enabled
 * 
 * @param scope The construct scope
 * @returns The created S3 bucket
 */
export function createLoggingBucket(scope: Construct): s3.Bucket {
  // Create a dedicated logging bucket with ACLs explicitly enabled
  const loggingBucket = new s3.Bucket(scope, 'LoggingBucket', {
    objectOwnership: s3.ObjectOwnership.OBJECT_WRITER, // Enable ACLs for CloudFront logs
    blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
    encryption: s3.BucketEncryption.S3_MANAGED,
    enforceSSL: true,
    removalPolicy: RemovalPolicy.DESTROY,
    autoDeleteObjects: true,
    lifecycleRules: [
      {
        expiration: Duration.days(90),
        transitions: [
          {
            storageClass: s3.StorageClass.INFREQUENT_ACCESS,
            transitionAfter: Duration.days(30)
          },
          {
            storageClass: s3.StorageClass.GLACIER,
            transitionAfter: Duration.days(60)
          }
        ]
      }
    ]
  });
  
  // Grant CloudFront service principal permission to write logs via bucket policy
  loggingBucket.addToResourcePolicy(
    new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      principals: [new iam.ServicePrincipal('delivery.logs.amazonaws.com')],
      actions: ['s3:PutObject'],
      resources: [loggingBucket.arnForObjects('*')]
    })
  );
  
  loggingBucket.addToResourcePolicy(
    new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      principals: [new iam.ServicePrincipal('cloudfront.amazonaws.com')],
      actions: ['s3:GetBucketAcl'],
      resources: [loggingBucket.bucketArn]
    })
  );
  
  return loggingBucket;
}