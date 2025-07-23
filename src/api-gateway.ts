import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import { RemovalPolicy, Duration, Size } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { CDKServerlessAgenticAPIProps, ResourceConfig } from './types';

/**
 * Creates CloudWatch log group for API Gateway
 * 
 * @param scope The construct scope
 * @param id The construct ID
 * @returns The created log group
 */
export function createApiGatewayLogGroup(
  scope: Construct,
  id: string
): logs.LogGroup {
  return new logs.LogGroup(scope, 'ApiGatewayLogGroup', {
    logGroupName: `/aws/apigateway/${id}-api`,
    retention: logs.RetentionDays.ONE_MONTH,
    removalPolicy: RemovalPolicy.DESTROY,
  });
}

/**
 * Creates the API Gateway REST API with comprehensive logging configuration
 * 
 * @param scope The construct scope
 * @param id The construct ID
 * @param props Configuration properties
 * @returns The created API Gateway REST API
 */
export function createApiGateway(
  scope: Construct,
  id: string,
  props?: CDKServerlessAgenticAPIProps
): apigateway.RestApi {
  // Create CloudWatch log group for API Gateway if logging is enabled
  const logGroup = props?.enableLogging !== false ? createApiGatewayLogGroup(scope, id) : undefined;

  return new apigateway.RestApi(scope, 'Api', {
    restApiName: props?.apiName || `${id}-api`,
    description: `REST API for ${id} serverless web application`,
    
    // Configure deployment settings
    deploy: true,
    deployOptions: {
      stageName: 'api',
      description: 'Production deployment',
      // Enable detailed CloudWatch metrics
      metricsEnabled: props?.enableLogging !== false,
      // Enable data trace logging for debugging
      dataTraceEnabled: props?.enableLogging !== false,
      // Log full requests and responses for debugging
      loggingLevel: props?.enableLogging !== false 
        ? apigateway.MethodLoggingLevel.INFO 
        : apigateway.MethodLoggingLevel.OFF,
      // Enable throttling
      throttlingBurstLimit: 5000,
      throttlingRateLimit: 2000,
    },

    // Configure CORS for cross-origin requests
    defaultCorsPreflightOptions: {
      allowOrigins: apigateway.Cors.ALL_ORIGINS,
      allowMethods: apigateway.Cors.ALL_METHODS,
      allowHeaders: [
        'Content-Type',
        'X-Amz-Date',
        'Authorization',
        'X-Api-Key',
        'X-Amz-Security-Token',
        'X-Amz-User-Agent',
        'X-Requested-With',
      ],
      allowCredentials: true,
      maxAge: Duration.hours(1),
    },

    // Configure binary media types for file uploads
    binaryMediaTypes: [
      'application/octet-stream',
      'image/*',
      'multipart/form-data',
    ],

    // Configure endpoint configuration
    endpointConfiguration: {
      types: [apigateway.EndpointType.REGIONAL],
    },

    // Configure API key settings
    apiKeySourceType: apigateway.ApiKeySourceType.HEADER,

    // Configure minimum compression size
    minCompressionSize: Size.bytes(1024),

    // Configure policy for the API (will be restrictive by default)
    policy: new iam.PolicyDocument({
      statements: [
        new iam.PolicyStatement({
          effect: iam.Effect.ALLOW,
          principals: [new iam.AnyPrincipal()],
          actions: ['execute-api:Invoke'],
          resources: ['*'],
          conditions: {
            IpAddress: {
              'aws:SourceIp': ['0.0.0.0/0', '::/0'], // Allow all IPs by default
            },
          },
        }),
      ],
    }),

    // Configure CloudWatch role for logging
    cloudWatchRole: props?.enableLogging !== false,
  });
}

/**
 * Creates the Cognito authorizer for authenticated API endpoints
 * 
 * @param scope The construct scope
 * @param api The API Gateway REST API
 * @param userPool The Cognito User Pool
 * @param id The construct ID
 * @returns The created Cognito authorizer
 */
export function createCognitoAuthorizer(
  scope: Construct,
  api: apigateway.RestApi,
  userPool: cognito.UserPool,
  id: string
): apigateway.CfnAuthorizer {
  // Create the authorizer using CfnAuthorizer
  return new apigateway.CfnAuthorizer(scope, 'CognitoAuthorizer', {
    restApiId: api.restApiId,
    name: `${id}-cognito-authorizer`,
    type: 'COGNITO_USER_POOLS',
    identitySource: 'method.request.header.Authorization',
    providerArns: [userPool.userPoolArn],
    authorizerResultTtlInSeconds: 300,
  });
}

/**
 * Creates or retrieves an API Gateway resource for the given path
 * 
 * @param api The API Gateway REST API
 * @param resourcePath The full resource path (e.g., '/api/users')
 * @returns The API Gateway resource
 */
export function createApiGatewayResource(
  api: apigateway.RestApi,
  resourcePath: string
): apigateway.Resource {
  // Remove /api prefix for API Gateway resource creation
  const pathWithoutApi = resourcePath.replace(/^\/api/, '');
  
  // Split path into segments
  const pathSegments = pathWithoutApi.split('/').filter(segment => segment.length > 0);
  
  // Start from the root resource
  let currentResource = api.root;
  
  // Create nested resources for each path segment
  for (const segment of pathSegments) {
    // Check if resource already exists
    const existingResource = currentResource.getResource(segment);
    if (existingResource) {
      currentResource = existingResource;
    } else {
      // Create new resource
      currentResource = currentResource.addResource(segment, {
        defaultCorsPreflightOptions: {
          allowOrigins: apigateway.Cors.ALL_ORIGINS,
          allowMethods: apigateway.Cors.ALL_METHODS,
          allowHeaders: [
            'Content-Type',
            'X-Amz-Date',
            'Authorization',
            'X-Api-Key',
            'X-Amz-Security-Token',
            'X-Amz-User-Agent',
            'X-Requested-With',
          ],
          allowCredentials: true,
          maxAge: Duration.hours(1),
        },
      });
    }
  }
  
  return currentResource as apigateway.Resource;
}

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
export function createApiGatewayMethod(
  resource: apigateway.Resource,
  config: ResourceConfig,
  lambdaFunction: lambda.Function,
  cognitoAuthorizer: apigateway.CfnAuthorizer,
  api: apigateway.RestApi
): apigateway.Method {
  // Create Lambda integration with comprehensive error handling
  const integration = new apigateway.LambdaIntegration(lambdaFunction, {
    proxy: true,
    allowTestInvoke: true,
    integrationResponses: [
      {
        statusCode: '200',
        responseParameters: {
          'method.response.header.Access-Control-Allow-Origin': "'*'",
          'method.response.header.Access-Control-Allow-Headers': "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token,X-Requested-With'",
          'method.response.header.Access-Control-Allow-Methods': "'GET,POST,PUT,DELETE,PATCH,OPTIONS'",
          'method.response.header.Access-Control-Allow-Credentials': "'true'",
        },
      },
      {
        statusCode: '400',
        selectionPattern: '.*"statusCode": 400.*',
        responseParameters: {
          'method.response.header.Access-Control-Allow-Origin': "'*'",
          'method.response.header.Access-Control-Allow-Headers': "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token,X-Requested-With'",
          'method.response.header.Access-Control-Allow-Methods': "'GET,POST,PUT,DELETE,PATCH,OPTIONS'",
          'method.response.header.Access-Control-Allow-Credentials': "'true'",
        },
      },
      {
        statusCode: '401',
        selectionPattern: '.*"statusCode": 401.*',
        responseParameters: {
          'method.response.header.Access-Control-Allow-Origin': "'*'",
          'method.response.header.Access-Control-Allow-Headers': "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token,X-Requested-With'",
          'method.response.header.Access-Control-Allow-Methods': "'GET,POST,PUT,DELETE,PATCH,OPTIONS'",
          'method.response.header.Access-Control-Allow-Credentials': "'true'",
        },
      },
      {
        statusCode: '403',
        selectionPattern: '.*"statusCode": 403.*',
        responseParameters: {
          'method.response.header.Access-Control-Allow-Origin': "'*'",
          'method.response.header.Access-Control-Allow-Headers': "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token,X-Requested-With'",
          'method.response.header.Access-Control-Allow-Methods': "'GET,POST,PUT,DELETE,PATCH,OPTIONS'",
          'method.response.header.Access-Control-Allow-Credentials': "'true'",
        },
      },
      {
        statusCode: '404',
        selectionPattern: '.*"statusCode": 404.*',
        responseParameters: {
          'method.response.header.Access-Control-Allow-Origin': "'*'",
          'method.response.header.Access-Control-Allow-Headers': "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token,X-Requested-With'",
          'method.response.header.Access-Control-Allow-Methods': "'GET,POST,PUT,DELETE,PATCH,OPTIONS'",
          'method.response.header.Access-Control-Allow-Credentials': "'true'",
        },
      },
      {
        statusCode: '405',
        selectionPattern: '.*"statusCode": 405.*',
        responseParameters: {
          'method.response.header.Access-Control-Allow-Origin': "'*'",
          'method.response.header.Access-Control-Allow-Headers': "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token,X-Requested-With'",
          'method.response.header.Access-Control-Allow-Methods': "'GET,POST,PUT,DELETE,PATCH,OPTIONS'",
          'method.response.header.Access-Control-Allow-Credentials': "'true'",
        },
      },
      {
        statusCode: '429',
        selectionPattern: '.*"statusCode": 429.*',
        responseParameters: {
          'method.response.header.Access-Control-Allow-Origin': "'*'",
          'method.response.header.Access-Control-Allow-Headers': "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token,X-Requested-With'",
          'method.response.header.Access-Control-Allow-Methods': "'GET,POST,PUT,DELETE,PATCH,OPTIONS'",
          'method.response.header.Access-Control-Allow-Credentials': "'true'",
          'method.response.header.Retry-After': "'60'",
        },
      },
      {
        statusCode: '500',
        selectionPattern: '.*"statusCode": 5\\d{2}.*',
        responseParameters: {
          'method.response.header.Access-Control-Allow-Origin': "'*'",
          'method.response.header.Access-Control-Allow-Headers': "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token,X-Requested-With'",
          'method.response.header.Access-Control-Allow-Methods': "'GET,POST,PUT,DELETE,PATCH,OPTIONS'",
          'method.response.header.Access-Control-Allow-Credentials': "'true'",
        },
      },
    ],
  });

  // Configure method options based on authentication requirements
  const methodOptions: apigateway.MethodOptions = {
    methodResponses: [
      {
        statusCode: '200',
        responseParameters: {
          'method.response.header.Access-Control-Allow-Origin': true,
          'method.response.header.Access-Control-Allow-Headers': true,
          'method.response.header.Access-Control-Allow-Methods': true,
          'method.response.header.Access-Control-Allow-Credentials': true,
        },
      },
      {
        statusCode: '400',
        responseParameters: {
          'method.response.header.Access-Control-Allow-Origin': true,
          'method.response.header.Access-Control-Allow-Headers': true,
          'method.response.header.Access-Control-Allow-Methods': true,
          'method.response.header.Access-Control-Allow-Credentials': true,
        },
      },
      {
        statusCode: '401',
        responseParameters: {
          'method.response.header.Access-Control-Allow-Origin': true,
          'method.response.header.Access-Control-Allow-Headers': true,
          'method.response.header.Access-Control-Allow-Methods': true,
          'method.response.header.Access-Control-Allow-Credentials': true,
        },
      },
      {
        statusCode: '403',
        responseParameters: {
          'method.response.header.Access-Control-Allow-Origin': true,
          'method.response.header.Access-Control-Allow-Headers': true,
          'method.response.header.Access-Control-Allow-Methods': true,
          'method.response.header.Access-Control-Allow-Credentials': true,
        },
      },
      {
        statusCode: '404',
        responseParameters: {
          'method.response.header.Access-Control-Allow-Origin': true,
          'method.response.header.Access-Control-Allow-Headers': true,
          'method.response.header.Access-Control-Allow-Methods': true,
          'method.response.header.Access-Control-Allow-Credentials': true,
        },
      },
      {
        statusCode: '405',
        responseParameters: {
          'method.response.header.Access-Control-Allow-Origin': true,
          'method.response.header.Access-Control-Allow-Headers': true,
          'method.response.header.Access-Control-Allow-Methods': true,
          'method.response.header.Access-Control-Allow-Credentials': true,
        },
      },
      {
        statusCode: '429',
        responseParameters: {
          'method.response.header.Access-Control-Allow-Origin': true,
          'method.response.header.Access-Control-Allow-Headers': true,
          'method.response.header.Access-Control-Allow-Methods': true,
          'method.response.header.Access-Control-Allow-Credentials': true,
          'method.response.header.Retry-After': true,
        },
      },
      {
        statusCode: '500',
        responseParameters: {
          'method.response.header.Access-Control-Allow-Origin': true,
          'method.response.header.Access-Control-Allow-Headers': true,
          'method.response.header.Access-Control-Allow-Methods': true,
          'method.response.header.Access-Control-Allow-Credentials': true,
        },
      },
    ],
    // Add authorization if required
    ...(config.requiresAuth && {
      authorizationType: apigateway.AuthorizationType.COGNITO,
      authorizer: {
        authorizerId: cognitoAuthorizer.ref,
      } as any,
      ...(config.cognitoGroup && {
        authorizationScopes: [`${config.cognitoGroup}`],
      }),
    }),
  };

  // Create the method
  const method = resource.addMethod(config.method, integration, methodOptions);

  // Grant API Gateway permission to invoke the Lambda function
  // Generate a safe permission ID using the resource path and method
  const permissionId = `ApiGatewayInvoke-${config.method}-${config.path.replace(/[^a-zA-Z0-9]/g, '')}`;
  lambdaFunction.addPermission(permissionId, {
    principal: new iam.ServicePrincipal('apigateway.amazonaws.com'),
    action: 'lambda:InvokeFunction',
    sourceArn: api.arnForExecuteApi(config.method, resource.path),
  });

  return method;
}