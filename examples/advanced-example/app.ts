import { App, Stack, StackProps, CfnOutput } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { ServerlessWebAppConstruct } from '../../src';

/**
 * Example stack that demonstrates advanced usage of the ServerlessWebAppConstruct
 * with custom domain and DynamoDB integration
 */
class AdvancedExampleStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    // Create a DynamoDB table for storing user data
    const userTable = new dynamodb.Table(this, 'UserTable', {
      partitionKey: { name: 'userId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'dataType', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      pointInTimeRecovery: true
    });

    // Create a DynamoDB table for storing product data
    const productTable = new dynamodb.Table(this, 'ProductTable', {
      partitionKey: { name: 'productId', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      pointInTimeRecovery: true
    });

    // Create the serverless web app construct with custom domain
    const webApp = new ServerlessWebAppConstruct(this, 'AdvancedWebApp', {
      domainName: 'example.com',
      certificateArn: 'arn:aws:acm:us-east-1:123456789012:certificate/12345678-1234-1234-1234-123456789012',
      enableLogging: true
    });

    // Add API resources for user management
    const getUsersFunction = webApp.addResource({
      path: '/users',
      method: 'GET',
      lambdaSourcePath: './lambda/users/get',
      requiresAuth: true,
      environment: {
        USER_TABLE_NAME: userTable.tableName
      }
    });

    const createUserFunction = webApp.addResource({
      path: '/users',
      method: 'POST',
      lambdaSourcePath: './lambda/users/create',
      requiresAuth: true,
      environment: {
        USER_TABLE_NAME: userTable.tableName
      }
    });

    const getUserProfileFunction = webApp.addResource({
      path: '/users/{userId}/profile',
      method: 'GET',
      lambdaSourcePath: './lambda/users/profile',
      requiresAuth: true,
      environment: {
        USER_TABLE_NAME: userTable.tableName
      }
    });

    // Add API resources for product management
    const getProductsFunction = webApp.addResource({
      path: '/products',
      method: 'GET',
      lambdaSourcePath: './lambda/products/get',
      requiresAuth: false,
      environment: {
        PRODUCT_TABLE_NAME: productTable.tableName
      }
    });

    const createProductFunction = webApp.addResource({
      path: '/products',
      method: 'POST',
      lambdaSourcePath: './lambda/products/create',
      requiresAuth: true,
      cognitoGroup: 'admin',
      environment: {
        PRODUCT_TABLE_NAME: productTable.tableName
      }
    });

    const getProductDetailsFunction = webApp.addResource({
      path: '/products/{productId}',
      method: 'GET',
      lambdaSourcePath: './lambda/products/details',
      requiresAuth: false,
      environment: {
        PRODUCT_TABLE_NAME: productTable.tableName
      }
    });

    // Grant permissions to Lambda functions
    userTable.grantReadData(getUsersFunction);
    userTable.grantReadWriteData(createUserFunction);
    userTable.grantReadData(getUserProfileFunction);
    
    productTable.grantReadData(getProductsFunction);
    productTable.grantReadWriteData(createProductFunction);
    productTable.grantReadData(getProductDetailsFunction);

    // Validate security configuration
    const securityResults = webApp.validateSecurity();
    
    // Outputs
    new CfnOutput(this, 'CloudFrontDomainName', {
      value: webApp.distribution.distributionDomainName,
      description: 'CloudFront domain name'
    });
    
    new CfnOutput(this, 'ApiEndpoint', {
      value: webApp.api.url,
      description: 'API Gateway endpoint URL'
    });
    
    new CfnOutput(this, 'UserPoolId', {
      value: webApp.userPool.userPoolId,
      description: 'Cognito User Pool ID'
    });
    
    new CfnOutput(this, 'UserPoolClientId', {
      value: webApp.userPoolClient.userPoolClientId,
      description: 'Cognito User Pool Client ID'
    });
  }
}

// Initialize the CDK app
const app = new App();
new AdvancedExampleStack(app, 'AdvancedExampleStack');
app.synth();