# Configuration Guide

This guide provides detailed information on configuring the ServerlessWebAppConstruct for different scenarios and environments.

## Basic Configuration

The ServerlessWebAppConstruct can be configured with various options to customize its behavior. Here's a basic example:

```typescript
import { CDKServerlessAgenticAPI } from 'cdk-serverless-agentic-api';
import { Stack } from 'aws-cdk-lib';

const webApp = new CDKServerlessAgenticAPI(stack, 'MyWebApp', {
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
const webApp = new CDKServerlessAgenticAPI(stack, 'MyWebApp', {
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
const webApp = new CDKServerlessAgenticAPI(stack, 'MyWebApp', {
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
const webApp = new CDKServerlessAgenticAPI(stack, 'MyWebApp', {
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

### Resource with Dead Letter Queue

```typescript
webApp.addResource({
  path: '/critical',
  lambdaSourcePath: './lambda/critical',
  requiresAuth: true,
  enableDLQ: true  // Enable Dead Letter Queue for failed invocations
});
```

### Resource with Health Alarms

```typescript
webApp.addResource({
  path: '/monitored',
  lambdaSourcePath: './lambda/monitored',
  requiresAuth: false,
  enableHealthAlarms: true  // Enable CloudWatch alarms for errors and duration
});
```

## Extension Mode (Multi-Stack Support)

For large applications that exceed the 500 resource limit per stack, you can use extension mode to split resources across multiple stacks while sharing core infrastructure.

### Main Stack

```typescript
// Create the main stack with core infrastructure
const mainStack = new CDKServerlessAgenticAPI(this, 'MainAPI', {
  domainName: 'example.com',
  certificateArn: 'arn:aws:acm:us-east-1:123456789012:certificate/12345678-1234-1234-1234-123456789012'
});

// Add some API resources
mainStack.addResource({
  path: '/users',
  lambdaSourcePath: './lambda/users',
  requiresAuth: true
});

// Export resource IDs for use in extension stacks
const resourceIds = mainStack.getExportableResourceIds();
```

### Extension Stack

```typescript
// Create an extension stack that reuses the main stack's infrastructure
const extensionStack = new CDKServerlessAgenticAPI(this, 'ExtensionAPI', {
  extensionMode: {
    apiId: resourceIds.apiId,
    userPoolId: resourceIds.userPoolId,
    userPoolClientId: resourceIds.userPoolClientId,
    cognitoAuthorizerId: resourceIds.cognitoAuthorizerId
  },
  skipResources: {
    skipBucket: true,           // Don't create S3 bucket
    skipDistribution: true,     // Don't create CloudFront distribution
    skipDefaultEndpoints: true, // Don't create default endpoints
    skipLoggingBucket: true     // Don't create logging bucket
  }
});

// Add additional API resources to the extension stack
extensionStack.addResource({
  path: '/products',
  lambdaSourcePath: './lambda/products',
  requiresAuth: true
});
```

### Extension Mode Options

#### ExtensionModeConfig
- `apiId`: Existing API Gateway REST API ID
- `userPoolId`: Existing Cognito User Pool ID
- `userPoolClientId`: Existing Cognito User Pool Client ID
- `bucketName`: Existing S3 bucket name
- `distributionId`: Existing CloudFront distribution ID
- `cognitoAuthorizerId`: Existing Cognito authorizer ID

#### SkipResourcesConfig
- `skipBucket`: Skip creating S3 bucket
- `skipDistribution`: Skip creating CloudFront distribution
- `skipLoggingBucket`: Skip creating logging bucket
- `skipDefaultEndpoints`: Skip creating default endpoints (/health, /whoami, /config)

## Environment-Specific Configurations

### Development Environment

```typescript
const webApp = new CDKServerlessAgenticAPI(stack, 'DevWebApp', {
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
const webApp = new CDKServerlessAgenticAPI(stack, 'ProdWebApp', {
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

### Accessing Lambda Functions

You can access Lambda functions from the registry using the new `getLambdaFunction` method:

```typescript
// Get a specific Lambda function by path and method
const usersFunction = webApp.getLambdaFunction('/users', 'GET');
if (usersFunction) {
  // Grant additional permissions
  myDynamoTable.grantReadWriteData(usersFunction);
}

// Get a POST function
const createUserFunction = webApp.getLambdaFunction('/users', 'POST');
```

### DynamoDB Integration Helper

Use the built-in helper method for DynamoDB permissions:

```typescript
const userFunction = webApp.addResource({
  path: '/users',
  lambdaSourcePath: './lambda/users',
  requiresAuth: true
});

// Grant DynamoDB access using the helper method
webApp.grantDynamoDBAccess(userFunction, myTable, 'readwrite');
// Options: 'read', 'write', 'readwrite'
```

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

## Default Endpoints

The construct automatically creates three default endpoints:

### Health Check (`/api/health`)
A public endpoint that returns a 200 OK response for health monitoring.

### WhoAmI (`/api/whoami`)
An authenticated endpoint that returns the current user's Cognito claims.

### Config (`/api/config`)
A public endpoint that provides frontend configuration information.

**Important**: Always use the config endpoint instead of hardcoding values from CDK outputs:

```javascript
// Frontend usage
async function fetchConfig() {
  const response = await fetch('https://your-api-url.com/api/config');
  const config = await response.json();
  return config;
}
```

## Monitoring and Alarms

### Lambda Function Health Alarms

Enable CloudWatch alarms for Lambda functions:

```typescript
webApp.addResource({
  path: '/critical-function',
  lambdaSourcePath: './lambda/critical',
  requiresAuth: true,
  enableHealthAlarms: true  // Creates error and duration alarms
});
```

When enabled, the following alarms are created:
- **Error Alarm**: Triggers when error count exceeds 3 in 10 minutes
- **Duration Alarm**: Triggers when duration exceeds 25 seconds

### Dead Letter Queues

Enable DLQ for Lambda functions to capture failed invocations:

```typescript
webApp.addResource({
  path: '/important-function',
  lambdaSourcePath: './lambda/important',
  requiresAuth: true,
  enableDLQ: true  // Creates SQS DLQ for failed invocations
});
```

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