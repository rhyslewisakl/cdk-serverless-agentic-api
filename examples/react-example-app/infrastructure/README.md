# React Example App Infrastructure

This directory contains the AWS CDK infrastructure code for the React Example Application. It uses the `cdk-serverless-agentic-api` construct to create a complete serverless web application with authentication and API capabilities.

## Architecture

The infrastructure creates:

- **Cognito User Pool**: For user authentication and management
- **API Gateway**: RESTful API with Cognito authorization
- **Lambda Functions**: Serverless compute for API endpoints
- **DynamoDB Table**: NoSQL database for user items with GSI
- **S3 Bucket**: Static website hosting for React app
- **CloudFront Distribution**: CDN for global content delivery

## Prerequisites

- Node.js 18 or later
- AWS CLI configured with appropriate permissions
- AWS CDK CLI installed (`npm install -g aws-cdk`)

## Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Bootstrap CDK (first time only):**
   ```bash
   cdk bootstrap
   ```

## Deployment

1. **Build the TypeScript code:**
   ```bash
   npm run build
   ```

2. **Deploy the stack:**
   ```bash
   npm run deploy
   ```

   Or use CDK directly:
   ```bash
   cdk deploy
   ```

3. **View the outputs:**
   After deployment, note the output values:
   - `UserPoolId`: Cognito User Pool ID
   - `UserPoolClientId`: Cognito User Pool Client ID
   - `ApiUrl`: API Gateway endpoint URL
   - `CloudFrontUrl`: CloudFront distribution URL
   - `UserItemsTableName`: DynamoDB table name
   - `S3BucketName`: S3 bucket for static website

## Configuration

The stack creates a DynamoDB table with the following structure:

### UserItems Table
- **Partition Key**: `id` (String) - UUID for each item
- **Global Secondary Index**: `userId-createdAt-index`
  - **Partition Key**: `userId` (String) - Cognito user ID
  - **Sort Key**: `createdAt` (String) - ISO timestamp

### Environment Variables
The Lambda functions receive these environment variables:
- `USER_ITEMS_TABLE_NAME`: DynamoDB table name
- `USER_ITEMS_GSI_NAME`: GSI name for user queries

## Development

1. **Watch mode for TypeScript compilation:**
   ```bash
   npm run watch
   ```

2. **Run tests:**
   ```bash
   npm test
   ```

3. **View differences before deployment:**
   ```bash
   npm run diff
   ```

4. **Synthesize CloudFormation template:**
   ```bash
   npm run synth
   ```

## Cleanup

To remove all resources:

```bash
npm run destroy
```

## Customization

The stack can be customized by modifying `src/react-example-app-stack.ts`:

- **Cognito Configuration**: Modify password policies, sign-in options
- **API Configuration**: Adjust throttling, CORS settings
- **DynamoDB Configuration**: Change billing mode, add indexes
- **Domain Configuration**: Add custom domain name

## Troubleshooting

### Common Issues

1. **Permission Errors**: Ensure your AWS credentials have sufficient permissions
2. **Region Issues**: Make sure you're deploying to the correct AWS region
3. **Resource Limits**: Check AWS service limits in your account

### Useful Commands

- `cdk ls`: List all stacks
- `cdk diff`: Compare deployed stack with current state
- `cdk doctor`: Check CDK environment
- `aws sts get-caller-identity`: Verify AWS credentials