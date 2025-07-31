import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import { RemovalPolicy, Duration } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as path from 'path';
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
export function createLambdaFunction(
  scope: Construct,
  functionName: string,
  sourcePath: string,
  constructId: string,
  environment?: { [key: string]: string },
  additionalPolicies?: iam.PolicyStatement[]
): lambda.Function {
  // Validate input parameters
  validateLambdaFunctionParameters(functionName, sourcePath);

  // Create IAM role for Lambda execution with least privilege
  const executionRole = createLambdaExecutionRole(scope, functionName, constructId, additionalPolicies);

  // Create CloudWatch log group for the Lambda function
  const logGroup = createLambdaLogGroup(scope, functionName, constructId);

  // Create the Lambda function
  const lambdaFunction = new lambda.Function(scope, functionName, {
    functionName: `${constructId}-${functionName}`,
    runtime: lambda.Runtime.NODEJS_20_X,
    handler: 'index.handler',
    code: lambda.Code.fromAsset(sourcePath),
    role: executionRole,
    logGroup: logGroup,
    environment: {
      NODE_ENV: 'production',
      LOG_LEVEL: 'info',
      ...environment,
    },
    timeout: Duration.seconds(30),
    memorySize: 256,
    deadLetterQueueEnabled: true,
    retryAttempts: 2,
    architecture: lambda.Architecture.ARM_64,
    tracing: lambda.Tracing.ACTIVE,
    insightsVersion: lambda.LambdaInsightsVersion.VERSION_1_0_229_0,
    description: `Lambda function for ${functionName} in ${constructId} construct`,
  });

  // Add permission for API Gateway to invoke this Lambda function
  // Using account and region from CDK context to allow any API Gateway in the same account to invoke
  lambdaFunction.addPermission('ApiGatewayInvokePermission', {
    principal: new iam.ServicePrincipal('apigateway.amazonaws.com'),
    action: 'lambda:InvokeFunction',
    sourceArn: `arn:aws:execute-api:${scope.node.tryGetContext('aws:cdk:region') || process.env.CDK_DEFAULT_REGION || ''}:${scope.node.tryGetContext('aws:cdk:account') || process.env.CDK_DEFAULT_ACCOUNT}:*`,
  });

  return lambdaFunction;
}

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
export function createApiLambdaFunction(
  scope: Construct,
  resourcePath: string,
  config: ResourceConfig,
  userPool: cognito.UserPool,
  userPoolClient: cognito.UserPoolClient,
  constructId: string
): lambda.Function {
  // Generate function name from resource path
  const functionName = generateLambdaFunctionName(resourcePath, config.method);

  // Create additional policies for API Gateway integration
  const additionalPolicies = createApiLambdaPolicies(config);

  // Add API Gateway specific environment variables
  const apiEnvironment = {
    USER_POOL_ID: userPool.userPoolId,
    USER_POOL_CLIENT_ID: userPoolClient.userPoolClientId,
    CORS_ORIGIN: '*', // Will be configured via CloudFront response headers
    ...config.environment,
  };

  // Create the Lambda function
  const lambdaFunction = createLambdaFunction(
    scope,
    functionName,
    config.lambdaSourcePath,
    constructId,
    apiEnvironment,
    additionalPolicies
  );

  return lambdaFunction;
}

/**
 * Validates parameters for Lambda function creation
 * 
 * @param functionName The function name to validate
 * @param sourcePath The source path to validate
 * @throws Error if validation fails
 */
function validateLambdaFunctionParameters(functionName: string, sourcePath: string): void {
  if (!functionName || functionName.trim().length === 0) {
    throw new Error('Lambda function name is required and cannot be empty');
  }

  if (!/^[a-zA-Z0-9-_]+$/.test(functionName)) {
    throw new Error('Lambda function name can only contain alphanumeric characters, hyphens, and underscores');
  }

  if (functionName.length > 64) {
    throw new Error('Lambda function name cannot exceed 64 characters');
  }

  if (!sourcePath || sourcePath.trim().length === 0) {
    throw new Error('Lambda source path is required and cannot be empty');
  }

  // Validate that the source path exists (basic check)
  if (!path.isAbsolute(sourcePath) && !sourcePath.startsWith('./') && !sourcePath.startsWith('../')) {
    throw new Error('Lambda source path must be absolute or relative (starting with ./ or ../)');
  }
}

/**
 * Creates an IAM execution role for Lambda function with least privilege principles
 * 
 * @param scope The construct scope
 * @param functionName The name of the Lambda function
 * @param constructId The ID of the parent construct
 * @param additionalPolicies Additional policy statements to attach to the role
 * @returns The created IAM role
 */
function createLambdaExecutionRole(
  scope: Construct,
  functionName: string,
  constructId: string,
  additionalPolicies?: iam.PolicyStatement[]
): iam.Role {
  // Create unique construct ID to prevent name clashes using scope path
  const scopeHash = Math.abs(scope.node.path.split('').reduce((a, b) => {
    a = ((a << 5) - a) + b.charCodeAt(0);
    return a & a;
  }, 0)).toString(36).substring(0, 6);
  const uniqueConstructId = `${functionName}ExecutionRole${scopeHash}`;
  
  // Create the execution role
  const role = new iam.Role(scope, uniqueConstructId, {
    roleName: `${constructId}-${functionName}-execution-role`,
    assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
    description: `Execution role for ${functionName} Lambda function`,
    managedPolicies: [
      // Basic Lambda execution permissions
      iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole'),
      // X-Ray tracing permissions
      iam.ManagedPolicy.fromAwsManagedPolicyName('AWSXRayDaemonWriteAccess'),
      // Lambda Insights permissions
      iam.ManagedPolicy.fromAwsManagedPolicyName('CloudWatchLambdaInsightsExecutionRolePolicy'),
    ],
  });

  // Add CloudWatch Logs permissions with specific log group access
  role.addToPolicy(new iam.PolicyStatement({
    sid: 'CloudWatchLogsAccess',
    effect: iam.Effect.ALLOW,
    actions: [
      'logs:CreateLogStream',
      'logs:PutLogEvents',
    ],
    resources: [
      `arn:aws:logs:*:*:log-group:/aws/lambda/${constructId}-${functionName}:*`,
    ],
  }));

  // Add Dead Letter Queue permissions
  role.addToPolicy(new iam.PolicyStatement({
    sid: 'DeadLetterQueueAccess',
    effect: iam.Effect.ALLOW,
    actions: [
      'sqs:SendMessage',
    ],
    resources: [
      `arn:aws:sqs:*:*:${constructId}-${functionName}-dlq`,
    ],
  }));

  // Add additional policies if provided
  if (additionalPolicies && additionalPolicies.length > 0) {
    additionalPolicies.forEach(policy => {
      role.addToPolicy(policy);
    });
  }

  return role;
}

/**
 * Creates a CloudWatch log group for the Lambda function with structured logging configuration
 * 
 * @param scope The construct scope
 * @param functionName The name of the Lambda function
 * @param constructId The ID of the parent construct
 * @returns The created log group
 */
function createLambdaLogGroup(
  scope: Construct,
  functionName: string,
  constructId: string
): logs.LogGroup {
  return new logs.LogGroup(scope, `${functionName}LogGroup`, {
    logGroupName: `/aws/lambda/${constructId}-${functionName}`,
    retention: logs.RetentionDays.ONE_MONTH,
    removalPolicy: RemovalPolicy.DESTROY,
  });
}

/**
 * Generates a Lambda function name from resource path and HTTP method
 * 
 * @param resourcePath The API resource path
 * @param method The HTTP method
 * @returns A valid Lambda function name
 */
function generateLambdaFunctionName(resourcePath: string, method: string): string {
  // Remove /api prefix and clean up the path
  const cleanPath = resourcePath.replace(/^\/api/, '').replace(/[^a-zA-Z0-9]/g, '-');
  const cleanMethod = method.toLowerCase();
  
  // Create function name: method-path (e.g., get-users, post-products)
  let functionName = `${cleanMethod}${cleanPath}`;
  
  // Remove leading/trailing hyphens and ensure it's not empty
  functionName = functionName.replace(/^-+|-+$/g, '') || 'handler';
  
  // Ensure it doesn't exceed length limits (accounting for construct ID prefix and role suffix)
  // IAM role name limit is 64 chars, and we add "-execution-role" (15 chars) plus construct ID
  const maxLength = 30; // Conservative limit to account for construct ID and suffix
  if (functionName.length > maxLength) {
    functionName = functionName.substring(0, maxLength);
  }
  
  // Remove trailing hyphens after truncation
  functionName = functionName.replace(/-+$/, '') || 'handler';
  
  return functionName;
}

/**
 * Creates additional IAM policies for API Gateway Lambda functions
 * 
 * @param config Resource configuration
 * @param userPool The Cognito User Pool
 * @param api The API Gateway REST API
 * @returns Array of policy statements
 */
function createApiLambdaPolicies(
  config: ResourceConfig,
): iam.PolicyStatement[] {
  const policies: iam.PolicyStatement[] = [];

  // If authentication is required, add Cognito permissions
  if (config.requiresAuth) {
    policies.push(new iam.PolicyStatement({
      sid: 'CognitoAccess',
      effect: iam.Effect.ALLOW,
      actions: [
        'cognito-idp:GetUser',
        'cognito-idp:ListUsers',
        'cognito-idp:AdminGetUser',
      ],
      resources: ["*"],
    }));

    // If specific group is required, add group-related permissions
    if (config.cognitoGroup) {
      policies.push(new iam.PolicyStatement({
        sid: 'CognitoGroupAccess',
        effect: iam.Effect.ALLOW,
        actions: [
          'cognito-idp:AdminListGroupsForUser',
          'cognito-idp:GetGroup',
        ],
        resources: ["*"],
      }));
    }
  }

  return policies;
}