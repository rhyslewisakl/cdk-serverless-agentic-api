import { describe, it, expect } from 'vitest';
import { App, Stack } from 'aws-cdk-lib';
import { CDKServerlessAgenticAPI } from '../../src/cdk-serverless-agentic-api';
import { SecurityValidationResult } from '../../src/security-validation';

describe('Security Validation Integration', () => {
  it('should validate security of a complete construct', () => {
    // Create a test stack and construct
    const app = new App();
    const stack = new Stack(app, 'IntegrationTestStack');
    const construct = new CDKServerlessAgenticAPI(stack, 'IntegrationTestConstruct');
    
    // Add a test resource
    construct.addResource({
      path: '/test',
      lambdaSourcePath: './lambda/health',
      requiresAuth: true
    });
    
    // Validate security
    const results = construct.validateSecurity();
    
    // Assertions
    expect(results).toBeInstanceOf(Array);
    expect(results.length).toBeGreaterThan(0);
    
    // Check that we have results for each component type
    const iamResults = results.filter(r => r.message.includes('IAM role'));
    const httpsResults = results.filter(r => r.message.includes('CloudFront distribution'));
    const corsResults = results.filter(r => r.message.includes('API Gateway'));
    const s3Results = results.filter(r => r.message.includes('S3 bucket'));
    
    expect(iamResults.length).toBeGreaterThan(0);
    expect(httpsResults.length).toBeGreaterThan(0);
    expect(corsResults.length).toBeGreaterThan(0);
    expect(s3Results.length).toBeGreaterThan(0);
    
    // Check that we can access result details
    results.forEach((result: SecurityValidationResult) => {
      expect(result.passed).toBeDefined();
      expect(result.message).toBeDefined();
      expect(result.details).toBeDefined();
    });
  });
});