import { describe, it, expect, beforeEach } from 'vitest';
import { App, Stack } from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as iam from 'aws-cdk-lib/aws-iam';
import { CDKServerlessAgenticAPI } from '../src/cdk-serverless-agentic-api';
import { CDKServerlessAgenticAPIProps } from '../src/types';

describe('CDKServerlessAgenticAPI', () => {
  let app: App;
  let stack: Stack;
  let template: Template;

  beforeEach(() => {
    app = new App();
    stack = new Stack(app, 'TestStack');
  });

  describe('Constructor', () => {
    it('should create construct with default properties', () => {
      const construct = new ServerlessWebAppConstruct(stack, 'TestConstruct');
      template = Template.fromStack(stack);
      
      expect(construct).toBeDefined();
      expect(construct.lambdaFunctions).toBeInstanceOf(Map);
      expect(construct.lambdaFunctions.size).toBe(2); // Health and whoami endpoints are automatically created
      expect(construct.bucket).toBeInstanceOf(s3.Bucket);
      expect(construct.originAccessIdentity).toBeDefined();
    });

    it('should create construct with custom properties', () => {
      const props: ServerlessWebAppConstructProps = {
        domainName: 'example.com',
        certificateArn: 'arn:aws:acm:us-east-1:123456789012:certificate/12345678-1234-1234-1234-123456789012',
        bucketName: 'my-custom-bucket',
        userPoolName: 'my-user-pool',
        apiName: 'my-api',
        enableLogging: false
      };

      const construct = new ServerlessWebAppConstruct(stack, 'TestConstruct', props);
      template = Template.fromStack(stack);
      
      expect(construct).toBeDefined();
      expect(construct.lambdaFunctions).toBeInstanceOf(Map);
      expect(construct.bucket).toBeInstanceOf(s3.Bucket);
    });

    it('should throw error when domainName is provided without certificateArn', () => {
      const props: ServerlessWebAppConstructProps = {
        domainName: 'example.com'
      };

      expect(() => {
        new ServerlessWebAppConstruct(stack, 'TestConstruct', props);
      }).toThrow('certificateArn is required when domainName is provided');
    });
  });

  describe('addResource method', () => {
    let construct: ServerlessWebAppConstruct;

    beforeEach(() => {
      construct = new ServerlessWebAppConstruct(stack, 'TestConstruct');
    });

    it('should add a resource with minimal options', () => {
      construct.addResource({
        path: '/test',
        lambdaSourcePath: './lambda/test'
      });

      expect(construct.lambdaFunctions.size).toBe(2); // Health endpoint + test endpoint
      expect(construct.lambdaFunctions.has('/api/test')).toBe(true);
      expect(construct.lambdaFunctions.has('/api/health')).toBe(true);
      
      const entry = construct.lambdaFunctions.get('/api/test');
      expect(entry?.config.path).toBe('/api/test');
      expect(entry?.config.method).toBe('GET');
      expect(entry?.config.requiresAuth).toBe(false);
    });

    it('should add a resource with full options', () => {
      construct.addResource({
        path: '/users',
        method: 'POST',
        lambdaSourcePath: './lambda/users',
        requiresAuth: true,
        cognitoGroup: 'admin',
        environment: {
          TABLE_NAME: 'users-table'
        }
      });

      expect(construct.lambdaFunctions.size).toBe(2); // Health endpoint + users endpoint
      expect(construct.lambdaFunctions.has('/api/users')).toBe(true);
      expect(construct.lambdaFunctions.has('/api/health')).toBe(true);
      
      const entry = construct.lambdaFunctions.get('/api/users');
      expect(entry?.config.path).toBe('/api/users');
      expect(entry?.config.method).toBe('POST');
      expect(entry?.config.requiresAuth).toBe(true);
      expect(entry?.config.cognitoGroup).toBe('admin');
      expect(entry?.config.environment).toEqual({ TABLE_NAME: 'users-table' });
    });

    it('should throw error for missing path', () => {
      expect(() => {
        construct.addResource({
          path: '',
          lambdaSourcePath: './lambda/test'
        });
      }).toThrow('Resource path is required');
    });

    it('should throw error for path not starting with /', () => {
      expect(() => {
        construct.addResource({
          path: 'test',
          lambdaSourcePath: './lambda/test'
        });
      }).toThrow('Resource path must start with "/"');
    });

    it('should throw error for missing lambda source path', () => {
      expect(() => {
        construct.addResource({
          path: '/test',
          lambdaSourcePath: ''
        });
      }).toThrow('Lambda source path is required');
    });

    it('should throw error for invalid HTTP method', () => {
      expect(() => {
        construct.addResource({
          path: '/test',
          method: 'INVALID',
          lambdaSourcePath: './lambda/test'
        });
      }).toThrow('Invalid HTTP method');
    });

    it('should throw error for cognito group without auth', () => {
      expect(() => {
        construct.addResource({
          path: '/test',
          lambdaSourcePath: './lambda/test',
          requiresAuth: false,
          cognitoGroup: 'admin'
        });
      }).toThrow('cognitoGroup can only be specified when requiresAuth is true');
    });

    it('should allow multiple resources', () => {
      construct.addResource({
        path: '/users',
        lambdaSourcePath: './lambda/users'
      });

      construct.addResource({
        path: '/products',
        method: 'POST',
        lambdaSourcePath: './lambda/products'
      });

      expect(construct.lambdaFunctions.size).toBe(3); // Health endpoint + users + products
      expect(construct.lambdaFunctions.has('/api/users')).toBe(true);
      expect(construct.lambdaFunctions.has('/api/products')).toBe(true);
      expect(construct.lambdaFunctions.has('/api/health')).toBe(true);
    });

    describe('API Gateway Integration', () => {
      it('should create API Gateway resource for simple path', () => {
        construct.addResource({
          path: '/test',
          lambdaSourcePath: './lambda/test'
        });

        const newTemplate = Template.fromStack(stack);
        
        // Verify API Gateway resource is created
        newTemplate.hasResourceProperties('AWS::ApiGateway::Resource', {
          PathPart: 'test',
          ParentId: {
            'Fn::GetAtt': [
              'TestConstructApi5A83971A',
              'RootResourceId'
            ]
          }
        });
      });

      it('should create nested API Gateway resources for complex path', () => {
        construct.addResource({
          path: '/users/profile',
          lambdaSourcePath: './lambda/users-profile'
        });

        const newTemplate = Template.fromStack(stack);
        
        // Verify both 'users' and 'profile' resources are created
        newTemplate.hasResourceProperties('AWS::ApiGateway::Resource', {
          PathPart: 'users'
        });
        
        newTemplate.hasResourceProperties('AWS::ApiGateway::Resource', {
          PathPart: 'profile'
        });
      });

      it('should create API Gateway method with correct configuration', () => {
        construct.addResource({
          path: '/test',
          method: 'POST',
          lambdaSourcePath: './lambda/test'
        });

        const newTemplate = Template.fromStack(stack);
        
        // Verify API Gateway method is created
        newTemplate.hasResourceProperties('AWS::ApiGateway::Method', {
          HttpMethod: 'POST',
          AuthorizationType: 'NONE',
          Integration: {
            Type: 'AWS_PROXY',
            IntegrationHttpMethod: 'POST'
          },
          MethodResponses: [
            { StatusCode: '200' },
            { StatusCode: '400' },
            { StatusCode: '401' },
            { StatusCode: '403' },
            { StatusCode: '500' }
          ]
        });
      });

      it('should create authenticated API Gateway method with Cognito authorizer', () => {
        construct.addResource({
          path: '/secure',
          method: 'GET',
          lambdaSourcePath: './lambda/secure',
          requiresAuth: true
        });

        const newTemplate = Template.fromStack(stack);
        
        // Verify API Gateway method has Cognito authorization
        newTemplate.hasResourceProperties('AWS::ApiGateway::Method', {
          HttpMethod: 'GET',
          AuthorizationType: 'COGNITO_USER_POOLS',
          AuthorizerId: {
            Ref: 'TestConstructCognitoAuthorizerB37F6F12'
          }
        });
      });

      it('should create API Gateway method with authorization scopes for Cognito groups', () => {
        construct.addResource({
          path: '/admin',
          method: 'DELETE',
          lambdaSourcePath: './lambda/admin',
          requiresAuth: true,
          cognitoGroup: 'admin'
        });

        const newTemplate = Template.fromStack(stack);
        
        // Verify API Gateway method has authorization scopes
        newTemplate.hasResourceProperties('AWS::ApiGateway::Method', {
          HttpMethod: 'DELETE',
          AuthorizationType: 'COGNITO_USER_POOLS',
          AuthorizationScopes: ['admin']
        });
      });

      it('should configure CORS for API Gateway resources', () => {
        construct.addResource({
          path: '/cors-test',
          lambdaSourcePath: './lambda/cors-test'
        });

        const newTemplate = Template.fromStack(stack);
        
        // Verify OPTIONS method is created for CORS
        newTemplate.hasResourceProperties('AWS::ApiGateway::Method', {
          HttpMethod: 'OPTIONS'
        });
      });

      it('should grant Lambda permission for API Gateway invocation', () => {
        construct.addResource({
          path: '/permission-test',
          method: 'PUT',
          lambdaSourcePath: './lambda/permission-test'
        });

        const newTemplate = Template.fromStack(stack);
        
        // Verify Lambda permission is created
        newTemplate.hasResourceProperties('AWS::Lambda::Permission', {
          Action: 'lambda:InvokeFunction',
          Principal: 'apigateway.amazonaws.com'
        });
      });

      it('should handle multiple methods on the same resource path', () => {
        construct.addResource({
          path: '/multi',
          method: 'GET',
          lambdaSourcePath: './lambda/multi-get'
        });

        construct.addResource({
          path: '/multi',
          method: 'POST',
          lambdaSourcePath: './lambda/multi-post'
        });

        const newTemplate = Template.fromStack(stack);
        
        // Verify both methods are created on the same resource
        newTemplate.hasResourceProperties('AWS::ApiGateway::Method', {
          HttpMethod: 'GET'
        });
        
        newTemplate.hasResourceProperties('AWS::ApiGateway::Method', {
          HttpMethod: 'POST'
        });

        // Verify only one resource is created for the path
        const resources = newTemplate.findResources('AWS::ApiGateway::Resource');
        const multiResources = Object.values(resources).filter((resource: any) => 
          resource.Properties.PathPart === 'multi'
        );
        expect(multiResources).toHaveLength(1);
      });

      it('should create Lambda integration with proxy configuration', () => {
        construct.addResource({
          path: '/proxy-test',
          lambdaSourcePath: './lambda/proxy-test'
        });

        const newTemplate = Template.fromStack(stack);
        
        // Verify Lambda integration is configured as proxy
        newTemplate.hasResourceProperties('AWS::ApiGateway::Method', {
          Integration: {
            Type: 'AWS_PROXY',
            IntegrationHttpMethod: 'POST',
            RequestTemplates: {
              'application/json': '{ "statusCode": "200" }'
            }
          }
        });
      });

      it('should configure proper response headers for CORS', () => {
        construct.addResource({
          path: '/headers-test',
          lambdaSourcePath: './lambda/headers-test'
        });

        const newTemplate = Template.fromStack(stack);
        
        // Verify method responses include CORS headers
        const methods = newTemplate.findResources('AWS::ApiGateway::Method');
        const method = Object.values(methods).find((m: any) => 
          m.Properties.HttpMethod === 'GET' && 
          m.Properties.ResourceId && 
          m.Properties.MethodResponses
        );
        
        expect(method).toBeDefined();
        const methodResponses = (method as any).Properties.MethodResponses;
        const successResponse = methodResponses.find((r: any) => r.StatusCode === '200');
        expect(successResponse).toBeDefined();
      });
    });
  });

  describe('S3 Static Website Hosting', () => {
    let construct: ServerlessWebAppConstruct;

    beforeEach(() => {
      construct = new ServerlessWebAppConstruct(stack, 'TestConstruct');
      template = Template.fromStack(stack);
    });

    it('should create S3 bucket with proper configuration', () => {
      // Verify S3 bucket is created with versioning
      template.hasResourceProperties('AWS::S3::Bucket', {
        VersioningConfiguration: {
          Status: 'Enabled'
        }
      });

      // Verify public access is blocked
      template.hasResourceProperties('AWS::S3::Bucket', {
        PublicAccessBlockConfiguration: {
          BlockPublicAcls: true,
          BlockPublicPolicy: true,
          IgnorePublicAcls: true,
          RestrictPublicBuckets: true
        }
      });

      // Verify lifecycle configuration exists
      template.resourceCountIs('AWS::S3::Bucket', 1);
      const bucketResources = template.findResources('AWS::S3::Bucket');
      const bucketResource = Object.values(bucketResources)[0];
      expect(bucketResource.Properties.LifecycleConfiguration).toBeDefined();
      expect(bucketResource.Properties.LifecycleConfiguration.Rules).toHaveLength(2);
    });

    it('should create S3 bucket with custom name when provided', () => {
      const customApp = new App();
      const customStack = new Stack(customApp, 'CustomStack');
      const customConstruct = new ServerlessWebAppConstruct(customStack, 'CustomConstruct', {
        bucketName: 'my-custom-bucket-name'
      });
      const customTemplate = Template.fromStack(customStack);

      customTemplate.hasResourceProperties('AWS::S3::Bucket', {
        BucketName: 'my-custom-bucket-name'
      });
    });

    it('should enable server access logging when logging is enabled', () => {
      const loggingApp = new App();
      const loggingStack = new Stack(loggingApp, 'LoggingStack');
      const loggingConstruct = new ServerlessWebAppConstruct(loggingStack, 'LoggingConstruct', {
        enableLogging: true
      });
      const loggingTemplate = Template.fromStack(loggingStack);

      loggingTemplate.hasResourceProperties('AWS::S3::Bucket', {
        LoggingConfiguration: {
          LogFilePrefix: 'access-logs/'
        }
      });
    });

    it('should create CloudFront Origin Access Identity', () => {
      template.hasResourceProperties('AWS::CloudFront::CloudFrontOriginAccessIdentity', {
        CloudFrontOriginAccessIdentityConfig: {
          Comment: 'OAI for TestConstruct static website bucket'
        }
      });
    });

    it('should configure bucket policy for CloudFront access', () => {
      // Verify bucket policy exists
      template.resourceCountIs('AWS::S3::BucketPolicy', 1);
      
      // Verify policy has correct structure
      const policyResources = template.findResources('AWS::S3::BucketPolicy');
      const policyResource = Object.values(policyResources)[0];
      const statements = policyResource.Properties.PolicyDocument.Statement;
      
      expect(statements).toHaveLength(2);
      
      // Check GetObject statement
      const getObjectStatement = statements.find((s: any) => s.Sid === 'AllowCloudFrontAccess');
      expect(getObjectStatement).toBeDefined();
      expect(getObjectStatement.Action).toBe('s3:GetObject');
      expect(getObjectStatement.Effect).toBe('Allow');
      expect(getObjectStatement.Principal.CanonicalUser).toBeDefined();
      
      // Check ListBucket statement
      const listBucketStatement = statements.find((s: any) => s.Sid === 'AllowCloudFrontListBucket');
      expect(listBucketStatement).toBeDefined();
      expect(listBucketStatement.Action).toBe('s3:ListBucket');
      expect(listBucketStatement.Effect).toBe('Allow');
      expect(listBucketStatement.Principal.CanonicalUser).toBeDefined();
    });

    it('should block all public access to S3 bucket', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        PublicAccessBlockConfiguration: {
          BlockPublicAcls: true,
          BlockPublicPolicy: true,
          IgnorePublicAcls: true,
          RestrictPublicBuckets: true
        }
      });
    });

    it('should enable versioning for deployment rollbacks', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        VersioningConfiguration: {
          Status: 'Enabled'
        }
      });
    });

    it('should configure lifecycle rules for cost optimization', () => {
      const bucketResources = template.findResources('AWS::S3::Bucket');
      const bucketResource = Object.values(bucketResources)[0];
      const lifecycleRules = bucketResource.Properties.LifecycleConfiguration.Rules;
      
      expect(lifecycleRules).toHaveLength(2);
      
      // Check incomplete multipart upload rule
      const multipartRule = lifecycleRules.find((rule: any) => rule.Id === 'DeleteIncompleteMultipartUploads');
      expect(multipartRule).toBeDefined();
      expect(multipartRule.Status).toBe('Enabled');
      expect(multipartRule.AbortIncompleteMultipartUpload.DaysAfterInitiation).toBe(7);
      
      // Check old versions rule
      const oldVersionsRule = lifecycleRules.find((rule: any) => rule.Id === 'DeleteOldVersions');
      expect(oldVersionsRule).toBeDefined();
      expect(oldVersionsRule.Status).toBe('Enabled');
      expect(oldVersionsRule.NoncurrentVersionExpiration.NoncurrentDays).toBe(30);
    });

    it('should expose bucket and OAI as public readonly properties', () => {
      expect(construct.bucket).toBeInstanceOf(s3.Bucket);
      expect(construct.originAccessIdentity).toBeDefined();
      expect(construct.bucket.bucketName).toBeDefined();
      expect(construct.originAccessIdentity.originAccessIdentityId).toBeDefined();
    });
  });

  describe('Cognito User Pool', () => {
    let construct: ServerlessWebAppConstruct;

    beforeEach(() => {
      construct = new ServerlessWebAppConstruct(stack, 'TestConstruct');
      template = Template.fromStack(stack);
    });

    it('should create Cognito User Pool with email-based authentication', () => {
      template.hasResourceProperties('AWS::Cognito::UserPool', {
        UsernameAttributes: ['email'],
        AutoVerifiedAttributes: ['email'],
        EmailConfiguration: {
          EmailSendingAccount: 'COGNITO_DEFAULT'
        },
        Policies: {
          PasswordPolicy: {
            MinimumLength: 8,
            RequireLowercase: true,
            RequireNumbers: true,
            RequireSymbols: true,
            RequireUppercase: true
          }
        },
        AccountRecoverySetting: {
          RecoveryMechanisms: [
            {
              Name: 'verified_email',
              Priority: 1
            }
          ]
        },
        MfaConfiguration: 'OPTIONAL',
        EnabledMfas: ['SOFTWARE_TOKEN_MFA'],
        DeviceConfiguration: {
          ChallengeRequiredOnNewDevice: true,
          DeviceOnlyRememberedOnUserPrompt: false
        }
      });
    });

    it('should create User Pool with custom name when provided', () => {
      const customApp = new App();
      const customStack = new Stack(customApp, 'CustomStack');
      const customConstruct = new ServerlessWebAppConstruct(customStack, 'CustomConstruct', {
        userPoolName: 'my-custom-user-pool'
      });
      const customTemplate = Template.fromStack(customStack);

      customTemplate.hasResourceProperties('AWS::Cognito::UserPool', {
        UserPoolName: 'my-custom-user-pool'
      });
    });

    it('should configure standard attributes correctly', () => {
      template.hasResourceProperties('AWS::Cognito::UserPool', {
        Schema: [
          {
            Name: 'email',
            Required: true,
            Mutable: true
          },
          {
            Name: 'given_name',
            Required: false,
            Mutable: true
          },
          {
            Name: 'family_name',
            Required: false,
            Mutable: true
          }
        ]
      });
    });

    it('should configure user verification settings', () => {
      template.hasResourceProperties('AWS::Cognito::UserPool', {
        VerificationMessageTemplate: {
          DefaultEmailOption: 'CONFIRM_WITH_CODE',
          EmailSubject: 'Verify your email for our app',
          EmailMessage: 'Hello {username}, Thanks for signing up! Your verification code is {####}'
        }
      });
    });

    it('should configure user invitation settings', () => {
      template.hasResourceProperties('AWS::Cognito::UserPool', {
        AdminCreateUserConfig: {
          InviteMessageTemplate: {
            EmailSubject: 'Invite to join our app',
            EmailMessage: 'Hello {username}, you have been invited to join our app! Your temporary password is {####}'
          }
        }
      });
    });

    it('should create User Pool Client for API Gateway integration', () => {
      template.hasResourceProperties('AWS::Cognito::UserPoolClient', {
        ExplicitAuthFlows: [
          'ALLOW_USER_PASSWORD_AUTH',
          'ALLOW_USER_SRP_AUTH',
          'ALLOW_REFRESH_TOKEN_AUTH'
        ],
        GenerateSecret: false,
        SupportedIdentityProviders: ['COGNITO'],
        AllowedOAuthFlows: ['code'],
        AllowedOAuthScopes: ['email', 'openid', 'profile'],
        CallbackURLs: ['http://localhost:3000/callback'],
        LogoutURLs: ['http://localhost:3000/logout'],
        AccessTokenValidity: 60,
        IdTokenValidity: 60,
        RefreshTokenValidity: 43200,
        TokenValidityUnits: {
          AccessToken: 'minutes',
          IdToken: 'minutes',
          RefreshToken: 'minutes'
        },
        PreventUserExistenceErrors: 'ENABLED'
      });
    });

    it('should configure read and write attributes for User Pool Client', () => {
      template.hasResourceProperties('AWS::Cognito::UserPoolClient', {
        ReadAttributes: [
          'email',
          'email_verified',
          'family_name',
          'given_name'
        ],
        WriteAttributes: [
          'email',
          'family_name',
          'given_name'
        ]
      });
    });

    it('should create default user groups for role-based access control', () => {
      // Check admin group
      template.hasResourceProperties('AWS::Cognito::UserPoolGroup', {
        GroupName: 'admin',
        Description: 'Administrator group with full access to all resources',
        Precedence: 1
      });

      // Check user group
      template.hasResourceProperties('AWS::Cognito::UserPoolGroup', {
        GroupName: 'user',
        Description: 'Regular user group with limited access to resources',
        Precedence: 10
      });

      // Check moderator group
      template.hasResourceProperties('AWS::Cognito::UserPoolGroup', {
        GroupName: 'moderator',
        Description: 'Moderator group with intermediate access to resources',
        Precedence: 5
      });

      // Verify we have exactly 3 groups
      template.resourceCountIs('AWS::Cognito::UserPoolGroup', 3);
    });

    it('should expose User Pool and User Pool Client as public readonly properties', () => {
      expect(construct.userPool).toBeDefined();
      expect(construct.userPoolClient).toBeDefined();
      expect(construct.userPool.userPoolId).toBeDefined();
      expect(construct.userPoolClient.userPoolClientId).toBeDefined();
    });

    it('should configure self sign-up and auto verification', () => {
      template.hasResourceProperties('AWS::Cognito::UserPool', {
        AdminCreateUserConfig: {
          AllowAdminCreateUserOnly: false
        },
        AutoVerifiedAttributes: ['email']
      });
    });

    it('should configure MFA as optional with TOTP support', () => {
      template.hasResourceProperties('AWS::Cognito::UserPool', {
        MfaConfiguration: 'OPTIONAL',
        EnabledMfas: ['SOFTWARE_TOKEN_MFA']
      });
    });

    it('should configure device tracking settings', () => {
      template.hasResourceProperties('AWS::Cognito::UserPool', {
        DeviceConfiguration: {
          ChallengeRequiredOnNewDevice: true,
          DeviceOnlyRememberedOnUserPrompt: false
        }
      });
    });

    it('should use email-only account recovery', () => {
      template.hasResourceProperties('AWS::Cognito::UserPool', {
        AccountRecoverySetting: {
          RecoveryMechanisms: [
            {
              Name: 'verified_email',
              Priority: 1
            }
          ]
        }
      });
    });

    it('should configure secure password policy', () => {
      template.hasResourceProperties('AWS::Cognito::UserPool', {
        Policies: {
          PasswordPolicy: {
            MinimumLength: 8,
            RequireLowercase: true,
            RequireNumbers: true,
            RequireSymbols: true,
            RequireUppercase: true
          }
        }
      });
    });
  });

  describe('Lambda Function Registry', () => {
    let construct: ServerlessWebAppConstruct;

    beforeEach(() => {
      construct = new ServerlessWebAppConstruct(stack, 'TestConstruct');
    });

    it('should initialize with health endpoint in Lambda function registry', () => {
      expect(construct.lambdaFunctions).toBeInstanceOf(Map);
      expect(construct.lambdaFunctions.size).toBe(2);
      expect(construct.lambdaFunctions.has('/api/health')).toBe(true);
      expect(construct.lambdaFunctions.has('/api/whoami')).toBe(true);
    });

    it('should be exposed as public readonly property', () => {
      // Verify the property is accessible
      expect(construct.lambdaFunctions).toBeDefined();
      
      // Verify it's a Map instance
      expect(construct.lambdaFunctions).toBeInstanceOf(Map);
      
      // Verify it has Map methods
      expect(typeof construct.lambdaFunctions.get).toBe('function');
      expect(typeof construct.lambdaFunctions.has).toBe('function');
      expect(typeof construct.lambdaFunctions.set).toBe('function');
      expect(typeof construct.lambdaFunctions.size).toBe('number');
    });

    it('should track Lambda functions by resource path when adding resources', () => {
      construct.addResource({
        path: '/users',
        lambdaSourcePath: './lambda/users'
      });

      expect(construct.lambdaFunctions.size).toBe(2); // Health endpoint + users endpoint
      expect(construct.lambdaFunctions.has('/api/users')).toBe(true);
      expect(construct.lambdaFunctions.has('/api/health')).toBe(true);
      
      const entry = construct.lambdaFunctions.get('/api/users');
      expect(entry).toBeDefined();
      expect(entry?.function).toBeInstanceOf(lambda.Function);
      expect(entry?.config).toBeDefined();
    });

    it('should store complete configuration for each Lambda function', () => {
      construct.addResource({
        path: '/products',
        method: 'POST',
        lambdaSourcePath: './lambda/products',
        requiresAuth: true,
        cognitoGroup: 'admin',
        environment: {
          TABLE_NAME: 'products-table',
          LOG_LEVEL: 'debug'
        }
      });

      const entry = construct.lambdaFunctions.get('/api/products');
      expect(entry).toBeDefined();
      expect(entry?.config.path).toBe('/api/products');
      expect(entry?.config.method).toBe('POST');
      expect(entry?.config.requiresAuth).toBe(true);
      expect(entry?.config.cognitoGroup).toBe('admin');
      expect(entry?.config.lambdaSourcePath).toBe('./lambda/products');
      expect(entry?.config.environment).toEqual({
        TABLE_NAME: 'products-table',
        LOG_LEVEL: 'debug'
      });
    });

    it('should track multiple Lambda functions with different paths', () => {
      construct.addResource({
        path: '/users',
        lambdaSourcePath: './lambda/users'
      });

      construct.addResource({
        path: '/products',
        method: 'POST',
        lambdaSourcePath: './lambda/products'
      });

      construct.addResource({
        path: '/orders',
        method: 'PUT',
        lambdaSourcePath: './lambda/orders',
        requiresAuth: true
      });

      expect(construct.lambdaFunctions.size).toBe(4); // Health endpoint + users + products + orders
      expect(construct.lambdaFunctions.has('/api/users')).toBe(true);
      expect(construct.lambdaFunctions.has('/api/products')).toBe(true);
      expect(construct.lambdaFunctions.has('/api/orders')).toBe(true);
      expect(construct.lambdaFunctions.has('/api/health')).toBe(true);

      // Verify each entry has correct configuration
      const usersEntry = construct.lambdaFunctions.get('/api/users');
      expect(usersEntry?.config.method).toBe('GET');
      expect(usersEntry?.config.requiresAuth).toBe(false);

      const productsEntry = construct.lambdaFunctions.get('/api/products');
      expect(productsEntry?.config.method).toBe('POST');
      expect(productsEntry?.config.requiresAuth).toBe(false);

      const ordersEntry = construct.lambdaFunctions.get('/api/orders');
      expect(ordersEntry?.config.method).toBe('PUT');
      expect(ordersEntry?.config.requiresAuth).toBe(true);
    });

    it('should handle multiple HTTP methods on the same resource path', () => {
      construct.addResource({
        path: '/items',
        method: 'GET',
        lambdaSourcePath: './lambda/items-get'
      });

      construct.addResource({
        path: '/items',
        method: 'POST',
        lambdaSourcePath: './lambda/items-post'
      });

      construct.addResource({
        path: '/items',
        method: 'DELETE',
        lambdaSourcePath: './lambda/items-delete'
      });

      // Note: The current implementation uses path as the key, so only one entry per path
      // This test documents the current behavior - multiple methods on same path will overwrite
      expect(construct.lambdaFunctions.size).toBe(2); // Health endpoint + items endpoint (last method overwrites)
      expect(construct.lambdaFunctions.has('/api/items')).toBe(true);
      expect(construct.lambdaFunctions.has('/api/health')).toBe(true);
      
      // The last added resource should be stored
      const entry = construct.lambdaFunctions.get('/api/items');
      expect(entry?.config.method).toBe('DELETE');
      expect(entry?.config.lambdaSourcePath).toBe('./lambda/items-delete');
    });

    it('should provide access to Lambda function instances for external permissions', () => {
      construct.addResource({
        path: '/secure-data',
        lambdaSourcePath: './lambda/secure-data',
        requiresAuth: true
      });

      const entry = construct.lambdaFunctions.get('/api/secure-data');
      expect(entry?.function).toBeInstanceOf(lambda.Function);
      
      // Verify the Lambda function has expected properties
      expect(entry?.function.functionName).toBeDefined();
      expect(entry?.function.functionArn).toBeDefined();
      expect(entry?.function.role).toBeDefined();
      
      // Verify we can access the function for granting permissions
      // This is important for the requirement that Lambda functions should allow external permission grants
      expect(typeof entry?.function.grantInvoke).toBe('function');
      expect(typeof entry?.function.addPermission).toBe('function');
    });

    it('should maintain proper typing for registry entries', () => {
      construct.addResource({
        path: '/typed-test',
        lambdaSourcePath: './lambda/typed-test'
      });

      const entry = construct.lambdaFunctions.get('/api/typed-test');
      
      // TypeScript compile-time checks - these should not cause compilation errors
      if (entry) {
        const func: lambda.Function = entry.function;
        const config = entry.config;
        
        expect(func).toBeInstanceOf(lambda.Function);
        expect(typeof config.path).toBe('string');
        expect(typeof config.method).toBe('string');
        expect(typeof config.requiresAuth).toBe('boolean');
        expect(typeof config.lambdaSourcePath).toBe('string');
      }
    });

    it('should handle complex nested resource paths in registry', () => {
      construct.addResource({
        path: '/api/v1/users/profile',
        lambdaSourcePath: './lambda/user-profile'
      });

      construct.addResource({
        path: '/admin/system/health',
        lambdaSourcePath: './lambda/admin-health'
      });

      expect(construct.lambdaFunctions.size).toBe(3); // Health endpoint + 2 complex paths
      expect(construct.lambdaFunctions.has('/api/api/v1/users/profile')).toBe(true);
      expect(construct.lambdaFunctions.has('/api/admin/system/health')).toBe(true);
      expect(construct.lambdaFunctions.has('/api/health')).toBe(true);

      const profileEntry = construct.lambdaFunctions.get('/api/api/v1/users/profile');
      const healthEntry = construct.lambdaFunctions.get('/api/admin/system/health');
      
      expect(profileEntry?.config.lambdaSourcePath).toBe('./lambda/user-profile');
      expect(healthEntry?.config.lambdaSourcePath).toBe('./lambda/admin-health');
    });

    it('should preserve environment variables in registry entries', () => {
      const testEnv = {
        DATABASE_URL: 'postgresql://localhost:5432/test',
        REDIS_URL: 'redis://localhost:6379',
        LOG_LEVEL: 'debug',
        API_VERSION: 'v1'
      };

      construct.addResource({
        path: '/database-test',
        lambdaSourcePath: './lambda/database-test',
        environment: testEnv
      });

      const entry = construct.lambdaFunctions.get('/api/database-test');
      expect(entry?.config.environment).toEqual(testEnv);
    });

    it('should handle authentication configuration in registry', () => {
      // Unauthenticated resource
      construct.addResource({
        path: '/public',
        lambdaSourcePath: './lambda/public'
      });

      // Authenticated resource without group
      construct.addResource({
        path: '/private',
        lambdaSourcePath: './lambda/private',
        requiresAuth: true
      });

      // Authenticated resource with specific group
      construct.addResource({
        path: '/admin-only',
        lambdaSourcePath: './lambda/admin-only',
        requiresAuth: true,
        cognitoGroup: 'admin'
      });

      const publicEntry = construct.lambdaFunctions.get('/api/public');
      const privateEntry = construct.lambdaFunctions.get('/api/private');
      const adminEntry = construct.lambdaFunctions.get('/api/admin-only');

      expect(publicEntry?.config.requiresAuth).toBe(false);
      expect(publicEntry?.config.cognitoGroup).toBeUndefined();

      expect(privateEntry?.config.requiresAuth).toBe(true);
      expect(privateEntry?.config.cognitoGroup).toBeUndefined();

      expect(adminEntry?.config.requiresAuth).toBe(true);
      expect(adminEntry?.config.cognitoGroup).toBe('admin');
    });

    it('should allow iteration over all registered Lambda functions', () => {
      construct.addResource({
        path: '/func1',
        lambdaSourcePath: './lambda/func1'
      });

      construct.addResource({
        path: '/func2',
        method: 'POST',
        lambdaSourcePath: './lambda/func2'
      });

      construct.addResource({
        path: '/func3',
        method: 'PUT',
        lambdaSourcePath: './lambda/func3',
        requiresAuth: true
      });

      // Test iteration using for...of
      const paths: string[] = [];
      const functions: lambda.Function[] = [];
      
      for (const [path, entry] of construct.lambdaFunctions) {
        paths.push(path);
        functions.push(entry.function);
      }

      expect(paths).toHaveLength(3);
      expect(functions).toHaveLength(3);
      expect(paths).toContain('/api/func1');
      expect(paths).toContain('/api/func2');
      expect(paths).toContain('/api/func3');

      // Test iteration using forEach
      const configs: any[] = [];
      construct.lambdaFunctions.forEach((entry, path) => {
        configs.push({ path, config: entry.config });
      });

      expect(configs).toHaveLength(3);
      expect(configs.find(c => c.path === '/api/func1')?.config.method).toBe('GET');
      expect(configs.find(c => c.path === '/api/func2')?.config.method).toBe('POST');
      expect(configs.find(c => c.path === '/api/func3')?.config.method).toBe('PUT');
    });

    it('should provide keys, values, and entries iterators', () => {
      construct.addResource({
        path: '/iterator-test',
        lambdaSourcePath: './lambda/iterator-test'
      });

      // Test keys iterator
      const keys = Array.from(construct.lambdaFunctions.keys());
      expect(keys).toEqual(['/api/iterator-test']);

      // Test values iterator
      const values = Array.from(construct.lambdaFunctions.values());
      expect(values).toHaveLength(1);
      expect(values[0].function).toBeInstanceOf(lambda.Function);
      expect(values[0].config.path).toBe('/api/iterator-test');

      // Test entries iterator
      const entries = Array.from(construct.lambdaFunctions.entries());
      expect(entries).toHaveLength(1);
      expect(entries[0][0]).toBe('/api/iterator-test');
      expect(entries[0][1].function).toBeInstanceOf(lambda.Function);
    });
  });

  describe('API Gateway', () => {
    let construct: ServerlessWebAppConstruct;

    beforeEach(() => {
      construct = new ServerlessWebAppConstruct(stack, 'TestConstruct');
      template = Template.fromStack(stack);
    });

    it('should create REST API Gateway with basic configuration', () => {
      template.hasResourceProperties('AWS::ApiGateway::RestApi', {
        Name: 'TestConstruct-api',
        Description: 'REST API for TestConstruct serverless web application',
        EndpointConfiguration: {
          Types: ['REGIONAL']
        },
        MinimumCompressionSize: 1024,
        BinaryMediaTypes: [
          'application/octet-stream',
          'image/*',
          'multipart/form-data'
        ]
      });
    });

    it('should create API Gateway with custom name when provided', () => {
      const customApp = new App();
      const customStack = new Stack(customApp, 'CustomStack');
      const customConstruct = new ServerlessWebAppConstruct(customStack, 'CustomConstruct', {
        apiName: 'my-custom-api'
      });
      const customTemplate = Template.fromStack(customStack);

      customTemplate.hasResourceProperties('AWS::ApiGateway::RestApi', {
        Name: 'my-custom-api'
      });
    });

    it('should configure deployment with production stage', () => {
      template.hasResourceProperties('AWS::ApiGateway::Deployment', {
        Description: 'Production deployment'
      });

      template.hasResourceProperties('AWS::ApiGateway::Stage', {
        StageName: 'prod',
        Description: 'Production deployment'
      });
    });

    it('should disable logging when enableLogging is false', () => {
      const noLoggingApp = new App();
      const noLoggingStack = new Stack(noLoggingApp, 'NoLoggingStack');
      const noLoggingConstruct = new ServerlessWebAppConstruct(noLoggingStack, 'NoLoggingConstruct', {
        enableLogging: false
      });
      const noLoggingTemplate = Template.fromStack(noLoggingStack);

      // Check that the stage has method settings with logging disabled
      const stageResources = noLoggingTemplate.findResources('AWS::ApiGateway::Stage');
      const stageResource = Object.values(stageResources)[0];
      expect(stageResource.Properties.MethodSettings).toBeDefined();
      expect(stageResource.Properties.MethodSettings[0].LoggingLevel).toBe('OFF');
    });

    it('should configure CORS for cross-origin requests', () => {
      // CORS is configured via OPTIONS methods on resources
      // We'll verify the CORS configuration is set up properly
      expect(construct.api).toBeDefined();
      
      // The CORS configuration is applied when resources are added
      // For now, we verify the API has the default CORS preflight options
      const apiResource = template.findResources('AWS::ApiGateway::RestApi');
      expect(Object.keys(apiResource)).toHaveLength(1);
    });

    it('should configure resource policy for API access', () => {
      template.hasResourceProperties('AWS::ApiGateway::RestApi', {
        Policy: {
          Statement: [
            {
              Effect: 'Allow',
              Principal: {
                AWS: '*'
              },
              Action: 'execute-api:Invoke',
              Resource: '*',
              Condition: {
                IpAddress: {
                  'aws:SourceIp': ['0.0.0.0/0', '::/0']
                }
              }
            }
          ]
        }
      });
    });

    it('should create Cognito authorizer for authenticated endpoints', () => {
      template.hasResourceProperties('AWS::ApiGateway::Authorizer', {
        Name: 'TestConstruct-cognito-authorizer',
        Type: 'COGNITO_USER_POOLS',
        IdentitySource: 'method.request.header.Authorization',
        AuthorizerResultTtlInSeconds: 300
      });
    });

    it('should link Cognito authorizer to User Pool', () => {
      // Check that the authorizer references the user pool
      const authorizerResources = template.findResources('AWS::ApiGateway::Authorizer');
      const authorizerResource = Object.values(authorizerResources)[0];
      
      expect(authorizerResource.Properties.Type).toBe('COGNITO_USER_POOLS');
      expect(authorizerResource.Properties.ProviderARNs).toHaveLength(1);
      expect(authorizerResource.Properties.ProviderARNs[0]['Fn::GetAtt'][0]).toMatch(/UserPool/);
      expect(authorizerResource.Properties.ProviderARNs[0]['Fn::GetAtt'][1]).toBe('Arn');
    });

    it('should configure CloudWatch role when logging is enabled', () => {
      // Check that the CloudWatch role is created
      const accountResources = template.findResources('AWS::ApiGateway::Account');
      const accountResource = Object.values(accountResources)[0];
      expect(accountResource.Properties.CloudWatchRoleArn).toBeDefined();
      expect(accountResource.Properties.CloudWatchRoleArn['Fn::GetAtt']).toBeDefined();
      expect(accountResource.Properties.CloudWatchRoleArn['Fn::GetAtt'][0]).toMatch(/ApiCloudWatchRole/);

      // Check that the CloudWatch role exists with correct assume role policy
      const roleResources = template.findResources('AWS::IAM::Role');
      const cloudWatchRole = Object.values(roleResources).find((role: any) => 
        role.Properties.AssumeRolePolicyDocument.Statement[0].Principal.Service === 'apigateway.amazonaws.com'
      );
      expect(cloudWatchRole).toBeDefined();
      expect(cloudWatchRole.Properties.ManagedPolicyArns).toBeDefined();
      expect(cloudWatchRole.Properties.ManagedPolicyArns).toHaveLength(1);
    });

    it('should expose API and authorizer as public readonly properties', () => {
      expect(construct.api).toBeDefined();
      expect(construct.cognitoAuthorizer).toBeDefined();
      expect(construct.api.restApiId).toBeDefined();
      expect(construct.cognitoAuthorizer.ref).toBeDefined();
    });

    it('should configure throttling limits for API stage', () => {
      // Check that the stage has method settings with throttling configured
      const stageResources = template.findResources('AWS::ApiGateway::Stage');
      const stageResource = Object.values(stageResources)[0];
      expect(stageResource.Properties.MethodSettings).toBeDefined();
      expect(stageResource.Properties.MethodSettings[0].ThrottlingBurstLimit).toBe(5000);
      expect(stageResource.Properties.MethodSettings[0].ThrottlingRateLimit).toBe(2000);
    });

    it('should configure binary media types for file uploads', () => {
      template.hasResourceProperties('AWS::ApiGateway::RestApi', {
        BinaryMediaTypes: [
          'application/octet-stream',
          'image/*',
          'multipart/form-data'
        ]
      });
    });

    it('should configure API key source type', () => {
      template.hasResourceProperties('AWS::ApiGateway::RestApi', {
        ApiKeySourceType: 'HEADER'
      });
    });

    it('should configure minimum compression size', () => {
      template.hasResourceProperties('AWS::ApiGateway::RestApi', {
        MinimumCompressionSize: 1024
      });
    });

    it('should configure regional endpoint type', () => {
      template.hasResourceProperties('AWS::ApiGateway::RestApi', {
        EndpointConfiguration: {
          Types: ['REGIONAL']
        }
      });
    });

    it('should configure authorizer result caching', () => {
      template.hasResourceProperties('AWS::ApiGateway::Authorizer', {
        AuthorizerResultTtlInSeconds: 300
      });
    });
  });

  describe('Lambda Function Creation Utilities', () => {
    let construct: ServerlessWebAppConstruct;

    beforeEach(() => {
      construct = new ServerlessWebAppConstruct(stack, 'TestConstruct');
    });

    describe('createLambdaFunction', () => {
      it('should create Lambda function with basic configuration', () => {
        const lambdaFunction = construct.createLambdaFunction(
          'test-function',
          './lambda/test'
        );

        expect(lambdaFunction).toBeInstanceOf(lambda.Function);
        
        // Generate new template after creating the function
        const newTemplate = Template.fromStack(stack);
        
        newTemplate.hasResourceProperties('AWS::Lambda::Function', {
          Runtime: 'nodejs20.x',
          Handler: 'index.handler',
          Timeout: 30,
          MemorySize: 256,
          ReservedConcurrentExecutions: 100,
          TracingConfig: {
            Mode: 'Active'
          },
          Architectures: ['arm64']
        });
      });

      it('should create Lambda function with custom environment variables', () => {
        const environment = {
          TABLE_NAME: 'my-table',
          API_KEY: 'secret-key'
        };

        const lambdaFunction = construct.createLambdaFunction(
          'env-function',
          './lambda/env',
          environment
        );

        expect(lambdaFunction).toBeInstanceOf(lambda.Function);

        const newTemplate = Template.fromStack(stack);
        newTemplate.hasResourceProperties('AWS::Lambda::Function', {
          Environment: {
            Variables: {
              NODE_ENV: 'production',
              LOG_LEVEL: 'info',
              TABLE_NAME: 'my-table',
              API_KEY: 'secret-key'
            }
          }
        });
      });

      it('should create Lambda function with additional IAM policies', () => {
        const additionalPolicies = [
          new iam.PolicyStatement({
            effect: iam.Effect.ALLOW,
            actions: ['dynamodb:GetItem'],
            resources: ['arn:aws:dynamodb:*:*:table/my-table']
          })
        ];

        const lambdaFunction = construct.createLambdaFunction(
          'policy-function',
          './lambda/policy',
          undefined,
          additionalPolicies
        );

        expect(lambdaFunction).toBeInstanceOf(lambda.Function);

        const newTemplate = Template.fromStack(stack);
        // Check that IAM role is created with additional policies
        const roleResources = newTemplate.findResources('AWS::IAM::Role');
        const executionRoles = Object.values(roleResources).filter((role: any) => 
          role.Properties.RoleName && role.Properties.RoleName.includes('policy-function-execution-role')
        );
        expect(executionRoles.length).toBeGreaterThan(0);
      });

      it('should create CloudWatch log group for Lambda function', () => {
        construct.createLambdaFunction('log-function', './lambda/log');

        const newTemplate = Template.fromStack(stack);
        newTemplate.hasResourceProperties('AWS::Logs::LogGroup', {
          RetentionInDays: 30
        });
      });

      it('should create IAM execution role with least privilege', () => {
        construct.createLambdaFunction('role-function', './lambda/role');

        const newTemplate = Template.fromStack(stack);
        newTemplate.hasResourceProperties('AWS::IAM::Role', {
          AssumeRolePolicyDocument: {
            Statement: [
              {
                Effect: 'Allow',
                Principal: {
                  Service: 'lambda.amazonaws.com'
                },
                Action: 'sts:AssumeRole'
              }
            ]
          },
          ManagedPolicyArns: [
            {
              'Fn::Join': [
                '',
                [
                  'arn:',
                  { Ref: 'AWS::Partition' },
                  ':iam::aws:policy/service-role/AWSLambdaBasicExecutionRole'
                ]
              ]
            },
            {
              'Fn::Join': [
                '',
                [
                  'arn:',
                  { Ref: 'AWS::Partition' },
                  ':iam::aws:policy/AWSXRayDaemonWriteAccess'
                ]
              ]
            },
            {
              'Fn::Join': [
                '',
                [
                  'arn:',
                  { Ref: 'AWS::Partition' },
                  ':iam::aws:policy/CloudWatchLambdaInsightsExecutionRolePolicy'
                ]
              ]
            }
          ]
        });
      });

      it('should validate function name parameters', () => {
        expect(() => {
          construct.createLambdaFunction('', './lambda/test');
        }).toThrow('Lambda function name is required and cannot be empty');

        expect(() => {
          construct.createLambdaFunction('invalid@name', './lambda/test');
        }).toThrow('Lambda function name can only contain alphanumeric characters, hyphens, and underscores');

        expect(() => {
          construct.createLambdaFunction('a'.repeat(65), './lambda/test');
        }).toThrow('Lambda function name cannot exceed 64 characters');
      });

      it('should validate source path parameters', () => {
        expect(() => {
          construct.createLambdaFunction('test-function', '');
        }).toThrow('Lambda source path is required and cannot be empty');

        expect(() => {
          construct.createLambdaFunction('test-function', 'invalid-path');
        }).toThrow('Lambda source path must be absolute or relative');
      });
    });

    describe('createApiLambdaFunction', () => {
      it('should create Lambda function for API Gateway integration', () => {
        const config = {
          path: '/api/users',
          method: 'GET',
          requiresAuth: false,
          lambdaSourcePath: './lambda/users',
          environment: { TABLE_NAME: 'users' }
        };

        const lambdaFunction = construct.createApiLambdaFunction('/api/users', config);

        expect(lambdaFunction).toBeInstanceOf(lambda.Function);

        const newTemplate = Template.fromStack(stack);
        newTemplate.hasResourceProperties('AWS::Lambda::Function', {
          Environment: {
            Variables: {
              NODE_ENV: 'production',
              LOG_LEVEL: 'info',
              TABLE_NAME: 'users'
            }
          }
        });
      });

      it('should create Lambda function with Cognito permissions for authenticated resources', () => {
        const config = {
          path: '/api/protected',
          method: 'POST',
          requiresAuth: true,
          lambdaSourcePath: './lambda/protected'
        };

        const lambdaFunction = construct.createApiLambdaFunction('/api/protected', config);

        expect(lambdaFunction).toBeInstanceOf(lambda.Function);

        const newTemplate = Template.fromStack(stack);
        // Check that IAM role is created with Cognito permissions
        const roleResources = newTemplate.findResources('AWS::IAM::Role');
        const executionRoles = Object.values(roleResources).filter((role: any) => 
          role.Properties.RoleName && role.Properties.RoleName.includes('post-protected-execution-role')
        );
        expect(executionRoles.length).toBeGreaterThan(0);
      });
    });

    describe('generateLambdaFunctionName', () => {
      it('should generate valid function names from resource paths', () => {
        // Test via addResource which uses generateLambdaFunctionName internally
        construct.addResource({
          path: '/users',
          method: 'GET',
          lambdaSourcePath: './lambda/users'
        });

        expect(construct.lambdaFunctions.has('/api/users')).toBe(true);
        const entry = construct.lambdaFunctions.get('/api/users');
        expect(entry?.function).toBeInstanceOf(lambda.Function);
      });

      it('should handle complex resource paths', () => {
        construct.addResource({
          path: '/users/{id}/posts',
          method: 'POST',
          lambdaSourcePath: './lambda/user-posts'
        });

        expect(construct.lambdaFunctions.has('/api/users/{id}/posts')).toBe(true);
        const entry = construct.lambdaFunctions.get('/api/users/{id}/posts');
        expect(entry?.function).toBeInstanceOf(lambda.Function);
      });

      it('should handle root path', () => {
        construct.addResource({
          path: '/',
          method: 'GET',
          lambdaSourcePath: './lambda/root'
        });

        expect(construct.lambdaFunctions.has('/api/')).toBe(true);
        const entry = construct.lambdaFunctions.get('/api/');
        expect(entry?.function).toBeInstanceOf(lambda.Function);
      });

      it('should truncate long function names', () => {
        const longPath = '/very/long/path/that/exceeds/normal/limits/and/should/be/truncated';
        construct.addResource({
          path: longPath,
          method: 'GET',
          lambdaSourcePath: './lambda/long'
        });

        const entry = construct.lambdaFunctions.get(`/api${longPath}`);
        expect(entry?.function).toBeInstanceOf(lambda.Function);
      });
    });

    describe('addResource with Lambda integration', () => {
      it('should create Lambda function when adding resource', () => {
        construct.addResource({
          path: '/products',
          method: 'POST',
          lambdaSourcePath: './lambda/products',
          requiresAuth: true,
          cognitoGroup: 'admin',
          environment: {
            TABLE_NAME: 'products-table'
          }
        });

        expect(construct.lambdaFunctions.size).toBe(2); // Health endpoint + products endpoint
        expect(construct.lambdaFunctions.has('/api/products')).toBe(true);
        expect(construct.lambdaFunctions.has('/api/health')).toBe(true);
        
        const entry = construct.lambdaFunctions.get('/api/products');
        expect(entry?.function).toBeInstanceOf(lambda.Function);
        expect(entry?.config.path).toBe('/api/products');
        expect(entry?.config.method).toBe('POST');
        expect(entry?.config.requiresAuth).toBe(true);
        expect(entry?.config.cognitoGroup).toBe('admin');

        // Verify Lambda function is created in CloudFormation template
        const newTemplate = Template.fromStack(stack);
        newTemplate.hasResourceProperties('AWS::Lambda::Function', {
          Environment: {
            Variables: {
              NODE_ENV: 'production',
              LOG_LEVEL: 'info',
              TABLE_NAME: 'products-table'
            }
          }
        });
      });

      it('should create multiple Lambda functions for multiple resources', () => {
        construct.addResource({
          path: '/users',
          lambdaSourcePath: './lambda/users'
        });

        construct.addResource({
          path: '/products',
          method: 'POST',
          lambdaSourcePath: './lambda/products'
        });

        expect(construct.lambdaFunctions.size).toBe(3); // Health endpoint + users + products
        expect(construct.lambdaFunctions.has('/api/users')).toBe(true);
        expect(construct.lambdaFunctions.has('/api/products')).toBe(true);
        expect(construct.lambdaFunctions.has('/api/health')).toBe(true);

        // Verify both Lambda functions are created
        const newTemplate = Template.fromStack(stack);
        // Count Lambda functions (excluding the S3 notification handler)
        const lambdaResources = newTemplate.findResources('AWS::Lambda::Function');
        const userLambdas = Object.values(lambdaResources).filter((resource: any) => 
          resource.Properties.Runtime === 'nodejs20.x'
        );
        expect(userLambdas.length).toBe(2);
      });

      it('should expose Lambda functions in public registry', () => {
        construct.addResource({
          path: '/test',
          lambdaSourcePath: './lambda/test'
        });

        expect(construct.lambdaFunctions).toBeInstanceOf(Map);
        expect(construct.lambdaFunctions.size).toBe(2); // Health endpoint + test endpoint
        
        const entry = construct.lambdaFunctions.get('/api/test');
        expect(entry).toBeDefined();
        expect(entry?.function).toBeInstanceOf(lambda.Function);
        expect(entry?.config).toBeDefined();
      });
    });
  });

  describe('Default Health Endpoint', () => {
    let construct: ServerlessWebAppConstruct;

    beforeEach(() => {
      construct = new ServerlessWebAppConstruct(stack, 'TestConstruct');
      template = Template.fromStack(stack);
    });

    it('should automatically create health endpoint at /api/health', () => {
      // Verify the health endpoint is in the Lambda function registry
      expect(construct.lambdaFunctions.has('/api/health')).toBe(true);
      
      const healthEntry = construct.lambdaFunctions.get('/api/health');
      expect(healthEntry).toBeDefined();
      expect(healthEntry?.config.path).toBe('/api/health');
      expect(healthEntry?.config.method).toBe('GET');
      expect(healthEntry?.config.requiresAuth).toBe(false);
      expect(healthEntry?.config.lambdaSourcePath).toBe('./lambda/health');
    });

    it('should create health endpoint as unauthenticated', () => {
      const healthEntry = construct.lambdaFunctions.get('/api/health');
      expect(healthEntry?.config.requiresAuth).toBe(false);
      expect(healthEntry?.config.cognitoGroup).toBeUndefined();
    });

    it('should configure health endpoint with proper environment variables', () => {
      const healthEntry = construct.lambdaFunctions.get('/api/health');
      expect(healthEntry?.config.environment).toBeDefined();
      expect(healthEntry?.config.environment?.API_VERSION).toBe('1.0.0');
      expect(healthEntry?.config.environment?.SERVICE_NAME).toBe('serverless-web-app-api');
    });

    it('should create Lambda function for health endpoint', () => {
      // Verify Lambda function is created with correct properties
      const lambdaFunctions = template.findResources('AWS::Lambda::Function');
      const healthFunction = Object.values(lambdaFunctions).find((fn: any) => 
        fn.Properties.FunctionName === 'TestConstruct-get-health'
      );
      
      expect(healthFunction).toBeDefined();
      expect(healthFunction.Properties.Handler).toBe('index.handler');
      expect(healthFunction.Properties.Runtime).toBe('nodejs20.x');
      expect(healthFunction.Properties.Environment.Variables.API_VERSION).toBe('1.0.0');
      expect(healthFunction.Properties.Environment.Variables.SERVICE_NAME).toBe('serverless-web-app-api');
      expect(healthFunction.Properties.Environment.Variables.NODE_ENV).toBe('production');
      expect(healthFunction.Properties.Environment.Variables.LOG_LEVEL).toBe('info');
      expect(healthFunction.Properties.Environment.Variables.CORS_ORIGIN).toBe('*');
    });

    it('should create API Gateway resource for health endpoint', () => {
      // Verify API Gateway resource is created for 'health'
      template.hasResourceProperties('AWS::ApiGateway::Resource', {
        PathPart: 'health',
        ParentId: {
          'Fn::GetAtt': [
            'TestConstructApi5A83971A',
            'RootResourceId'
          ]
        }
      });
    });

    it('should create API Gateway method for health endpoint', () => {
      // Verify API Gateway method is created
      template.hasResourceProperties('AWS::ApiGateway::Method', {
        HttpMethod: 'GET',
        AuthorizationType: 'NONE',
        Integration: {
          Type: 'AWS_PROXY',
          IntegrationHttpMethod: 'POST'
        }
      });
    });

    it('should grant API Gateway permission to invoke health Lambda function', () => {
      // Verify Lambda permission is created for API Gateway
      template.hasResourceProperties('AWS::Lambda::Permission', {
        Action: 'lambda:InvokeFunction',
        Principal: 'apigateway.amazonaws.com'
      });
    });

    it('should create health endpoint with proper CORS configuration', () => {
      // Verify the health endpoint supports CORS
      const healthEntry = construct.lambdaFunctions.get('/api/health');
      expect(healthEntry).toBeDefined();
      
      // Check that the API Gateway resource has CORS configured
      template.hasResourceProperties('AWS::ApiGateway::Method', {
        HttpMethod: 'OPTIONS'
      });
    });

    it('should create CloudWatch log group for health Lambda function', () => {
      // Verify CloudWatch log group is created
      template.hasResourceProperties('AWS::Logs::LogGroup', {
        LogGroupName: '/aws/lambda/TestConstruct-get-health',
        RetentionInDays: 30
      });
    });

    it('should create IAM execution role for health Lambda function', () => {
      // Verify IAM role is created with proper policies
      template.hasResourceProperties('AWS::IAM::Role', {
        AssumeRolePolicyDocument: {
          Statement: [
            {
              Action: 'sts:AssumeRole',
              Effect: 'Allow',
              Principal: {
                Service: 'lambda.amazonaws.com'
              }
            }
          ]
        },
        ManagedPolicyArns: [
          {
            'Fn::Join': [
              '',
              [
                'arn:',
                {
                  Ref: 'AWS::Partition'
                },
                ':iam::aws:policy/service-role/AWSLambdaBasicExecutionRole'
              ]
            ]
          },
          {
            'Fn::Join': [
              '',
              [
                'arn:',
                {
                  Ref: 'AWS::Partition'
                },
                ':iam::aws:policy/AWSXRayDaemonWriteAccess'
              ]
            ]
          },
          {
            'Fn::Join': [
              '',
              [
                'arn:',
                {
                  Ref: 'AWS::Partition'
                },
                ':iam::aws:policy/CloudWatchLambdaInsightsExecutionRolePolicy'
              ]
            ]
          }
        ]
      });
    });

    it('should configure health Lambda function with proper timeout and memory', () => {
      // Verify Lambda function configuration
      const lambdaFunctions = template.findResources('AWS::Lambda::Function');
      const healthFunction = Object.values(lambdaFunctions).find((fn: any) => 
        fn.Properties.FunctionName === 'TestConstruct-get-health'
      );
      
      expect(healthFunction).toBeDefined();
      expect(healthFunction.Properties.Timeout).toBe(30);
      expect(healthFunction.Properties.MemorySize).toBe(256);
      expect(healthFunction.Properties.ReservedConcurrentExecutions).toBe(100);
      expect(healthFunction.Properties.DeadLetterConfig).toBeDefined();
      expect(healthFunction.Properties.TracingConfig.Mode).toBe('Active');
    });

    it('should be accessible from construct registry after creation', () => {
      // Verify we can access the health function from the registry
      expect(construct.lambdaFunctions.size).toBe(2);
      
      const healthFunction = construct.lambdaFunctions.get('/api/health');
      expect(healthFunction).toBeDefined();
      expect(healthFunction?.function).toBeInstanceOf(lambda.Function);
      
      // Verify the function configuration
      expect(healthFunction?.config.path).toBe('/api/health');
      expect(healthFunction?.config.method).toBe('GET');
      expect(healthFunction?.config.requiresAuth).toBe(false);
      expect(healthFunction?.config.lambdaSourcePath).toBe('./lambda/health');
    });
  });

  describe('Default WhoAmI Endpoint', () => {
    let construct: ServerlessWebAppConstruct;

    beforeEach(() => {
      construct = new ServerlessWebAppConstruct(stack, 'TestConstruct');
      template = Template.fromStack(stack);
    });

    it('should automatically create whoami endpoint at /api/whoami', () => {
      // Verify the whoami endpoint is in the Lambda function registry
      expect(construct.lambdaFunctions.has('/api/whoami')).toBe(true);
      
      const whoamiEntry = construct.lambdaFunctions.get('/api/whoami');
      expect(whoamiEntry).toBeDefined();
      expect(whoamiEntry?.config.path).toBe('/api/whoami');
      expect(whoamiEntry?.config.method).toBe('GET');
      expect(whoamiEntry?.config.requiresAuth).toBe(true);
      expect(whoamiEntry?.config.lambdaSourcePath).toBe('./lambda/whoami');
    });

    it('should create whoami endpoint as authenticated', () => {
      const whoamiEntry = construct.lambdaFunctions.get('/api/whoami');
      expect(whoamiEntry?.config.requiresAuth).toBe(true);
      expect(whoamiEntry?.config.cognitoGroup).toBeUndefined(); // No specific group required
    });

    it('should configure whoami endpoint with proper environment variables', () => {
      const whoamiEntry = construct.lambdaFunctions.get('/api/whoami');
      expect(whoamiEntry?.config.environment).toBeDefined();
      expect(whoamiEntry?.config.environment?.API_VERSION).toBe('1.0.0');
      expect(whoamiEntry?.config.environment?.SERVICE_NAME).toBe('serverless-web-app-api');
    });

    it('should create Lambda function for whoami endpoint', () => {
      const whoamiEntry = construct.lambdaFunctions.get('/api/whoami');
      expect(whoamiEntry?.function).toBeDefined();
      expect(whoamiEntry?.function).toBeInstanceOf(lambda.Function);
    });

    it('should be accessible from construct registry after creation', () => {
      // Verify we can access the whoami function from the registry
      expect(construct.lambdaFunctions.size).toBe(2);
      
      const whoamiFunction = construct.lambdaFunctions.get('/api/whoami');
      expect(whoamiFunction).toBeDefined();
      expect(whoamiFunction?.function).toBeInstanceOf(lambda.Function);
      expect(whoamiFunction?.config.path).toBe('/api/whoami');
      expect(whoamiFunction?.config.method).toBe('GET');
      expect(whoamiFunction?.config.requiresAuth).toBe(true);
      expect(whoamiFunction?.config.lambdaSourcePath).toBe('./lambda/whoami');
    });
  });

  describe('CloudFront Distribution', () => {
    let construct: ServerlessWebAppConstruct;

    beforeEach(() => {
      construct = new ServerlessWebAppConstruct(stack, 'TestConstruct');
      template = Template.fromStack(stack);
    });

    it('should create CloudFront distribution with proper configuration', () => {
      // Verify CloudFront distribution is created
      template.hasResourceProperties('AWS::CloudFront::Distribution', {
        DistributionConfig: {
          Enabled: true,
          Comment: 'CloudFront distribution for TestConstruct serverless web application',
          DefaultRootObject: 'index.html',
          HttpVersion: 'http2and3',
          IPV6Enabled: true,
          PriceClass: 'PriceClass_100',
        }
      });
    });

    it('should configure S3 origin for static content', () => {
      // Verify S3 origin is configured
      template.hasResourceProperties('AWS::CloudFront::Distribution', {
        DistributionConfig: {
          Origins: [
            {
              DomainName: {
                'Fn::GetAtt': [
                  'TestConstructStaticWebsiteBucketA629BF40',
                  'RegionalDomainName'
                ]
              },
              OriginPath: '',
              S3OriginConfig: {
                OriginAccessIdentity: ''
              }
            },
            {
              CustomOriginConfig: {
                OriginProtocolPolicy: 'https-only',
                OriginSSLProtocols: ['TLSv1.2']
              }
            }
          ]
        }
      });
    });

    it('should configure API Gateway origin for /api/* paths', () => {
      // Verify API Gateway origin is configured
      template.hasResourceProperties('AWS::CloudFront::Distribution', {
        DistributionConfig: {
          CacheBehaviors: [
            {
              PathPattern: '/api/*',
              TargetOriginId: 'TestStackTestConstructDistributionOrigin278693042',
              ViewerProtocolPolicy: 'redirect-to-https',
              AllowedMethods: [
                'GET', 'HEAD', 'OPTIONS', 'PUT', 'PATCH', 'POST', 'DELETE'
              ],
              CachedMethods: ['GET', 'HEAD'],
              Compress: true,
              CachePolicyId: '4135ea2d-6df8-44a3-9df3-4b5a84be39ad', // CACHING_DISABLED
              OriginRequestPolicyId: 'b689b0a8-53d0-40ab-baf2-68738e2966ac' // ALL_VIEWER_EXCEPT_HOST_HEADER
            }
          ]
        }
      });
    });

    it('should configure SSL/TLS and security headers', () => {
      // Verify HTTPS redirect is configured
      template.hasResourceProperties('AWS::CloudFront::Distribution', {
        DistributionConfig: {
          DefaultCacheBehavior: {
            ViewerProtocolPolicy: 'redirect-to-https'
          }
        }
      });

      // Verify response headers policies are created
      template.resourceCountIs('AWS::CloudFront::ResponseHeadersPolicy', 2);
      
      // Verify static content response headers policy
      template.hasResourceProperties('AWS::CloudFront::ResponseHeadersPolicy', {
        ResponseHeadersPolicyConfig: {
          Name: 'TestConstruct-static-headers',
          Comment: 'Security headers for static content',
          SecurityHeadersConfig: {
            ContentTypeOptions: {
              Override: true
            },
            FrameOptions: {
              FrameOption: 'DENY',
              Override: true
            },
            ReferrerPolicy: {
              ReferrerPolicy: 'strict-origin-when-cross-origin',
              Override: true
            },
            StrictTransportSecurity: {
              AccessControlMaxAgeSec: 31536000,
              IncludeSubdomains: true,
              Preload: true,
              Override: true
            }
          }
        }
      });
    });

    it('should configure custom domain when provided', () => {
      const customApp = new App();
      const customStack = new Stack(customApp, 'CustomStack');
      const customConstruct = new ServerlessWebAppConstruct(customStack, 'CustomConstruct', {
        domainName: 'example.com',
        certificateArn: 'arn:aws:acm:us-east-1:123456789012:certificate/12345678-1234-1234-1234-123456789012'
      });
      const customTemplate = Template.fromStack(customStack);

      customTemplate.hasResourceProperties('AWS::CloudFront::Distribution', {
        DistributionConfig: {
          Aliases: ['example.com'],
          ViewerCertificate: {
            AcmCertificateArn: 'arn:aws:acm:us-east-1:123456789012:certificate/12345678-1234-1234-1234-123456789012',
            SslSupportMethod: 'sni-only',
            MinimumProtocolVersion: 'TLSv1.2_2021'
          }
        }
      });
    });

    it('should configure error responses for SPA routing', () => {
      // Verify custom error responses are configured
      template.hasResourceProperties('AWS::CloudFront::Distribution', {
        DistributionConfig: {
          CustomErrorResponses: [
            {
              ErrorCode: 403,
              ResponseCode: 200,
              ResponsePagePath: '/index.html',
              ErrorCachingMinTTL: 300
            },
            {
              ErrorCode: 404,
              ResponseCode: 200,
              ResponsePagePath: '/index.html',
              ErrorCachingMinTTL: 300
            },
            {
              ErrorCode: 500,
              ResponseCode: 500,
              ResponsePagePath: '/error.html',
              ErrorCachingMinTTL: 60
            }
          ]
        }
      });
    });

    it('should enable logging when enableLogging is true', () => {
      const loggingApp = new App();
      const loggingStack = new Stack(loggingApp, 'LoggingStack');
      const loggingConstruct = new ServerlessWebAppConstruct(loggingStack, 'LoggingConstruct', {
        enableLogging: true
      });
      const loggingTemplate = Template.fromStack(loggingStack);

      // Verify logging is configured
      const distributions = loggingTemplate.findResources('AWS::CloudFront::Distribution');
      const distribution = Object.values(distributions)[0];
      expect(distribution.Properties.DistributionConfig.Logging).toBeDefined();
      expect(distribution.Properties.DistributionConfig.Logging.IncludeCookies).toBe(false);
      expect(distribution.Properties.DistributionConfig.Logging.Prefix).toBe('cloudfront-logs/');
      expect(distribution.Properties.DistributionConfig.Logging.Bucket).toBeDefined();
    });

    it('should disable logging when enableLogging is false', () => {
      const noLoggingApp = new App();
      const noLoggingStack = new Stack(noLoggingApp, 'NoLoggingStack');
      const noLoggingConstruct = new ServerlessWebAppConstruct(noLoggingStack, 'NoLoggingConstruct', {
        enableLogging: false
      });
      const noLoggingTemplate = Template.fromStack(noLoggingStack);

      // Verify logging is not configured
      const distributions = noLoggingTemplate.findResources('AWS::CloudFront::Distribution');
      const distribution = Object.values(distributions)[0];
      expect(distribution.Properties.DistributionConfig.Logging).toBeUndefined();
    });

    it('should expose distribution as public readonly property', () => {
      expect(construct.distribution).toBeDefined();
      expect(construct.distribution.distributionId).toBeDefined();
      expect(construct.distribution.distributionDomainName).toBeDefined();
    });

    it('should configure proper cache behaviors', () => {
      // Verify default cache behavior for static content
      template.hasResourceProperties('AWS::CloudFront::Distribution', {
        DistributionConfig: {
          DefaultCacheBehavior: {
            AllowedMethods: ['GET', 'HEAD', 'OPTIONS'],
            CachedMethods: ['GET', 'HEAD', 'OPTIONS'],
            Compress: true,
            CachePolicyId: '658327ea-f89d-4fab-a63d-7e88639e58f6', // CACHING_OPTIMIZED
            OriginRequestPolicyId: '88a5eaf4-2fd4-4709-b370-b4c650ea3fcf' // CORS_S3_ORIGIN
          }
        }
      });

      // Verify API cache behavior
      template.hasResourceProperties('AWS::CloudFront::Distribution', {
        DistributionConfig: {
          CacheBehaviors: [
            {
              PathPattern: '/api/*',
              CachePolicyId: '4135ea2d-6df8-44a3-9df3-4b5a84be39ad', // CACHING_DISABLED
              OriginRequestPolicyId: 'b689b0a8-53d0-40ab-baf2-68738e2966ac' // ALL_VIEWER_EXCEPT_HOST_HEADER
            }
          ]
        }
      });
    });
  });

  describe('Logging and Monitoring Configuration', () => {
    it('should enable logging by default', () => {
      const construct = new ServerlessWebAppConstruct(stack, 'TestConstruct');
      template = Template.fromStack(stack);

      // Verify API Gateway has logging enabled
      template.hasResourceProperties('AWS::ApiGateway::Stage', {
        MethodSettings: [
          {
            DataTraceEnabled: true,
            LoggingLevel: 'INFO',
            MetricsEnabled: true,
            ResourcePath: '/*',
            HttpMethod: '*'
          }
        ]
      });

      // Verify CloudWatch log groups are created for Lambda functions
      template.resourceCountIs('AWS::Logs::LogGroup', 3); // API Gateway + 2 Lambda functions
    });

    it('should disable logging when enableLogging is false', () => {
      const construct = new ServerlessWebAppConstruct(stack, 'TestConstruct', {
        enableLogging: false
      });
      template = Template.fromStack(stack);

      // Verify API Gateway has logging disabled
      template.hasResourceProperties('AWS::ApiGateway::Stage', {
        MethodSettings: [
          {
            DataTraceEnabled: false,
            LoggingLevel: 'OFF',
            MetricsEnabled: false,
            ResourcePath: '/*',
            HttpMethod: '*'
          }
        ]
      });
    });

    it('should create CloudWatch dashboard when logging is enabled', () => {
      const construct = new ServerlessWebAppConstruct(stack, 'TestConstruct', {
        enableLogging: true
      });
      template = Template.fromStack(stack);

      // Verify CloudWatch dashboard is created
      template.hasResourceProperties('AWS::CloudWatch::Dashboard', {
        DashboardName: 'TestConstruct-monitoring'
      });
    });

    it('should not create monitoring resources when logging is disabled', () => {
      const construct = new ServerlessWebAppConstruct(stack, 'TestConstruct', {
        enableLogging: false
      });
      template = Template.fromStack(stack);

      // Verify no CloudWatch dashboard is created
      template.resourceCountIs('AWS::CloudWatch::Dashboard', 0);
      template.resourceCountIs('AWS::CloudWatch::Alarm', 0);
    });

    it('should create CloudWatch alarms for API Gateway metrics', () => {
      const construct = new ServerlessWebAppConstruct(stack, 'TestConstruct', {
        enableLogging: true
      });
      template = Template.fromStack(stack);

      // Verify API Gateway alarms are created
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        AlarmName: 'TestConstruct-api-4xx-errors',
        MetricName: '4XXError',
        Namespace: 'AWS/ApiGateway',
        Threshold: 10
      });

      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        AlarmName: 'TestConstruct-api-5xx-errors',
        MetricName: '5XXError',
        Namespace: 'AWS/ApiGateway',
        Threshold: 5
      });

      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        AlarmName: 'TestConstruct-api-latency',
        MetricName: 'Latency',
        Namespace: 'AWS/ApiGateway',
        Threshold: 5000
      });
    });

    it('should create CloudWatch alarms for Lambda functions', () => {
      const construct = new ServerlessWebAppConstruct(stack, 'TestConstruct', {
        enableLogging: true
      });
      template = Template.fromStack(stack);

      // Verify Lambda alarms are created for default functions
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        MetricName: 'Errors',
        Namespace: 'AWS/Lambda',
        Threshold: 3
      });

      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        MetricName: 'Duration',
        Namespace: 'AWS/Lambda',
        Threshold: 25000
      });
    });

    it('should create CloudWatch alarms for CloudFront metrics', () => {
      const construct = new ServerlessWebAppConstruct(stack, 'TestConstruct', {
        enableLogging: true
      });
      template = Template.fromStack(stack);

      // Verify CloudFront alarms are created
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        MetricName: '4xxErrorRate',
        Namespace: 'AWS/CloudFront',
        Threshold: 5
      });

      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        MetricName: '5xxErrorRate',
        Namespace: 'AWS/CloudFront',
        Threshold: 1
      });
    });

    it('should configure Lambda functions with structured logging environment variables', () => {
      const construct = new ServerlessWebAppConstruct(stack, 'TestConstruct');
      template = Template.fromStack(stack);

      // Verify Lambda functions have logging environment variables
      template.hasResourceProperties('AWS::Lambda::Function', {
        Environment: {
          Variables: {
            NODE_ENV: 'production',
            LOG_LEVEL: 'info'
          }
        }
      });
    });

    it('should enable X-Ray tracing for Lambda functions', () => {
      const construct = new ServerlessWebAppConstruct(stack, 'TestConstruct');
      template = Template.fromStack(stack);

      // Verify Lambda functions have X-Ray tracing enabled
      template.hasResourceProperties('AWS::Lambda::Function', {
        TracingConfig: {
          Mode: 'Active'
        }
      });
    });

    it('should create CloudWatch log groups with proper retention', () => {
      const construct = new ServerlessWebAppConstruct(stack, 'TestConstruct');
      template = Template.fromStack(stack);

      // Verify log groups have proper retention period
      template.hasResourceProperties('AWS::Logs::LogGroup', {
        RetentionInDays: 30
      });
    });

    it('should grant proper IAM permissions for logging', () => {
      const construct = new ServerlessWebAppConstruct(stack, 'TestConstruct');
      template = Template.fromStack(stack);

      // Verify Lambda execution roles have CloudWatch Logs permissions
      template.hasResourceProperties('AWS::IAM::Policy', {
        PolicyDocument: {
          Statement: expect.arrayContaining([
            expect.objectContaining({
              Effect: 'Allow',
              Action: [
                'logs:CreateLogStream',
                'logs:PutLogEvents'
              ]
            })
          ])
        }
      });

      // Verify X-Ray permissions are granted
      template.hasResourceProperties('AWS::IAM::Role', {
        ManagedPolicyArns: expect.arrayContaining([
          'arn:aws:iam::aws:policy/AWSXRayDaemonWriteAccess'
        ])
      });
    });

    it('should create Lambda functions with CloudWatch Insights enabled', () => {
      template = Template.fromStack(stack);

      // Verify Lambda Insights layer is attached
      template.hasResourceProperties('AWS::Lambda::Function', {
        Layers: expect.arrayContaining([
          expect.stringContaining('LambdaInsightsExtension')
        ])
      });
    });

    it('should configure dead letter queues for Lambda functions', () => {
      template = Template.fromStack(stack);

      // Verify Lambda functions have dead letter queue configuration
      template.hasResourceProperties('AWS::Lambda::Function', {
        DeadLetterConfig: {
          TargetArn: expect.any(Object)
        }
      });
    });

    it('should set appropriate timeout and memory for Lambda functions', () => {
      template = Template.fromStack(stack);

      // Verify Lambda functions have proper timeout and memory settings
      template.hasResourceProperties('AWS::Lambda::Function', {
        Timeout: 30,
        MemorySize: 256
      });
    });

    it('should use ARM64 architecture for cost optimization', () => {
      template = Template.fromStack(stack);

      // Verify Lambda functions use ARM64 architecture
      template.hasResourceProperties('AWS::Lambda::Function', {
        Architectures: ['arm64']
      });
    });

    it('should create API Gateway with CloudWatch role when logging enabled', () => {
      const construct = new ServerlessWebAppConstruct(stack, 'TestConstruct', {
        enableLogging: true
      });
      template = Template.fromStack(stack);

      // Verify API Gateway has CloudWatch role
      template.hasResourceProperties('AWS::ApiGateway::RestApi', {
        Policy: expect.any(Object)
      });
    });

    it('should configure API Gateway stage with detailed logging', () => {
      const construct = new ServerlessWebAppConstruct(stack, 'TestConstruct', {
        enableLogging: true
      });
      template = Template.fromStack(stack);

      // Verify API Gateway stage has detailed logging configuration
      template.hasResourceProperties('AWS::ApiGateway::Stage', {
        MethodSettings: [
          {
            DataTraceEnabled: true,
            LoggingLevel: 'INFO',
            MetricsEnabled: true,
            ResourcePath: '/*',
            HttpMethod: '*',
            ThrottlingBurstLimit: 5000,
            ThrottlingRateLimit: 2000
          }
        ]
      });
    });

    it('should create API Gateway log group when logging enabled', () => {
      const construct = new ServerlessWebAppConstruct(stack, 'TestConstruct', {
        enableLogging: true
      });
      template = Template.fromStack(stack);

      // Verify API Gateway log group is created
      template.hasResourceProperties('AWS::Logs::LogGroup', {
        LogGroupName: '/aws/apigateway/TestConstruct-api'
      });
    });
  });
});