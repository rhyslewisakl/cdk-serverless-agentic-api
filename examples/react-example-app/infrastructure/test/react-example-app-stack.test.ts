import * as cdk from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { ReactExampleAppStack } from '../src/react-example-app-stack';

describe('ReactExampleAppStack', () => {
  test('creates DynamoDB table with correct configuration', () => {
    const app = new cdk.App();
    const stack = new ReactExampleAppStack(app, 'TestStack');
    const template = Template.fromStack(stack);

    // Verify DynamoDB table exists
    template.hasResourceProperties('AWS::DynamoDB::Table', {
      BillingMode: 'PAY_PER_REQUEST',
      PointInTimeRecoverySpecification: {
        PointInTimeRecoveryEnabled: true
      },
      AttributeDefinitions: [
        {
          AttributeName: 'id',
          AttributeType: 'S'
        },
        {
          AttributeName: 'userId',
          AttributeType: 'S'
        },
        {
          AttributeName: 'createdAt',
          AttributeType: 'S'
        }
      ],
      KeySchema: [
        {
          AttributeName: 'id',
          KeyType: 'HASH'
        }
      ]
    });

    // Verify Global Secondary Index
    template.hasResourceProperties('AWS::DynamoDB::Table', {
      GlobalSecondaryIndexes: [
        {
          IndexName: 'userId-createdAt-index',
          KeySchema: [
            {
              AttributeName: 'userId',
              KeyType: 'HASH'
            },
            {
              AttributeName: 'createdAt',
              KeyType: 'RANGE'
            }
          ],
          Projection: {
            ProjectionType: 'ALL'
          }
        }
      ]
    });
  });

  test('creates required outputs', () => {
    const app = new cdk.App();
    const stack = new ReactExampleAppStack(app, 'TestStack');
    const template = Template.fromStack(stack);

    // Verify outputs exist
    template.hasOutput('UserPoolId', {});
    template.hasOutput('UserPoolClientId', {});
    template.hasOutput('ApiUrl', {});
    template.hasOutput('CloudFrontUrl', {});
    template.hasOutput('UserItemsTableName', {});
    template.hasOutput('S3BucketName', {});
  });

  test('configures Cognito with proper settings', () => {
    const app = new cdk.App();
    const stack = new ReactExampleAppStack(app, 'TestStack');
    const template = Template.fromStack(stack);

    // Verify Cognito User Pool exists
    template.hasResourceProperties('AWS::Cognito::UserPool', {
      Policies: {
        PasswordPolicy: {
          MinimumLength: 8,
          RequireLowercase: true,
          RequireNumbers: true,
          RequireSymbols: true,
          RequireUppercase: true
        }
      },
      UsernameAttributes: ['email'],
      AutoVerifiedAttributes: ['email']
    });
  });
});