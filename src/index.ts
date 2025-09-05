/**
 * CDK Serverless Agentic API
 * 
 * A CDK construct that simplifies the creation of serverless web applications on AWS
 * by providing a comprehensive solution that integrates CloudFront, S3, Cognito,
 * API Gateway, and Lambda functions.
 */

// Export the main construct
export { CDKServerlessAgenticAPI } from './cdk-serverless-agentic-api';

// Export interfaces and types
export {
  CDKServerlessAgenticAPIProps,
  AddResourceOptions,
  ResourceConfig,
  LambdaFunctionEntry
} from './types';
