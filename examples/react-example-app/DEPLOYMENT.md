# React Example App - Deployment Guide

This guide walks you through deploying the React Example Application that demonstrates the `cdk-serverless-agentic-api` construct.

## Prerequisites

- Node.js 18+ (recommended) or 16+ (minimum)
- AWS CLI configured with appropriate permissions
- AWS CDK CLI installed: `npm install -g aws-cdk`
- **CDK Bootstrap**: Your AWS account and region must be bootstrapped for CDK deployments

### CDK Bootstrap Setup

Before deploying, you must bootstrap your AWS environment. This is required for CDK to deploy resources.

**For us-east-1 (default region):**
```bash
npx cdk bootstrap
```

**For other regions:**
```bash
# Replace us-west-2 with your desired region
npx cdk bootstrap aws://ACCOUNT-NUMBER/us-west-2

# Or set the region environment variable
export AWS_DEFAULT_REGION=us-west-2
npx cdk bootstrap
```

**To check if your environment is already bootstrapped:**
```bash
aws cloudformation describe-stacks --stack-name CDKToolkit --region your-region
```

If the stack doesn't exist, you need to run the bootstrap command.

## Quick Deployment

### 1. Deploy Infrastructure

```bash
cd infrastructure
npm install
npm run build
./deploy.sh
```

### 2. Deploy Frontend

```bash
cd ../frontend
npm install
npm run build

# Set the S3 bucket name from the infrastructure outputs
export S3_BUCKET_NAME=your-bucket-name-from-outputs
npm run deploy
```

### 3. Access the Application

Visit the CloudFront URL from the infrastructure outputs to access your deployed application.

## Detailed Deployment Steps

### Infrastructure Deployment

1. **Navigate to infrastructure directory:**
   ```bash
   cd examples/react-example-app/infrastructure
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Build TypeScript code:**
   ```bash
   npm run build
   ```

4. **Deploy the stack:**
   ```bash
   npx cdk deploy
   ```

6. **Note the outputs:**
   After deployment, save these values:
   - `UserPoolId`: Cognito User Pool ID
   - `UserPoolClientId`: Cognito User Pool Client ID
   - `ApiUrl`: API Gateway endpoint URL
   - `CloudFrontUrl`: CloudFront distribution URL
   - `S3BucketName`: S3 bucket for static website

### Frontend Deployment

1. **Navigate to frontend directory:**
   ```bash
   cd ../frontend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Build the React application:**
   ```bash
   npm run build
   ```

4. **Deploy to S3:**
   ```bash
   export S3_BUCKET_NAME=your-bucket-name-from-outputs
   npm run deploy
   ```

## Configuration

The application will be automatically configured to work with the deployed infrastructure. The construct provides:

- **Authentication**: Cognito User Pool with email-based sign-in
- **API**: REST API with `/health`, `/whoami`, and `/config` endpoints
- **Storage**: DynamoDB table ready for CRUD operations
- **CDN**: CloudFront distribution for global content delivery

## Verification

1. **Test the API endpoints:**
   ```bash
   # Health check (no auth required)
   curl https://your-api-url/api/health
   
   # Config endpoint (no auth required)
   curl https://your-api-url/api/config
   ```

2. **Access the frontend:**
   Visit the CloudFront URL to see the React application

3. **Check infrastructure:**
   ```bash
   # List stack resources
   aws cloudformation list-stack-resources --stack-name ReactExampleAppStack
   ```

## Troubleshooting

### Common Issues

1. **CDK Bootstrap Required:**
   ```bash
   npx cdk bootstrap
   ```

2. **Permission Errors:**
   Ensure your AWS credentials have permissions for:
   - CloudFormation
   - S3
   - CloudFront
   - Cognito
   - API Gateway
   - Lambda
   - DynamoDB
   - IAM

3. **Node.js Version Issues:**
   Use Node.js 18+ for best compatibility

4. **Build Failures:**
   ```bash
   # Clean and rebuild
   rm -rf node_modules package-lock.json
   npm install
   npm run build
   ```

### Useful Commands

```bash
# View stack status
aws cloudformation describe-stacks --stack-name ReactExampleAppStack

# View stack outputs
aws cloudformation describe-stacks \
  --stack-name ReactExampleAppStack \
  --query 'Stacks[0].Outputs'

# Check S3 bucket contents
aws s3 ls s3://your-bucket-name

# View CloudFront distribution
aws cloudfront list-distributions
```

## Cleanup

To remove all resources:

```bash
cd infrastructure
npx cdk destroy
```

**Warning:** This will delete all resources including the DynamoDB table and S3 bucket contents.

## Next Steps

After successful deployment:

1. **Implement Authentication**: Add login/register components (Task 2)
2. **Add CRUD Operations**: Implement item management (Task 3)
3. **Enhance UI**: Build responsive interface (Task 4)
4. **Add Testing**: Implement comprehensive tests (Task 5)

## Support

For issues with:
- **CDK Construct**: Check the main repository documentation
- **AWS Services**: Refer to AWS documentation
- **React Application**: Check React and related library documentation