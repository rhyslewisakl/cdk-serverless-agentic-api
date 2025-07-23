import { Construct } from 'constructs';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { 
  CDKServerlessAgenticAPIProps, 
  AddResourceOptions, 
  ResourceConfig,
  LambdaFunctionEntry 
} from './types';
import * as iam from 'aws-cdk-lib/aws-iam';
import { validateSecurityConfiguration, SecurityValidationResult, SecurityValidationOptions, SecurityEnforcementOptions, enforceSecurityBestPractices } from './security-validation';
import { createS3Bucket, createOriginAccessIdentity, configureBucketPolicy, createLoggingBucket } from './s3';
import { createUserPool } from './cognito';
import { createApiGateway, createCognitoAuthorizer, createApiGatewayResource, createApiGatewayMethod } from './api-gateway';
import { createLambdaFunction, createApiLambdaFunction } from './lambda';
import { createCloudFrontDistribution } from './cloudfront';
import { createMonitoringResources } from './monitoring';
import * as path from 'path';

/**
 * CDK construct that creates a complete serverless web application infrastructure
 * including CloudFront, S3, Cognito, API Gateway, and Lambda functions.
 */
export class CDKServerlessAgenticAPI extends Construct {
  /**
   * The CloudFront distribution that serves as the main entry point
   */
  public readonly distribution: cloudfront.Distribution;

  /**
   * The S3 bucket used for static website hosting
   */
  public readonly bucket: s3.Bucket;

  /**
   * The CloudFront Origin Access Identity for S3 bucket access
   */
  public readonly originAccessIdentity: cloudfront.OriginAccessIdentity;

  /**
   * The Cognito User Pool for authentication
   */
  public readonly userPool: cognito.UserPool;

  /**
   * The Cognito User Pool Client for API Gateway integration
   */
  private _userPoolClient!: cognito.UserPoolClient;

  /**
   * Gets the Cognito User Pool Client for API Gateway integration
   */
  public get userPoolClient(): cognito.UserPoolClient {
    return this._userPoolClient;
  }

  /**
   * The API Gateway REST API
   */
  public readonly api: apigateway.RestApi;

  /**
   * The Cognito authorizer for authenticated API endpoints
   */
  public readonly cognitoAuthorizer: apigateway.CfnAuthorizer;

  /**
   * Registry of Lambda functions indexed by their resource path
   */
  public readonly lambdaFunctions: Record<string, LambdaFunctionEntry>;

  /**
   * Internal registry of resource configurations
   */
  private readonly resourceConfigs: Record<string, ResourceConfig>;

  /**
   * Creates a new CDKServerlessAgenticAPI
   * 
   * @param scope The parent construct
   * @param id The construct ID
   * @param props Configuration properties
   */
  constructor(scope: Construct, id: string, props?: CDKServerlessAgenticAPIProps) {
    super(scope, id);

    // Initialize internal state
    this.lambdaFunctions = {};
    this.resourceConfigs = {};

    // Validate props
    if (props?.domainName && !props?.certificateArn) {
      throw new Error('certificateArn is required when domainName is provided');
    }

    // Create S3 bucket for static website hosting
    this.bucket = createS3Bucket(this, id, props);

    // Create CloudFront Origin Access Identity for secure S3 access
    this.originAccessIdentity = createOriginAccessIdentity(this, id);

    // Configure S3 bucket policy for CloudFront access
    configureBucketPolicy(this.bucket, this.originAccessIdentity);

    // Create Cognito User Pool for authentication
    const cognitoResources = createUserPool(this, id, props);
    this.userPool = cognitoResources.userPool;
    this._userPoolClient = cognitoResources.userPoolClient;

    // Create API Gateway with Cognito authorizer
    this.api = createApiGateway(this, id, props);
    this.cognitoAuthorizer = createCognitoAuthorizer(this, this.api, this.userPool, id);

    // Create logging bucket if logging is enabled
    const loggingBucket = props?.enableLogging !== false ? createLoggingBucket(this) : undefined;

    // Create CloudFront distribution
    this.distribution = createCloudFrontDistribution(
      this, 
      id, 
      this.bucket, 
      this.originAccessIdentity, 
      this.api, 
      props, 
      loggingBucket
    );

    // Configure monitoring and alarms if logging is enabled
    if (props?.enableLogging !== false) {
      createMonitoringResources(
        this as any as Construct,
        this.api,
        this.lambdaFunctions,
        this.distribution,
        id
      );
    }

    // Create default endpoints
    this.createDefaultEndpoints();
  }

  /**
   * Creates default health, whoami, and config endpoints
   */
  private createDefaultEndpoints(): void {
    // Create health endpoint
    this.addResource({
      path: '/health',
      method: 'GET',
      lambdaSourcePath: path.join(__dirname, '../lambda/health'),
      requiresAuth: false,
      environment: {
        API_VERSION: '1.0.0',
        SERVICE_NAME: 'serverless-web-app-api'
      }
    });

    // Create whoami endpoint
    this.addResource({
      path: '/whoami',
      method: 'GET',
      lambdaSourcePath: path.join(__dirname, '../lambda/whoami'),
      requiresAuth: true,
      environment: {
        API_VERSION: '1.0.0',
        SERVICE_NAME: 'serverless-web-app-api'
      }
    });
    
    // Create config endpoint for frontend configuration
    this.addResource({
      path: '/config',
      method: 'GET',
      lambdaSourcePath: path.join(__dirname, '../lambda/config'),
      requiresAuth: false,
      environment: {
        USER_POOL_ID: this.userPool.userPoolId,
        USER_POOL_CLIENT_ID: this.userPoolClient.userPoolClientId,
        COGNITO_DOMAIN: `${this.userPool.userPoolId}.auth.${process.env.AWS_REGION || 'us-east-1'}.amazoncognito.com`,
        API_URL: this.api.url,
        API_VERSION: '1.0.0',
        AWS_REGION: process.env.AWS_REGION || 'us-east-1'
      }
    });
  }

  /**
   * Adds a new API resource with an associated Lambda function
   * 
   * @param options Configuration for the new resource
   * @returns The created Lambda function
   */
  public addResource(options: AddResourceOptions): lambda.Function {
    // Validate input parameters
    this.validateAddResourceOptions(options);

    // Create resource configuration
    const config: ResourceConfig = {
      path: `/api${options.path}`,
      method: options.method || 'GET',
      requiresAuth: options.requiresAuth || false,
      cognitoGroup: options.cognitoGroup,
      lambdaSourcePath: options.lambdaSourcePath,
      environment: options.environment
    };

    // Store configuration for later implementation
    const resourceKey = `${config.method}:${config.path}`;
    this.resourceConfigs[resourceKey] = config;

    // Create Lambda function for this resource
    const lambdaFunction = createApiLambdaFunction(
      this,
      config.path,
      config,
      this.userPool,
      this.userPoolClient,
      this.api,
      this.node.id
    );

    // Create API Gateway resource and method
    const apiResource = createApiGatewayResource(this.api, config.path);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    createApiGatewayMethod(
      apiResource,
      config,
      lambdaFunction,
      this.cognitoAuthorizer,
      this.api
    );

    // Store Lambda function in registry
    const lambdaEntry: LambdaFunctionEntry = {
      function: lambdaFunction,
      config: config
    };

    this.lambdaFunctions[config.path] = lambdaEntry;
    
    return lambdaFunction;
  }

  /**
   * Validates the options provided to addResource method
   * 
   * @param options The options to validate
   * @throws Error if validation fails
   */
  private validateAddResourceOptions(options: AddResourceOptions): void {
    if (!options.path) {
      throw new Error('Resource path is required');
    }

    if (!options.path.startsWith('/')) {
      throw new Error('Resource path must start with "/"');
    }

    if (!options.lambdaSourcePath) {
      throw new Error('Lambda source path is required');
    }

    if (options.method && !['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'].includes(options.method.toUpperCase())) {
      throw new Error('Invalid HTTP method. Supported methods: GET, POST, PUT, DELETE, PATCH, OPTIONS');
    }

    if (options.cognitoGroup && !options.requiresAuth) {
      throw new Error('cognitoGroup can only be specified when requiresAuth is true');
    }
  }

  /**
   * Creates a Lambda function from a source directory with proper IAM role and configuration
   * 
   * @param functionName Unique name for the Lambda function
   * @param sourcePath Path to the directory containing the Lambda function source code
   * @param environment Environment variables to pass to the Lambda function
   * @param additionalPolicies Additional IAM policies to attach to the Lambda execution role
   * @returns The created Lambda function
   */
  public createLambdaFunction(
    functionName: string,
    sourcePath: string,
    environment?: { [key: string]: string },
    additionalPolicies?: iam.PolicyStatement[]
  ): lambda.Function {
    return createLambdaFunction(
      this,
      functionName,
      sourcePath,
      this.node.id,
      environment,
      additionalPolicies
    );
  }

  /**
   * Validates the security configuration of the construct
   * 
   * @param options Security validation options
   * @returns Array of validation results
   */
  public validateSecurity(options: SecurityValidationOptions = {}): SecurityValidationResult[] {
    const defaultOptions: SecurityValidationOptions = {
      throwOnFailure: false,
      logResults: true
    };
    
    return validateSecurityConfiguration(this, { ...defaultOptions, ...options });
  }
  
  /**
   * Enforces security best practices for the construct
   * 
   * @param options Security enforcement options
   */
  public enforceSecurityBestPractices(options: SecurityEnforcementOptions = {}): void {
    enforceSecurityBestPractices(this, options);
  }
}