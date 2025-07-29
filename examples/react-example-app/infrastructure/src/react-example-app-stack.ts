import * as cdk from 'aws-cdk-lib';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';
import { CDKServerlessAgenticAPI } from 'cdk-serverless-agentic-api';

export class ReactExampleAppStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Create DynamoDB table for user items with proper indexes
    const userItemsTable = new dynamodb.Table(this, 'UserItemsTable', {
      tableName: `${this.stackName}-UserItems`,
      partitionKey: {
        name: 'id',
        type: dynamodb.AttributeType.STRING,
      },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY, // For example purposes
      pointInTimeRecovery: true,
    });

    // Add Global Secondary Index for querying by userId
    userItemsTable.addGlobalSecondaryIndex({
      indexName: 'userId-createdAt-index',
      partitionKey: {
        name: 'userId',
        type: dynamodb.AttributeType.STRING,
      },
      sortKey: {
        name: 'createdAt',
        type: dynamodb.AttributeType.STRING,
      },
    });

    // Create the serverless web app construct
    const webApp = new CDKServerlessAgenticAPI(this, 'ReactExampleApp', {
      domainName: undefined, // Will use CloudFront default domain
      enableLogging: true,
    });

    // Add DynamoDB table information as environment variables to existing Lambda functions
    Object.values(webApp.lambdaFunctions).forEach((lambdaEntry: any) => {
      const lambdaFunction = lambdaEntry.function;
      lambdaFunction.addEnvironment('USER_ITEMS_TABLE_NAME', userItemsTable.tableName);
      lambdaFunction.addEnvironment('USER_ITEMS_GSI_NAME', 'userId-createdAt-index');
    });

    // Add CRUD API endpoints with DynamoDB environment variables
    const listItemsFunction = webApp.addResource({
      path: '/items',
      method: 'GET',
      lambdaSourcePath: './lambda/items-list',
      requiresAuth: true,
      environment: {
        USER_ITEMS_TABLE_NAME: userItemsTable.tableName,
        USER_ITEMS_GSI_NAME: 'UserItemsGSI'
      }
    });

    const createItemFunction = webApp.addResource({
      path: '/items',
      method: 'POST',
      lambdaSourcePath: './lambda/items-create',
      requiresAuth: true,
      environment: {
        USER_ITEMS_TABLE_NAME: userItemsTable.tableName
      }
    });

    const updateItemFunction = webApp.addResource({
      path: '/items/{id}',
      method: 'PUT',
      lambdaSourcePath: './lambda/items-update',
      requiresAuth: true,
      environment: {
        USER_ITEMS_TABLE_NAME: userItemsTable.tableName
      }
    });

    const deleteItemFunction = webApp.addResource({
      path: '/items/{id}',
      method: 'DELETE',
      lambdaSourcePath: './lambda/items-delete',
      requiresAuth: true,
      environment: {
        USER_ITEMS_TABLE_NAME: userItemsTable.tableName
      }
    });

    // Grant DynamoDB permissions using the construct's helper method
    webApp.grantDynamoDBAccess(listItemsFunction, userItemsTable, 'read');
    webApp.grantDynamoDBAccess(createItemFunction, userItemsTable, 'write');
    webApp.grantDynamoDBAccess(updateItemFunction, userItemsTable, 'readwrite');
    webApp.grantDynamoDBAccess(deleteItemFunction, userItemsTable, 'readwrite');

    // Output important values
    new cdk.CfnOutput(this, 'UserPoolId', {
      value: webApp.userPool.userPoolId,
      description: 'Cognito User Pool ID',
    });

    new cdk.CfnOutput(this, 'UserPoolClientId', {
      value: webApp.userPoolClient.userPoolClientId,
      description: 'Cognito User Pool Client ID',
    });

    new cdk.CfnOutput(this, 'ApiUrl', {
      value: webApp.api.url,
      description: 'API Gateway URL',
    });

    new cdk.CfnOutput(this, 'CloudFrontUrl', {
      value: `https://${webApp.distribution.distributionDomainName}`,
      description: 'CloudFront Distribution URL',
    });

    new cdk.CfnOutput(this, 'UserItemsTableName', {
      value: userItemsTable.tableName,
      description: 'DynamoDB User Items Table Name',
    });

    new cdk.CfnOutput(this, 'S3BucketName', {
      value: webApp.bucket.bucketName,
      description: 'S3 Website Bucket Name',
    });
  }
}