import { describe, it, expect } from 'vitest';
import { App, Stack } from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { ServerlessWebAppConstruct } from '../../src/serverless-web-app-construct';

describe('End-to-End Integration', () => {
  it('should create a fully functional serverless web application', () => {
    // Create a test stack and construct with all features enabled
    const app = new App();
    const stack = new Stack(app, 'EndToEndTestStack');
    const construct = new ServerlessWebAppConstruct(stack, 'EndToEndTestConstruct', {
      domainName: 'example.com',
      certificateArn: 'arn:aws:acm:us-east-1:123456789012:certificate/12345678-1234-1234-1234-123456789012',
      enableLogging: true
    });
    
    // Add multiple resources with different configurations
    construct.addResource({
      path: '/health',
      lambdaSourcePath: './lambda/health',
      requiresAuth: false
    });
    
    construct.addResource({
      path: '/whoami',
      lambdaSourcePath: './lambda/whoami',
      requiresAuth: true
    });
    
    construct.addResource({
      path: '/users',
      lambdaSourcePath: './lambda/health',
      httpMethod: 'GET',
      requiresAuth: false
    });
    
    construct.addResource({
      path: '/users',
      lambdaSourcePath: './lambda/whoami',
      httpMethod: 'POST',
      requiresAuth: true
    });
    
    // Synthesize the template
    const template = Template.fromStack(stack);
    
    // Verify all components are created and properly connected
    
    // 1. Verify S3 bucket for static website hosting
    template.hasResourceProperties('AWS::S3::Bucket', {
      WebsiteConfiguration: {
        IndexDocument: 'index.html',
        ErrorDocument: 'index.html'
      }
    });
    
    // 2. Verify CloudFront distribution with both origins
    template.hasResourceProperties('AWS::CloudFront::Distribution', {
      DistributionConfig: {
        Aliases: ['example.com'],
        DefaultRootObject: 'index.html',
        Enabled: true,
        HttpVersion: 'http2and3',
        Origins: [
          {
            DomainName: {
              'Fn::GetAtt': [expect.stringMatching(/.*Bucket.*/), 'RegionalDomainName']
            }
          },
          {
            DomainName: {
              'Fn::Join': [
                '',
                [
                  {
                    Ref: expect.stringMatching(/.*RestApi.*/)
                  },
                  expect.anything() // Rest of the domain name
                ]
              ]
            }
          }
        ],
        ViewerCertificate: {
          AcmCertificateArn: 'arn:aws:acm:us-east-1:123456789012:certificate/12345678-1234-1234-1234-123456789012'
        }
      }
    });
    
    // 3. Verify API Gateway with resources and methods
    template.resourceCountIs('AWS::ApiGateway::Resource', 2); // /health, /whoami, /users
    template.resourceCountIs('AWS::ApiGateway::Method', 4); // GET /health, GET /whoami, GET /users, POST /users
    
    // 4. Verify Cognito configuration
    template.hasResourceProperties('AWS::Cognito::UserPool', {
      AutoVerifiedAttributes: ['email']
    });
    
    template.hasResourceProperties('AWS::Cognito::UserPoolClient', {
      AllowedOAuthFlows: ['implicit', 'code']
    });
    
    template.hasResourceProperties('AWS::Cognito::IdentityPool', {
      AllowUnauthenticatedIdentities: true
    });
    
    // 5. Verify Lambda functions in registry
    expect(construct.lambdaFunctions.size).toBe(6); // 2 default + 4 added
    expect(construct.lambdaFunctions.has('GET /health')).toBe(true);
    expect(construct.lambdaFunctions.has('GET /whoami')).toBe(true);
    expect(construct.lambdaFunctions.has('GET /users')).toBe(true);
    expect(construct.lambdaFunctions.has('POST /users')).toBe(true);
    
    // 6. Verify security validation
    const securityResults = construct.validateSecurity();
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
    
    template.hasResourceProperties('AWS::CloudFront::Distribution', {
      DistributionConfig: {
        Logging: {
          Bucket: {
            'Fn::GetAtt': [expect.stringMatching(/.*LoggingBucket.*/), 'DomainName']
          }
        }
      }
    });
  });
});