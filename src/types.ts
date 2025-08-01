import * as lambda from 'aws-cdk-lib/aws-lambda';
// Note: We intentionally avoid importing iam types here to prevent circular dependencies

/**
 * Configuration properties for the CDKServerlessAgenticAPI
 */
export interface CDKServerlessAgenticAPIProps {
  /**
   * Custom domain name for the CloudFront distribution
   * @default - CloudFront will generate a domain name
   */
  readonly domainName?: string;

  /**
   * ARN of the SSL certificate for the custom domain
   * Required if domainName is provided
   */
  readonly certificateArn?: string;

  /**
   * Custom name for the S3 bucket
   * @default - CDK will generate a unique bucket name
   */
  readonly bucketName?: string;

  /**
   * Custom name for the Cognito User Pool
   * @default - CDK will generate a name based on the construct ID
   */
  readonly userPoolName?: string;

  /**
   * Custom name for the API Gateway
   * @default - CDK will generate a name based on the construct ID
   */
  readonly apiName?: string;

  /**
   * Enable detailed logging for all components
   * @default true
   */
  readonly enableLogging?: boolean;

  /**
   * Custom path to the directory containing Lambda function source code for default endpoints
   * @default - Uses the bundled lambda directory from the package
   */
  readonly lambdaSourcePath?: string;

  /**
   * Custom path to the directory containing error page HTML files
   * @default - Uses the bundled error-pages directory from the package
   */
  readonly errorPagesPath?: string;
}

/**
 * Options for adding a new API resource to the construct
 */
export interface AddResourceOptions {
  /**
   * The API path for the resource (e.g., '/users', '/products')
   * Will be prefixed with '/api' automatically
   */
  readonly path: string;

  /**
   * HTTP method for the resource
   * @default 'GET'
   */
  readonly method?: string;

  /**
   * Path to the directory containing the Lambda function source code
   */
  readonly lambdaSourcePath: string;

  /**
   * Whether the resource requires authentication
   * @default false
   */
  readonly requiresAuth?: boolean;

  /**
   * Cognito group required to access this resource
   * Only applicable if requiresAuth is true
   */
  readonly cognitoGroup?: string;

  /**
   * Environment variables to pass to the Lambda function
   */
  readonly environment?: { [key: string]: string };

  /**
   * Whether to enable Dead Letter Queue for the Lambda function
   * @default false
   */
  readonly enableDLQ?: boolean;

  /**
   * Whether to enable health alarms for the Lambda function
   * @default false
   */
  readonly enableHealthAlarms?: boolean;
}

/**
 * Configuration for a resource within the construct
 */
export interface ResourceConfig {
  /**
   * The full API path including '/api' prefix
   */
  readonly path: string;

  /**
   * HTTP method for the resource
   */
  readonly method: string;

  /**
   * Whether the resource requires authentication
   */
  readonly requiresAuth: boolean;

  /**
   * Cognito group required to access this resource
   */
  readonly cognitoGroup?: string;

  /**
   * Path to the Lambda function source directory
   */
  readonly lambdaSourcePath: string;

  /**
   * Environment variables for the Lambda function
   */
  readonly environment?: { [key: string]: string };

  /**
   * Whether Dead Letter Queue is enabled for the Lambda function
   */
  readonly enableDLQ?: boolean;

  /**
   * Whether health alarms are enabled for the Lambda function
   */
  readonly enableHealthAlarms?: boolean;
}

/**
 * Registry entry for Lambda functions
 */
export interface LambdaFunctionEntry {
  /**
   * The Lambda function instance
   */
  readonly function: lambda.Function;

  /**
   * Configuration used to create this function
   */
  readonly config: ResourceConfig;
}

/**
 * Options for creating a Lambda function
 */
export interface LambdaFunctionOptions {
  /**
   * Unique name for the Lambda function
   */
  readonly functionName: string;

  /**
   * Path to the directory containing the Lambda function source code
   */
  readonly sourcePath: string;

  /**
   * Environment variables to pass to the Lambda function
   */
  readonly environment?: { [key: string]: string };

  /**
   * Additional IAM policy statements to attach to the Lambda execution role
   */
  readonly additionalPolicies?: any[]; // Using any[] to avoid circular imports with iam types
}