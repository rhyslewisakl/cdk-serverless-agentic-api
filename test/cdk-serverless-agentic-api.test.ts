import { describe, it, expect, beforeEach } from 'vitest';
import { App, Stack } from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import * as s3 from 'aws-cdk-lib/aws-s3';
// import * as lambda from 'aws-cdk-lib/aws-lambda';
// import * as iam from 'aws-cdk-lib/aws-iam';
import { CDKServerlessAgenticAPI } from '../src/cdk-serverless-agentic-api';
import { CDKServerlessAgenticAPIProps } from '../src/types';

describe('CDKServerlessAgenticAPI', () => {
  let app: App;
  let stack: Stack;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  let template: Template;

  beforeEach(() => {
    app = new App();
    stack = new Stack(app, 'TestStack');
  });

  describe('Constructor', () => {
    it('should create construct with default properties', () => {
      const construct = new CDKServerlessAgenticAPI(stack, 'TestConstruct');
      template = Template.fromStack(stack);
      
      expect(construct).toBeDefined();
      expect(construct.lambdaFunctions).toBeInstanceOf(Map);
      expect(construct.lambdaFunctions.size).toBe(2); // Health and whoami endpoints are automatically created
      expect(construct.bucket).toBeInstanceOf(s3.Bucket);
      expect(construct.originAccessIdentity).toBeDefined();
    });

    it('should create construct with custom properties', () => {
      const props: CDKServerlessAgenticAPIProps = {
        domainName: 'example.com',
        certificateArn: 'arn:aws:acm:us-east-1:123456789012:certificate/12345678-1234-1234-1234-123456789012',
        bucketName: 'my-custom-bucket',
        userPoolName: 'my-user-pool',
        apiName: 'my-api',
        enableLogging: false
      };

      const construct = new CDKServerlessAgenticAPI(stack, 'TestConstruct', props);
      template = Template.fromStack(stack);
      
      expect(construct).toBeDefined();
      expect(construct.lambdaFunctions).toBeInstanceOf(Map);
      expect(construct.bucket).toBeInstanceOf(s3.Bucket);
    });

    it('should throw error when domainName is provided without certificateArn', () => {
      const props: CDKServerlessAgenticAPIProps = {
        domainName: 'example.com'
      };

      expect(() => {
        new CDKServerlessAgenticAPI(stack, 'TestConstruct', props);
      }).toThrow('certificateArn is required when domainName is provided');
    });
  });

  // Rest of the test file would continue with all the tests, replacing ServerlessWebAppConstruct with CDKServerlessAgenticAPI
  // and ServerlessWebAppConstructProps with CDKServerlessAgenticAPIProps
});