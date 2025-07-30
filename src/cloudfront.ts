import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as acm from 'aws-cdk-lib/aws-certificatemanager';
import { Duration } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { CDKServerlessAgenticAPIProps } from './types';
import { createErrorPages } from './error-handling';

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
export function createCloudFrontDistribution(
  scope: Construct,
  id: string,
  bucket: s3.Bucket,
  originAccessIdentity: cloudfront.OriginAccessIdentity,
  api: apigateway.RestApi,
  props?: CDKServerlessAgenticAPIProps,
  loggingBucket?: s3.Bucket
): cloudfront.Distribution {
  // Create S3 origin for static content
  const s3Origin = origins.S3BucketOrigin.withOriginAccessIdentity(bucket, {
    originAccessIdentity: originAccessIdentity,
    originPath: '',
  });

  // Create API Gateway origin for /api/* paths
  const apiOrigin = new origins.HttpOrigin(`${api.restApiId}.execute-api.${process.env.AWS_REGION || 'us-east-1'}.amazonaws.com`, {
    originPath: '',
  });

  // Configure SSL certificate if custom domain is provided
  const certificate = props?.certificateArn
    ? acm.Certificate.fromCertificateArn(scope, 'Certificate', props.certificateArn)
    : undefined;

  // Create CloudFront distribution
  const distribution = new cloudfront.Distribution(scope, 'Distribution', {
    comment: `CloudFront distribution for ${id} serverless web application`,

    // Configure default behavior for static content (S3)
    defaultBehavior: {
      origin: s3Origin,
      viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
      allowedMethods: cloudfront.AllowedMethods.ALLOW_GET_HEAD_OPTIONS,
      cachedMethods: cloudfront.CachedMethods.CACHE_GET_HEAD_OPTIONS,
      compress: true,
      cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
      originRequestPolicy: cloudfront.OriginRequestPolicy.CORS_S3_ORIGIN,
      responseHeadersPolicy: createResponseHeadersPolicy(scope, id),
    },

    // Configure additional behaviors for API Gateway
    additionalBehaviors: {
      '/api/*': {
        origin: apiOrigin,
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        allowedMethods: cloudfront.AllowedMethods.ALLOW_ALL,
        cachedMethods: cloudfront.CachedMethods.CACHE_GET_HEAD,
        compress: true,
        cachePolicy: cloudfront.CachePolicy.CACHING_DISABLED,
        originRequestPolicy: cloudfront.OriginRequestPolicy.ALL_VIEWER_EXCEPT_HOST_HEADER,
        responseHeadersPolicy: createApiResponseHeadersPolicy(scope, id),
      },
    },

    // Configure custom domain if provided
    ...(props?.domainName && certificate && {
      domainNames: [props.domainName],
      certificate: certificate,
    }),

    // Configure default root object
    defaultRootObject: 'index.html',

    // Configure custom error responses using error handling utilities
    errorResponses: createErrorPages(scope, bucket, id),

    // No geographic restrictions by default

    // Configure price class for cost optimization
    priceClass: cloudfront.PriceClass.PRICE_CLASS_100,

    // Enable IPv6
    enableIpv6: true,

    // Configure logging if enabled
    ...(props?.enableLogging !== false && loggingBucket && {
      enableLogging: true,
      logBucket: loggingBucket,
      logFilePrefix: 'cloudfront-logs/',
      logIncludesCookies: false,
    }),

    // Configure HTTP version
    httpVersion: cloudfront.HttpVersion.HTTP2_AND_3,

    // Configure minimum TLS version
    minimumProtocolVersion: cloudfront.SecurityPolicyProtocol.TLS_V1_2_2021,

    // Configure web ACL if needed (placeholder for future enhancement)
    webAclId: undefined,
  });

  return distribution;
}

/**
 * Creates a response headers policy for static content with security headers
 * 
 * @param scope The construct scope
 * @param id The construct ID
 * @returns The created response headers policy
 */
export function createResponseHeadersPolicy(
  scope: Construct,
  id: string
): cloudfront.ResponseHeadersPolicy {
  return new cloudfront.ResponseHeadersPolicy(scope, 'StaticContentResponseHeadersPolicy', {
    responseHeadersPolicyName: `${id}-static-headers`,
    comment: 'Security headers for static content',

    // Configure security headers
    securityHeadersBehavior: {
      contentTypeOptions: {
        override: true,
      },
      frameOptions: {
        frameOption: cloudfront.HeadersFrameOption.DENY,
        override: true,
      },
      referrerPolicy: {
        referrerPolicy: cloudfront.HeadersReferrerPolicy.STRICT_ORIGIN_WHEN_CROSS_ORIGIN,
        override: true,
      },
      strictTransportSecurity: {
        accessControlMaxAge: Duration.seconds(31536000), // 1 year
        includeSubdomains: true,
        preload: true,
        override: true,
      },
      contentSecurityPolicy: {
        contentSecurityPolicy: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https:; media-src 'self'; object-src 'none'; child-src 'none'; worker-src 'none'; frame-ancestors 'none'; form-action 'self'; base-uri 'self';",
        override: true,
      },
    },

    // Configure CORS headers for static content
    corsBehavior: {
      accessControlAllowCredentials: false,
      accessControlAllowHeaders: [
        'Content-Type',
        'X-Amz-Date',
        'Authorization',
        'X-Api-Key',
        'X-Amz-Security-Token',
        'X-Amz-User-Agent',
        'X-Requested-With',
      ],
      accessControlAllowMethods: ['GET', 'HEAD', 'OPTIONS'],
      accessControlAllowOrigins: ['*'],
      accessControlMaxAge: Duration.seconds(86400), // 24 hours
      originOverride: true,
    },
  });
}

/**
 * Creates a response headers policy for API Gateway with appropriate CORS settings
 * 
 * @param scope The construct scope
 * @param id The construct ID
 * @returns The created response headers policy
 */
export function createApiResponseHeadersPolicy(
  scope: Construct,
  id: string
): cloudfront.ResponseHeadersPolicy {
  return new cloudfront.ResponseHeadersPolicy(scope, 'ApiResponseHeadersPolicy', {
    responseHeadersPolicyName: `${id}-api-headers`,
    comment: 'Headers for API Gateway responses',

    // Configure minimal security headers for API responses
    securityHeadersBehavior: {
      contentTypeOptions: {
        override: false, // Let API Gateway control this
      },
      strictTransportSecurity: {
        accessControlMaxAge: Duration.seconds(31536000), // 1 year
        includeSubdomains: true,
        preload: true,
        override: false, // Let API Gateway control this
      },
    },

    // Configure CORS headers for API responses
    corsBehavior: {
      accessControlAllowCredentials: true,
      accessControlAllowHeaders: [
        'Content-Type',
        'X-Amz-Date',
        'Authorization',
        'X-Api-Key',
        'X-Amz-Security-Token',
        'X-Amz-User-Agent',
        'X-Requested-With',
      ],
      accessControlAllowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      accessControlAllowOrigins: ['*'], // Will be restricted when custom domain is configured
      accessControlMaxAge: Duration.seconds(3600), // 1 hour
      originOverride: false, // Let API Gateway control CORS
    },
  });
}