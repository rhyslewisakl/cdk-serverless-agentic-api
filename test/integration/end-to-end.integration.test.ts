import { describe, it, expect } from 'vitest';
import { App, Stack } from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { CDKServerlessAgenticAPI } from '../../src/cdk-serverless-agentic-api';

describe('End-to-End Integration', () => {
  it('should create a fully functional serverless web application', () => {
    // Create a test stack and construct with all features enabled
    const app = new App();
    const stack = new Stack(app, 'EndToEndTestStack');
    const construct = new CDKServerlessAgenticAPI(stack, 'EndToEndTestConstruct', {
      domainName: 'example.com',
      certificateArn: 'arn:aws:acm:us-east-1:123456789012:certificate/12345678-1234-1234-1234-123456789012',
      enableLogging: true
    });
    
    // Add multiple resources with different configurations
    construct.addResource({
      path: '/test-health',
      lambdaSourcePath: './lambda/health',
      requiresAuth: false
    });
    
    construct.addResource({
      path: '/test-whoami',
      lambdaSourcePath: './lambda/whoami',
      requiresAuth: true
    });
    
    construct.addResource({
      path: '/test-users',
      lambdaSourcePath: './lambda/health',
      method: 'GET',
      requiresAuth: false
    });
    
    construct.addResource({
      path: '/test-users-post',
      lambdaSourcePath: './lambda/whoami',
      method: 'POST',
      requiresAuth: true
    });
    
    // Synthesize the template
    const template = Template.fromStack(stack);
    
    // Verify all components are created and properly connected
    
    // 1. Verify S3 bucket for static website hosting
    template.hasResourceProperties('AWS::S3::Bucket', {
      VersioningConfiguration: {
        Status: 'Enabled'
      }
    });
    
    // 2. Verify CloudFront distribution with aliases
    template.hasResourceProperties('AWS::CloudFront::Distribution', {
      DistributionConfig: {
        Aliases: ['example.com'],
        DefaultRootObject: 'index.html',
        Enabled: true
      }
    });
    
    // 3. Verify API Gateway with resources and methods
    template.resourceCountIs('AWS::ApiGateway::Resource', 6); // Specific number of resources
    template.resourceCountIs('AWS::ApiGateway::Method', 13); // Specific number of methods (includes OPTIONS methods)
    
    // 4. Verify Cognito configuration
    template.hasResourceProperties('AWS::Cognito::UserPool', {
      AutoVerifiedAttributes: ['email']
    });
    
    // Check that the UserPoolClient has code flow
    template.hasResourceProperties('AWS::Cognito::UserPoolClient', {
      AllowedOAuthFlows: ['code']
    });
    
    // 5. Verify Lambda functions in registry
    expect(construct.lambdaFunctions.size).toBeGreaterThan(0);
    
    // 6. Verify security validation
    const securityResults = construct.validateSecurity({ logResults: false });
    expect(securityResults).toBeInstanceOf(Array);
    
    // 7. Verify logging configuration
    template.hasResourceProperties('AWS::ApiGateway::Stage', {
      MethodSettings: [
        {
          LoggingLevel: 'INFO',
          MetricsEnabled: true,
          DataTraceEnabled: true
        }
      ]
    });
    
    // 8. Verify CloudFront has logging configuration
    const cfDistributions = template.findResources('AWS::CloudFront::Distribution');
    const distribution = Object.values(cfDistributions)[0];
    expect(distribution.Properties.DistributionConfig.Logging).toBeDefined();
    expect(distribution.Properties.DistributionConfig.Logging.Bucket).toBeDefined();
  });
});