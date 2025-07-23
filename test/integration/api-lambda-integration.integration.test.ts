// @ts-nocheck
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
    
    // Add resources with unique paths to avoid name conflicts
    construct.addResource({
      path: '/test-users-get',
      lambdaSourcePath: './lambda/health', // Using health as a test function
      method: 'GET',
      requiresAuth: false
    });
    
    construct.addResource({
      path: '/test-users-post',
      lambdaSourcePath: './lambda/whoami', // Using whoami as a test function
      method: 'POST',
      requiresAuth: true
    });
    
    // Synthesize the template
    const template = Template.fromStack(stack);
    
    // Verify API resources are created
    const resources = template.findResources('AWS::ApiGateway::Resource');
    expect(Object.keys(resources).length).toBeGreaterThan(0);
    
    // Verify methods are created
    const methods = template.findResources('AWS::ApiGateway::Method');
    expect(Object.keys(methods).length).toBeGreaterThan(0);
    
    // Verify Lambda permissions for API Gateway
    template.hasResourceProperties('AWS::Lambda::Permission', {
      Action: 'lambda:InvokeFunction',
      Principal: 'apigateway.amazonaws.com'
    });
  });

  it('should correctly configure authentication for protected resources', () => {
    // Create a test stack and construct
    const app = new App();
    const stack = new Stack(app, 'AuthTestStack');
    const construct = new CDKServerlessAgenticAPI(stack, 'AuthTestConstruct');
    
    // Add public and authenticated resources with unique paths
    construct.addResource({
      path: '/test-public-endpoint',
      lambdaSourcePath: './lambda/health',
      requiresAuth: false
    });
    
    construct.addResource({
      path: '/test-private-endpoint',
      lambdaSourcePath: './lambda/whoami',
      requiresAuth: true
    });
    
    // Synthesize the template
    const template = Template.fromStack(stack);
    
    // Verify methods exist
    const methods = template.findResources('AWS::ApiGateway::Method');
    expect(Object.keys(methods).length).toBeGreaterThan(0);
    
    // Find methods with NONE authorization
    const publicMethods = Object.values(methods).filter(
      (m: any) => m.Properties.AuthorizationType === 'NONE' && m.Properties.HttpMethod === 'GET'
    );
    expect(publicMethods.length).toBeGreaterThan(0);
    
    // Find methods with COGNITO_USER_POOLS authorization
    const privateMethods = Object.values(methods).filter(
      (m: any) => m.Properties.AuthorizationType === 'COGNITO_USER_POOLS'
    );
    expect(privateMethods.length).toBeGreaterThan(0);
    
    // Verify Cognito authorizer is created
    template.hasResourceProperties('AWS::ApiGateway::Authorizer', {
      Type: 'COGNITO_USER_POOLS',
      IdentitySource: 'method.request.header.Authorization'
    });
  });
});