# Configuration Guide

This guide provides detailed information on configuring the ServerlessWebAppConstruct for different scenarios and environments.

## Basic Configuration

The ServerlessWebAppConstruct can be configured with various options to customize its behavior. Here's a basic example:

```typescript
import { ServerlessWebAppConstruct } from 'serverless-web-app-construct';
import { Stack } from 'aws-cdk-lib';

const webApp = new ServerlessWebAppConstruct(stack, 'MyWebApp', {
  domainName: 'example.com',
  certificateArn: 'arn:aws:acm:us-east-1:123456789012:certificate/12345678-1234-1234-1234-123456789012',
  bucketName: 'my-static-website',
  userPoolName: 'my-user-pool',
  apiName: 'my-api',
  enableLogging: true
});
```

## Configuration Options

### Custom Domain

To configure a custom domain for your CloudFront distribution:

```typescript
const webApp = new ServerlessWebAppConstruct(stack, 'MyWebApp', {
  domainName: 'example.com',
  certificateArn: 'arn:aws:acm:us-east-1:123456789012:certificate/12345678-1234-1234-1234-123456789012'
});
```

**Important Notes:**
- The certificate must be in the `us-east-1` region, as required by CloudFront.
- The certificate must be validated before deployment.
- You need to create a CNAME record in your DNS provider pointing to the CloudFront distribution.

### Custom Resource Names

You can customize the names of the resources created by the construct:

```typescript
const webApp = new ServerlessWebAppConstruct(stack, 'MyWebApp', {
  bucketName: 'my-static-website',
  userPoolName: 'my-user-pool',
  apiName: 'my-api'
});
```

**Important Notes:**
- Bucket names must be globally unique across all AWS accounts.
- User pool names must be unique within your AWS account.
- API names must be unique within your AWS account.

### Logging Configuration

You can enable or disable detailed logging for all components:

```typescript
const webApp = new ServerlessWebAppConstruct(stack, 'MyWebApp', {
  enableLogging: true // Default is true
});
```

When logging is enabled:
- CloudFront access logs are stored in an S3 bucket
- API Gateway logs are sent to CloudWatch Logs
- Lambda function logs are sent to CloudWatch Logs

## Adding API Resources

### Basic Resource

```typescript
webApp.addResource({
  path: '/hello',
  lambdaSourcePath: './lambda/hello',
  requiresAuth: false
});
```

### Authenticated Resource

```typescript
webApp.addResource({
  path: '/profile',
  lambdaSourcePath: './lambda/profile',
  requiresAuth: true
});
```

### Resource with Specific HTTP Method

```typescript
webApp.addResource({
  path: '/users',
  method: 'POST',
  lambdaSourcePath: './lambda/create-user',
  requiresAuth: true
});
```

### Resource with Environment Variables

```typescript
webApp.addResource({
  path: '/products',
  lambdaSourcePath: './lambda/products',
  requiresAuth: false,
  environment: {
    DATABASE_URL: process.env.DATABASE_URL || '',
    API_KEY: process.env.API_KEY || ''
  }
});
```

### Resource with Cognito Group Restriction

```typescript
webApp.addResource({
  path: '/admin',
  lambdaSourcePath: './lambda/admin',
  requiresAuth: true,
  cognitoGroup: 'admin'
});
```

## Environment-Specific Configurations

### Development Environment

```typescript
const webApp = new ServerlessWebAppConstruct(stack, 'DevWebApp', {
  enableLogging: true
});

// Add development-specific resources
webApp.addResource({
  path: '/debug',
  lambdaSourcePath: './lambda/debug',
  requiresAuth: false,
  environment: {
    DEBUG_MODE: 'true'
  }
});
```

### Production Environment

```typescript
const webApp = new ServerlessWebAppConstruct(stack, 'ProdWebApp', {
  domainName: 'example.com',
  certificateArn: 'arn:aws:acm:us-east-1:123456789012:certificate/12345678-1234-1234-1234-123456789012',
  enableLogging: true
});

// Add production-specific resources
webApp.addResource({
  path: '/api-status',
  lambdaSourcePath: './lambda/status',
  requiresAuth: true,
  cognitoGroup: 'operations'
});
```

## Lambda Function Configuration

### Lambda Function Structure

When adding resources with `addResource`, you need to provide a Lambda function source directory. The directory should have the following structure:

```
lambda/
└── my-function/
    ├── index.js        # Main handler file
    ├── package.json    # Dependencies (optional)
    └── node_modules/   # Installed dependencies (optional)
```

### Lambda Function Handler

The `index.js` file should export a handler function:

```javascript
exports.handler = async (event, context) => {
  // Your Lambda function code
  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    },
    body: JSON.stringify({
      message: 'Hello from Lambda!'
    })
  };
};
```

### Lambda Function with Dependencies

If your Lambda function has dependencies, you need to include a `package.json` file and install the dependencies:

```json
{
  "name": "my-function",
  "version": "1.0.0",
  "dependencies": {
    "axios": "^1.4.0",
    "uuid": "^9.0.0"
  }
}
```

Install the dependencies:

```bash
cd lambda/my-function
npm install
```

## Security Configuration

### Security Validation

You can validate the security configuration of your serverless web app:

```typescript
// Validate security with default options
const securityResults = webApp.validateSecurity();

// Log security validation results
securityResults.forEach(result => {
  if (!result.passed) {
    console.warn(`Security issue: ${result.message}`);
    console.warn(`Details: ${JSON.stringify(result.details)}`);
  }
});

// Validate with custom options
webApp.validateSecurity({
  throwOnFailure: true,  // Throw error if validation fails
  logResults: true       // Log results to console
});
```

### IAM Permissions

The construct automatically creates IAM roles with least privilege permissions for Lambda functions. If you need to grant additional permissions:

```typescript
import * as iam from 'aws-cdk-lib/aws-iam';

// Add a resource
const myFunction = webApp.addResource({
  path: '/data',
  lambdaSourcePath: './lambda/data',
  requiresAuth: true
});

// Grant additional permissions
myFunction.addToRolePolicy(new iam.PolicyStatement({
  actions: ['dynamodb:GetItem', 'dynamodb:PutItem'],
  resources: [myTable.tableArn]
}));
```

## Cognito Configuration

### User Pool Configuration

The construct creates a Cognito User Pool with email-based authentication. You can customize the user pool name:

```typescript
const webApp = new ServerlessWebAppConstruct(stack, 'MyWebApp', {
  userPoolName: 'my-user-pool'
});
```

### Adding Cognito Groups

You can add Cognito groups after creating the construct:

```typescript
import * as cognito from 'aws-cdk-lib/aws-cognito';

// Create admin group
new cognito.CfnUserPoolGroup(stack, 'AdminGroup', {
  userPoolId: webApp.userPool.userPoolId,
  groupName: 'admin',
  description: 'Administrators with full access'
});

// Create users group
new cognito.CfnUserPoolGroup(stack, 'UsersGroup', {
  userPoolId: webApp.userPool.userPoolId,
  groupName: 'users',
  description: 'Regular users with limited access'
});
```

### Restricting API Access to Specific Groups

```typescript
webApp.addResource({
  path: '/admin/users',
  lambdaSourcePath: './lambda/admin/users',
  requiresAuth: true,
  cognitoGroup: 'admin'
});
```

## CloudFront Configuration

### Cache Behavior

The construct configures CloudFront with default cache behaviors:

- Static content (S3): Cached for 1 day (86400 seconds)
- API endpoints (API Gateway): No caching for dynamic content

### Error Pages

The construct configures CloudFront with default error pages:

- 403 and 404 errors are redirected to `/index.html` for single-page applications
- Other errors show appropriate error pages

## API Gateway Configuration

### CORS Configuration

The construct configures API Gateway with CORS enabled:

- `Access-Control-Allow-Origin: '*'` (all origins)
- `Access-Control-Allow-Headers: 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'`
- `Access-Control-Allow-Methods: 'GET,POST,PUT,DELETE,OPTIONS'`

### API Gateway Stages

The construct creates a single API Gateway stage named `prod`.

## S3 Configuration

### Static Website Hosting

The construct configures the S3 bucket for static website hosting:

- Index document: `index.html`
- Error document: `index.html`

### S3 Security

The construct configures the S3 bucket with security best practices:

- Public access blocking enabled
- Server-side encryption enabled
- Secure transport (HTTPS) enforced