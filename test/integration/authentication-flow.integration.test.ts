import { describe, it, expect } from 'vitest';
import { App, Stack } from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { ServerlessWebAppConstruct } from '../../src/serverless-web-app-construct';

describe('Authentication Flow Integration', () => {
  it('should correctly configure Cognito user pool and identity pool', () => {
    // Create a test stack and construct
    const app = new App();
    const stack = new Stack(app, 'AuthFlowTestStack');
    const construct = new ServerlessWebAppConstruct(stack, 'AuthFlowTestConstruct');
    
    // Add authenticated resource
    construct.addResource({
      path: '/profile',
      lambdaSourcePath: './lambda/whoami',
      requiresAuth: true
    });
    
    // Synthesize the template
    const template = Template.fromStack(stack);
    
    // Verify Cognito user pool configuration
    template.hasResourceProperties('AWS::Cognito::UserPool', {
      AutoVerifiedAttributes: ['email'],
      UsernameAttributes: ['email'],
      VerificationMessageTemplate: {
        DefaultEmailOption: 'CONFIRM_WITH_CODE'
      }
    });
    
    // Verify Cognito user pool client configuration
    template.hasResourceProperties('AWS::Cognito::UserPoolClient', {
      AllowedOAuthFlows: ['implicit', 'code'],
      AllowedOAuthFlowsUserPoolClient: true,
      AllowedOAuthScopes: ['phone', 'email', 'openid', 'profile'],
      CallbackURLs: expect.arrayContaining([expect.stringMatching(/https:\/\/.*/)]),
      SupportedIdentityProviders: ['COGNITO']
    });
    
    // Verify Cognito identity pool configuration
    template.hasResourceProperties('AWS::Cognito::IdentityPool', {
      AllowUnauthenticatedIdentities: true,
      CognitoIdentityProviders: [
        {
          ClientId: {
            Ref: expect.stringMatching(/.*UserPoolClient.*/)
          },
          ProviderName: {
            'Fn::GetAtt': [expect.stringMatching(/.*UserPool.*/), 'ProviderName']
          }
        }
      ]
    });
    
    // Verify authenticated and unauthenticated roles
    template.hasResourceProperties('AWS::IAM::Role', {
      AssumeRolePolicyDocument: {
        Statement: [
          {
            Action: 'sts:AssumeRoleWithWebIdentity',
            Effect: 'Allow',
            Principal: {
              Federated: 'cognito-identity.amazonaws.com'
            },
            Condition: {
              StringEquals: {
                'cognito-identity.amazonaws.com:aud': {
                  Ref: expect.stringMatching(/.*IdentityPool.*/)
                }
              },
              'ForAnyValue:StringLike': {
                'cognito-identity.amazonaws.com:amr': 'authenticated'
              }
            }
          }
        ]
      }
    });
    
    template.hasResourceProperties('AWS::IAM::Role', {
      AssumeRolePolicyDocument: {
        Statement: [
          {
            Action: 'sts:AssumeRoleWithWebIdentity',
            Effect: 'Allow',
            Principal: {
              Federated: 'cognito-identity.amazonaws.com'
            },
            Condition: {
              StringEquals: {
                'cognito-identity.amazonaws.com:aud': {
                  Ref: expect.stringMatching(/.*IdentityPool.*/)
                }
              },
              'ForAnyValue:StringLike': {
                'cognito-identity.amazonaws.com:amr': 'unauthenticated'
              }
            }
          }
        ]
      }
    });
    
    // Verify role attachment to identity pool
    template.hasResourceProperties('AWS::Cognito::IdentityPoolRoleAttachment', {
      IdentityPoolId: {
        Ref: expect.stringMatching(/.*IdentityPool.*/)
      },
      Roles: {
        authenticated: {
          'Fn::GetAtt': [expect.stringMatching(/.*AuthenticatedRole.*/), 'Arn']
        },
        unauthenticated: {
          'Fn::GetAtt': [expect.stringMatching(/.*UnauthenticatedRole.*/), 'Arn']
        }
      }
    });
  });

  it('should correctly configure API Gateway authorizer', () => {
    // Create a test stack and construct
    const app = new App();
    const stack = new Stack(app, 'ApiAuthorizerTestStack');
    const construct = new ServerlessWebAppConstruct(stack, 'ApiAuthorizerTestConstruct');
    
    // Add authenticated resource
    construct.addResource({
      path: '/secure',
      lambdaSourcePath: './lambda/whoami',
      requiresAuth: true
    });
    
    // Synthesize the template
    const template = Template.fromStack(stack);
    
    // Verify API Gateway authorizer configuration
    template.hasResourceProperties('AWS::ApiGateway::Authorizer', {
      Type: 'COGNITO_USER_POOLS',
      IdentitySource: 'method.request.header.Authorization',
      Name: expect.stringMatching(/.*CognitoAuthorizer.*/),
      ProviderARNs: [
        {
          'Fn::GetAtt': [expect.stringMatching(/.*UserPool.*/), 'Arn']
        }
      ],
      RestApiId: {
        Ref: expect.stringMatching(/.*RestApi.*/)
      }
    });
    
    // Verify method authorization
    template.hasResourceProperties('AWS::ApiGateway::Method', {
      HttpMethod: 'GET',
      ResourceId: {
        Ref: expect.stringMatching(/.*secureResource.*/)
      },
      AuthorizationType: 'COGNITO_USER_POOLS',
      AuthorizerId: {
        Ref: expect.stringMatching(/.*Authorizer.*/)
      }
    });
  });

  it('should correctly configure Lambda functions with Cognito environment variables', () => {
    // Create a test stack and construct
    const app = new App();
    const stack = new Stack(app, 'LambdaAuthTestStack');
    const construct = new ServerlessWebAppConstruct(stack, 'LambdaAuthTestConstruct');
    
    // Add authenticated resource
    construct.addResource({
      path: '/secure',
      lambdaSourcePath: './lambda/whoami',
      requiresAuth: true
    });
    
    // Get the Lambda function from the registry
    const lambdaFunction = construct.lambdaFunctions.get('GET /secure');
    
    // Verify Lambda function exists in registry
    expect(lambdaFunction).toBeDefined();
    
    // Synthesize the template
    const template = Template.fromStack(stack);
    
    // Verify Lambda function has Cognito environment variables
    template.hasResourceProperties('AWS::Lambda::Function', {
      Environment: {
        Variables: {
          USER_POOL_ID: {
            Ref: expect.stringMatching(/.*UserPool.*/)
          },
          USER_POOL_CLIENT_ID: {
            Ref: expect.stringMatching(/.*UserPoolClient.*/)
          },
          IDENTITY_POOL_ID: {
            Ref: expect.stringMatching(/.*IdentityPool.*/)
          }
        }
      }
    });
  });
});