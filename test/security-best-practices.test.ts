import { describe, it, expect, beforeEach } from 'vitest';
import { App, Stack } from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import { ServerlessWebAppConstruct } from '../src/serverless-web-app-construct';
import {
  validateIamPolicyLeastPrivilege,
  validateHttpsEnforcement,
  validateCorsConfiguration,
  validateS3BucketSecurity,
  validateLambdaFunctionSecurity,
  validateApiGatewaySecurity,
  validateCognitoUserPoolSecurity,
  enforceSecurityBestPractices,
  enforceHttpsSecurity,
  enforceS3Security,
  enforceApiGatewaySecurity,
  enforceLambdaSecurity,
  enforceCognitoSecurity,
  enforceIamLeastPrivilege
} from '../src/security-validation';

describe('Security Best Practices', () => {
  let app: App;
  let stack: Stack;
  let construct: ServerlessWebAppConstruct;
  
  beforeEach(() => {
    app = new App();
    stack = new Stack(app, 'TestStack');
    construct = new ServerlessWebAppConstruct(stack, 'TestConstruct');
  });
  
  describe('Security Validation', () => {
    it('should validate Lambda function security', () => {
      // Add a resource to create a Lambda function
      const lambdaFunction = construct.addResource({
        path: '/test',
        lambdaSourcePath: './lambda/health',
        requiresAuth: false
      });
      
      // Validate Lambda function security
      const result = validateLambdaFunctionSecurity(lambdaFunction, { logResults: false });
      
      // Assertions
      expect(result).toBeDefined();
      expect(result.passed).toBeDefined();
      expect(result.message).toBeDefined();
      expect(result.details).toBeDefined();
      expect(result.details.functionName).toBe(lambdaFunction.functionName);
    });
    
    it('should validate API Gateway security', () => {
      // Validate API Gateway security
      const result = validateApiGatewaySecurity(construct.api, { logResults: false });
      
      // Assertions
      expect(result).toBeDefined();
      expect(result.passed).toBeDefined();
      expect(result.message).toBeDefined();
      expect(result.details).toBeDefined();
      expect(result.details.apiId).toBe(construct.api.restApiId);
    });
    
    it('should validate Cognito User Pool security', () => {
      // Validate Cognito User Pool security
      const result = validateCognitoUserPoolSecurity(construct.userPool, { logResults: false });
      
      // Assertions
      expect(result).toBeDefined();
      expect(result.passed).toBeDefined();
      expect(result.message).toBeDefined();
      expect(result.details).toBeDefined();
      expect(result.details.userPoolId).toBe(construct.userPool.userPoolId);
    });
    
    it('should include all validations in validateSecurity', () => {
      // Add a resource to create a Lambda function
      construct.addResource({
        path: '/test',
        lambdaSourcePath: './lambda/health',
        requiresAuth: false
      });
      
      // Validate security
      const results = construct.validateSecurity({ logResults: false });
      
      // Assertions
      expect(results).toBeInstanceOf(Array);
      expect(results.length).toBeGreaterThan(0);
      
      // Check that we have results for each component type
      const iamResults = results.filter(r => r.message.includes('IAM role'));
      const httpsResults = results.filter(r => r.message.includes('CloudFront'));
      const corsResults = results.filter(r => r.message.includes('CORS'));
      const s3Results = results.filter(r => r.message.includes('S3 bucket'));
      const lambdaResults = results.filter(r => r.message.includes('Lambda function'));
      const apiResults = results.filter(r => r.message.includes('API Gateway') && !r.message.includes('CORS'));
      const cognitoResults = results.filter(r => r.message.includes('Cognito User Pool'));
      
      expect(iamResults.length).toBeGreaterThan(0);
      expect(httpsResults.length).toBe(1);
      expect(corsResults.length).toBe(1);
      expect(s3Results.length).toBe(1);
      expect(lambdaResults.length).toBeGreaterThan(0);
      expect(apiResults.length).toBe(1);
      expect(cognitoResults.length).toBe(1);
    });
  });
  
  describe('Security Enforcement', () => {
    it('should enforce HTTPS security', () => {
      // Enforce HTTPS security
      enforceHttpsSecurity(construct.distribution);
      
      // Validate HTTPS enforcement
      const result = validateHttpsEnforcement(construct.distribution, { logResults: false });
      
      // Assertions
      expect(result.passed).toBe(true);
    });
    
    it('should enforce S3 security', () => {
      // Enforce S3 security
      enforceS3Security(construct.bucket);
      
      // Validate S3 bucket security
      const result = validateS3BucketSecurity(construct.bucket, { logResults: false });
      
      // Assertions
      expect(result.passed).toBe(true);
    });
    
    it('should enforce all security best practices', () => {
      // Add a resource to create a Lambda function
      construct.addResource({
        path: '/test',
        lambdaSourcePath: './lambda/health',
        requiresAuth: false
      });
      
      // Enforce security best practices
      construct.enforceSecurityBestPractices();
      
      // Validate security
      const results = construct.validateSecurity({ logResults: false });
      
      // Count passed validations
      const passedCount = results.filter(result => result.passed).length;
      
      // Assertions
      expect(passedCount).toBeGreaterThan(0);
    });
  });
});