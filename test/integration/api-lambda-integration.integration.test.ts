import { describe, it, expect } from 'vitest';
import { App, Stack } from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { CDKServerlessAgenticAPI } from '../../src/cdk-serverless-agentic-api';

describe('API Gateway to Lambda Integration', () => {
  it('should correctly integrate API Gateway with Lambda functions', () => {
    // Create a test stack and construct
    const app = new App();
    const stack = new Stack(app, 'ApiLambdaTestStack');
    const construct = new CDKServerlessAgenticAPI(stack, 'ApiLambdaTestConstruct');
    
    // Add multiple resources with different HTTP methods
    construct.addResource({
      path: '/users',
      lambdaSourcePath: './lambda/health', // Using health as a test function
      httpMethod: 'GET',
      requiresAuth: false
    });
    
    construct.addResource({
      path: '/users',
      lambdaSourcePath: './lambda/whoami', // Using whoami as a test function
      httpMethod: 'POST',
      requiresAuth: true
    });
    
    // Add a nested resource
    construct.addResource({
      path: '/users/{id}/profile',
      lambdaSourcePath: './lambda/whoami',
      httpMethod: 'GET',
      requiresAuth: true
    });
    
    // Synthesize the template
    const template = Template.fromStack(stack);
    
    // Verify API resources are created
    template.resourceCountIs('AWS::ApiGateway::Resource', 3); // /users, /{id}, /profile
    
    // Verify methods are created with correct HTTP methods
    template.hasResourceProperties('AWS::ApiGateway::Method', {
      HttpMethod: 'GET',
      ResourceId: {
        Ref: expect.stringMatching(/.*usersResource.*/)
      }
    });
    
    template.hasResourceProperties('AWS::ApiGateway::Method', {
      HttpMethod: 'POST',
      ResourceId: {
        Ref: expect.stringMatching(/.*usersResource.*/)
      }
    });
    
    // Verify Lambda integrations
    template.hasResourceProperties('AWS::ApiGateway::Method', {
      Integration: {
        Type: 'AWS_PROXY',
        IntegrationHttpMethod: 'POST',
        Uri: {
          'Fn::Join': [
            '',
            [
              'arn:',
              { Ref: 'AWS::Partition' },
              ':apigateway:',
              { Ref: 'AWS::Region' },
              ':lambda:path/2015-03-31/functions/',
              { 'Fn::GetAtt': [expect.stringMatching(/.*Lambda.*/), 'Arn'] },
              '/invocations'
            ]
          ]
        }
      }
    });
    
    // Verify Lambda permissions for API Gateway
    template.hasResourceProperties('AWS::Lambda::Permission', {
      Action: 'lambda:InvokeFunction',
      Principal: 'apigateway.amazonaws.com',
      SourceArn: {
        'Fn::Join': [
          '',
          [
            'arn:',
            { Ref: 'AWS::Partition' },
            ':execute-api:',
            { Ref: 'AWS::Region' },
            ':',
            { Ref: 'AWS::AccountId' },
            ':',
            { Ref: expect.stringMatching(/.*RestApi.*/) },
            '/*/*'
          ]
        ]
      }
    });
  });

  it('should correctly configure authentication for protected resources', () => {
    // Create a test stack and construct
    const app = new App();
    const stack = new Stack(app, 'AuthTestStack');
    const construct = new CDKServerlessAgenticAPI(stack, 'AuthTestConstruct');
    
    // Add public and authenticated resources
    construct.addResource({
      path: '/public',
      lambdaSourcePath: './lambda/health',
      requiresAuth: false
    });
    
    construct.addResource({
      path: '/private',
      lambdaSourcePath: './lambda/whoami',
      requiresAuth: true
    });
    
    // Synthesize the template
    const template = Template.fromStack(stack);
    
    // Verify public endpoint has no authorizer
    template.hasResourceProperties('AWS::ApiGateway::Method', {
      HttpMethod: 'GET',
      ResourceId: {
        Ref: expect.stringMatching(/.*publicResource.*/)
      },
      AuthorizationType: 'NONE'
    });
    
    // Verify private endpoint has Cognito authorizer
    template.hasResourceProperties('AWS::ApiGateway::Method', {
      HttpMethod: 'GET',
      ResourceId: {
        Ref: expect.stringMatching(/.*privateResource.*/)
      },
      AuthorizationType: 'COGNITO_USER_POOLS',
      AuthorizerId: {
        Ref: expect.stringMatching(/.*Authorizer.*/)
      }
    });
    
    // Verify Cognito authorizer is created
    template.hasResourceProperties('AWS::ApiGateway::Authorizer', {
      Type: 'COGNITO_USER_POOLS',
      IdentitySource: 'method.request.header.Authorization',
      ProviderARNs: [
        {
          'Fn::GetAtt': [expect.stringMatching(/.*UserPool.*/), 'Arn']
        }
      ]
    });
  });
});