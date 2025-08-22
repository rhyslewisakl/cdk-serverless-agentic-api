import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import { CDKServerlessAgenticAPI } from 'cdk-serverless-agentic-api';

export class CloudscapeExampleStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Create DynamoDB table for items with user-scoped data
    const itemsTable = new dynamodb.Table(this, 'ItemsTable', {
      partitionKey: { name: 'userId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'itemId', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      pointInTimeRecovery: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY, // For demo purposes
    });

    // Add GSI for querying by status
    itemsTable.addGlobalSecondaryIndex({
      indexName: 'StatusIndex',
      partitionKey: { name: 'userId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'status', type: dynamodb.AttributeType.STRING },
    });

    // Create the serverless web app construct
    const webApp = new CDKServerlessAgenticAPI(this, 'CloudscapeWebApp', {
      enableLogging: true,
    });

    // Add CRUD endpoints for items
    const listItemsFunction = webApp.addResource({
      path: '/items',
      method: 'GET',
      lambdaSourcePath: '../lambda/items/list',
      requiresAuth: true,
      environment: {
        ITEMS_TABLE_NAME: itemsTable.tableName,
        STATUS_INDEX_NAME: 'StatusIndex',
      },
    });

    const createItemFunction = webApp.addResource({
      path: '/items',
      method: 'POST',
      lambdaSourcePath: '../lambda/items/create',
      requiresAuth: true,
      environment: {
        ITEMS_TABLE_NAME: itemsTable.tableName,
      },
    });

    const updateItemFunction = webApp.addResource({
      path: '/items/{itemId}',
      method: 'PUT',
      lambdaSourcePath: '../lambda/items/update',
      requiresAuth: true,
      environment: {
        ITEMS_TABLE_NAME: itemsTable.tableName,
      },
    });

    const deleteItemFunction = webApp.addResource({
      path: '/items/{itemId}',
      method: 'DELETE',
      lambdaSourcePath: '../lambda/items/delete',
      requiresAuth: true,
      environment: {
        ITEMS_TABLE_NAME: itemsTable.tableName,
      },
    });

    // Grant DynamoDB permissions to Lambda functions
    webApp.grantDynamoDBAccess(listItemsFunction, itemsTable, 'read');
    webApp.grantDynamoDBAccess(createItemFunction, itemsTable, 'write');
    webApp.grantDynamoDBAccess(updateItemFunction, itemsTable, 'readwrite');
    webApp.grantDynamoDBAccess(deleteItemFunction, itemsTable, 'readwrite');

    // Output important values for frontend configuration
    new cdk.CfnOutput(this, 'ApiEndpoint', {
      value: webApp.api.url,
      description: 'API Gateway endpoint URL',
    });

    new cdk.CfnOutput(this, 'UserPoolId', {
      value: webApp.userPool.userPoolId,
      description: 'Cognito User Pool ID',
    });

    new cdk.CfnOutput(this, 'UserPoolClientId', {
      value: webApp.userPoolClient.userPoolClientId,
      description: 'Cognito User Pool Client ID',
    });

    new cdk.CfnOutput(this, 'Region', {
      value: this.region,
      description: 'AWS Region',
    });

    if (webApp.distribution) {
      new cdk.CfnOutput(this, 'CloudFrontDomainName', {
        value: webApp.distribution.distributionDomainName,
        description: 'CloudFront domain name',
      });
    }

    if (webApp.bucket) {
      new cdk.CfnOutput(this, 'BucketName', {
        value: webApp.bucket.bucketName,
        description: 'S3 bucket name for frontend deployment',
      });
    }
  }
}