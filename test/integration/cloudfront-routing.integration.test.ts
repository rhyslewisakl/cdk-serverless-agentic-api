import { describe, it, expect } from 'vitest';
import { App, Stack } from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { CDKServerlessAgenticAPI } from '../../src/cdk-serverless-agentic-api';

describe('CloudFront Routing Integration', () => {
  it('should correctly route requests to S3 and API Gateway origins', () => {
    // Create a test stack and construct
    const app = new App();
    const stack = new Stack(app, 'CloudFrontRoutingTestStack');
    const construct = new CDKServerlessAgenticAPI(stack, 'CloudFrontRoutingTestConstruct');
    
    // Add API resources
    construct.addResource({
      path: '/users',
      lambdaSourcePath: './lambda/health',
      requiresAuth: false
    });
    
    // Synthesize the template
    const template = Template.fromStack(stack);
    
    // Verify CloudFront distribution has correct origins
    template.hasResourceProperties('AWS::CloudFront::Distribution', {
      DistributionConfig: {
        // Default cache behavior should point to S3 origin
        DefaultCacheBehavior: {
          TargetOriginId: {
            'Fn::Join': [
              '',
              [
                expect.stringMatching(/.*Stack.*/),
                expect.stringMatching(/.*DistributionOrigin1.*/)
              ]
            ]
          },
          ViewerProtocolPolicy: 'redirect-to-https'
        },
        // Cache behavior for /api/* should point to API Gateway origin
        CacheBehaviors: [
          {
            PathPattern: '/api/*',
            TargetOriginId: {
              'Fn::Join': [
                '',
                [
                  expect.stringMatching(/.*Stack.*/),
                  expect.stringMatching(/.*DistributionOrigin2.*/)
                ]
              ]
            },
            ViewerProtocolPolicy: 'redirect-to-https'
          }
        ]
      }
    });
    
    // Verify S3 origin configuration
    template.hasResourceProperties('AWS::CloudFront::Distribution', {
      DistributionConfig: {
        Origins: expect.arrayContaining([
          expect.objectContaining({
            DomainName: {
              'Fn::GetAtt': [expect.stringMatching(/.*Bucket.*/), 'RegionalDomainName']
            },
            S3OriginConfig: expect.objectContaining({
              OriginAccessIdentity: expect.anything()
            })
          })
        ])
      }
    });
    
    // Verify API Gateway origin configuration
    template.hasResourceProperties('AWS::CloudFront::Distribution', {
      DistributionConfig: {
        Origins: expect.arrayContaining([
          expect.objectContaining({
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
            },
            CustomOriginConfig: expect.objectContaining({
              OriginProtocolPolicy: 'https-only'
            })
          })
        ])
      }
    });
  });

  it('should configure error responses for SPA routing', () => {
    // Create a test stack and construct
    const app = new App();
    const stack = new Stack(app, 'ErrorResponseTestStack');
    const construct = new CDKServerlessAgenticAPI(stack, 'ErrorResponseTestConstruct');
    
    // Synthesize the template
    const template = Template.fromStack(stack);
    
    // Verify custom error responses are configured
    template.hasResourceProperties('AWS::CloudFront::Distribution', {
      DistributionConfig: {
        CustomErrorResponses: expect.arrayContaining([
          expect.objectContaining({
            ErrorCode: 403,
            ResponseCode: 200,
            ResponsePagePath: '/index.html'
          }),
          expect.objectContaining({
            ErrorCode: 404,
            ResponseCode: 200,
            ResponsePagePath: '/index.html'
          })
        ])
      }
    });
  });

  it('should configure proper cache behaviors', () => {
    // Create a test stack and construct
    const app = new App();
    const stack = new Stack(app, 'CacheBehaviorTestStack');
    const construct = new CDKServerlessAgenticAPI(stack, 'CacheBehaviorTestConstruct');
    
    // Synthesize the template
    const template = Template.fromStack(stack);
    
    // Verify default cache behavior for S3 static content
    template.hasResourceProperties('AWS::CloudFront::Distribution', {
      DistributionConfig: {
        DefaultCacheBehavior: {
          AllowedMethods: ['GET', 'HEAD', 'OPTIONS'],
          CachedMethods: ['GET', 'HEAD', 'OPTIONS'],
          Compress: true,
          DefaultTTL: 86400, // 1 day
          ForwardedValues: {
            QueryString: false,
            Cookies: {
              Forward: 'none'
            }
          }
        }
      }
    });
    
    // Verify API Gateway cache behavior
    template.hasResourceProperties('AWS::CloudFront::Distribution', {
      DistributionConfig: {
        CacheBehaviors: [
          {
            PathPattern: '/api/*',
            AllowedMethods: ['DELETE', 'GET', 'HEAD', 'OPTIONS', 'PATCH', 'POST', 'PUT'],
            CachedMethods: ['GET', 'HEAD', 'OPTIONS'],
            ForwardedValues: {
              QueryString: true,
              Headers: expect.arrayContaining(['Authorization']),
              Cookies: {
                Forward: 'all'
              }
            }
          }
        ]
      }
    });
  });
});