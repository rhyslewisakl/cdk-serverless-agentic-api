import { describe, it, expect } from 'vitest';
import { App, Stack } from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { CDKServerlessAgenticAPI } from '../../src/cdk-serverless-agentic-api';

describe('Construct Deployment Integration', () => {
  it('should deploy construct with all required resources', () => {
    // Create a test stack and construct
    const app = new App();
    const stack = new Stack(app, 'IntegrationTestStack');
    const construct = new CDKServerlessAgenticAPI(stack, 'IntegrationTestConstruct');
    
    // Add a test resource
    construct.addResource({
      path: '/test',
      lambdaSourcePath: './lambda/health',
      requiresAuth: false
    });
    
    // Add an authenticated resource
    construct.addResource({
      path: '/secure',
      lambdaSourcePath: './lambda/whoami',
      requiresAuth: true
    });
    
    // Synthesize the template
    const template = Template.fromStack(stack);
    
    // Verify all required resources are created
    template.resourceCountIs('AWS::S3::Bucket', 1);
    template.resourceCountIs('AWS::CloudFront::Distribution', 1);
    template.resourceCountIs('AWS::ApiGateway::RestApi', 1);
    template.resourceCountIs('AWS::Cognito::UserPool', 1);
    template.resourceCountIs('AWS::Cognito::UserPoolClient', 1);
    template.resourceCountIs('AWS::Cognito::IdentityPool', 1);
    
    // Verify API resources are created
    template.hasResourceProperties('AWS::ApiGateway::Resource', {
      PathPart: 'test'
    });
    
    template.hasResourceProperties('AWS::ApiGateway::Resource', {
      PathPart: 'secure'
    });
    
    // Verify CloudFront has both origins (S3 and API Gateway)
    template.hasResourceProperties('AWS::CloudFront::Distribution', {
      DistributionConfig: {
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
        ]
      }
    });
  });

  it('should deploy construct with custom domain configuration', () => {
    // Create a test stack and construct with custom domain
    const app = new App();
    const stack = new Stack(app, 'CustomDomainTestStack');
    const construct = new CDKServerlessAgenticAPI(stack, 'CustomDomainTestConstruct', {
      domainName: 'example.com',
      certificateArn: 'arn:aws:acm:us-east-1:123456789012:certificate/12345678-1234-1234-1234-123456789012'
    });
    
    // Synthesize the template
    const template = Template.fromStack(stack);
    
    // Verify custom domain configuration
    template.hasResourceProperties('AWS::CloudFront::Distribution', {
      DistributionConfig: {
        Aliases: ['example.com'],
        ViewerCertificate: {
          AcmCertificateArn: 'arn:aws:acm:us-east-1:123456789012:certificate/12345678-1234-1234-1234-123456789012',
          SslSupportMethod: 'sni-only'
        }
      }
    });
  });

  it('should deploy construct with logging enabled', () => {
    // Create a test stack and construct with logging enabled
    const app = new App();
    const stack = new Stack(app, 'LoggingTestStack');
    const construct = new CDKServerlessAgenticAPI(stack, 'LoggingTestConstruct', {
      enableLogging: true
    });
    
    // Synthesize the template
    const template = Template.fromStack(stack);
    
    // Verify logging configuration
    template.hasResourceProperties('AWS::CloudFront::Distribution', {
      DistributionConfig: {
        Logging: {
          Bucket: {
            'Fn::GetAtt': [expect.stringMatching(/.*LoggingBucket.*/), 'DomainName']
          }
        }
      }
    });
    
    // Verify API Gateway has logging enabled
    template.hasResourceProperties('AWS::ApiGateway::Stage', {
      MethodSettings: [
        {
          LoggingLevel: 'INFO',
          MetricsEnabled: true,
          DataTraceEnabled: true
        }
      ]
    });
  });
});