# CDK Serverless Agentic API

A CDK construct that simplifies the creation of serverless web applications on AWS by providing a comprehensive solution that integrates CloudFront, S3, Cognito, API Gateway, and Lambda functions.

[![npm version](https://badge.fury.io/js/cdk-serverless-agentic-api.svg)](https://badge.fury.io/js/cdk-serverless-agentic-api)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Overview

The CDK Serverless Agentic API is a high-level CDK construct that helps you deploy a complete serverless web application infrastructure on AWS with minimal configuration. It combines several AWS services into a cohesive architecture:

- **CloudFront** for global content delivery with SSL/TLS
- **S3** for static website hosting
- **Cognito** for user authentication and management
- **API Gateway** for RESTful API endpoints
- **Lambda** for serverless backend logic

This construct follows AWS best practices for security, performance, and cost optimization.

## Architecture

```
┌───────────────┐     ┌───────────────┐     ┌───────────────┐
│               │     │               │     │               │
│   CloudFront  │────▶│  S3 Bucket    │     │   Cognito     │
│  Distribution │     │ (Static Site) │     │  User Pool    │
│               │     │               │     │               │
└───────┬───────┘     └───────────────┘     └───────┬───────┘
        │                                           │
        │                                           │
        ▼                                           │
┌───────────────┐                                   │
│               │                                   │
│  API Gateway  │◀──────────────────────────────────┘
│    REST API   │          Authorizes
│               │
└───────┬───────┘
        │
        │
        ▼
┌───────────────┐
│               │
│    Lambda     │
│   Functions   │
│               │
└───────────────┘
```

## Requirements

- **Node.js**: 22.0.0 or higher (LTS recommended)
- **npm**: 8.0.0 or higher
- **AWS CDK**: 2.170.0 or higher

## Quick Start

```typescript
import { CDKServerlessAgenticAPI } from 'cdk-serverless-agentic-api';
import { Stack } from 'aws-cdk-lib';

export class MyStack extends Stack {
  constructor(scope, id, props) {
    super(scope, id, props);
    
    // Create the serverless API with default settings
    const api = new CDKServerlessAgenticAPI(this, 'MyApi');
    
    // Add an endpoint
    api.addResource({
      path: '/hello',
      lambdaSourcePath: './lambda/hello',
      requiresAuth: false
    });
  }
}


## Installation

```bash
npm install cdk-serverless-agentic-api
```

## Project Structure

```
├── src/
│   ├── index.ts                          # Main export file
│   ├── cdk-serverless-agentic-api.ts     # Core construct implementation
│   ├── types.ts                          # TypeScript interfaces and types
│   ├── error-handling.ts                 # Error handling utilities
│   └── security-validation.ts            # Security validation utilities
├── test/
│   ├── cdk-serverless-agentic-api.test.ts  # Unit tests
│   ├── integration/                      # Integration tests
│   └── lambda/                           # Lambda function tests
├── lambda/
│   ├── health/                           # Default health check endpoint
│   └── whoami/                           # Default authentication endpoint
├── lib/                                  # Compiled JavaScript output (generated)
├── package.json                          # Project dependencies and scripts
├── tsconfig.json                         # TypeScript configuration
├── vitest.config.ts                      # Test configuration
├── .eslintrc.js                          # ESLint configuration
└── README.md                             # This file
```

## Development

### Prerequisites

- Node.js 22+ 
- npm or yarn
- AWS CDK v2

### Installation

```bash
npm install
```

### Building

```bash
npm run build
```

### Testing

```bash
# Run tests once
npm test

# Run tests in watch mode
npm run test:watch

# Run integration tests
npm run test:integration
```

### Linting

```bash
# Check for linting issues
npm run lint

# Fix linting issues automatically
npm run lint:fix
```

## Usage

### Basic Usage

```typescript
import { CDKServerlessAgenticAPI } from 'cdk-serverless-agentic-api';
import { Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';

export class MyStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const webApp = new CDKServerlessAgenticAPI(this, 'MyWebApp');

    // Add API resources
    webApp.addResource({
      path: '/users',
      lambdaSourcePath: './lambda/users',
      requiresAuth: true
    });
  }
}
```

### Custom Domain Configuration

```typescript
const webApp = new CDKServerlessAgenticAPI(this, 'MyWebApp', {
  domainName: 'example.com',
  certificateArn: 'arn:aws:acm:us-east-1:123456789012:certificate/12345678-1234-1234-1234-123456789012'
});
```

### Adding API Resources

```typescript
// Public endpoint (no authentication required)
webApp.addResource({
  path: '/products',
  lambdaSourcePath: './lambda/products',
  requiresAuth: false
});

// Authenticated endpoint
webApp.addResource({
  path: '/users',
  lambdaSourcePath: './lambda/users',
  requiresAuth: true
});

// Specific HTTP method
webApp.addResource({
  path: '/orders',
  method: 'POST',
  lambdaSourcePath: './lambda/create-order',
  requiresAuth: true
});

// With environment variables
webApp.addResource({
  path: '/payments',
  lambdaSourcePath: './lambda/payments',
  requiresAuth: true,
  environment: {
    STRIPE_API_KEY: process.env.STRIPE_API_KEY || '',
    PAYMENT_MODE: 'test'
  }
});
```

### Accessing Lambda Functions

```typescript
// Access Lambda functions from the registry
const usersFunction = webApp.lambdaFunctions.get('GET /users');
if (usersFunction) {
  // Grant additional permissions
  myDynamoTable.grantReadWriteData(usersFunction.function);
  
  // Add event source mappings
  usersFunction.function.addEventSource(new SqsEventSource(myQueue));
}
```

### Security Validation

```typescript
// Validate security configuration
const securityResults = webApp.validateSecurity();

// Check results
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

## API Reference

### Key Methods

```typescript
// Add an API endpoint with Lambda integration
const userFunction = api.addResource({
  path: '/users',
  method: 'GET',
  lambdaSourcePath: './lambda/users',
  requiresAuth: true
});

// Create a standalone Lambda function
const processor = api.createLambdaFunction(
  'DataProcessor',
  './lambda/processor',
  { BUCKET_NAME: api.bucket.bucketName }
);

// Validate security configuration
api.validateSecurity({ throwOnFailure: true });

// Apply security best practices
api.enforceSecurityBestPractices();
```

### Key Properties

```typescript
// Access underlying AWS resources
api.bucket                // S3 bucket for static files
api.distribution          // CloudFront distribution
api.api                   // API Gateway REST API
api.userPool              // Cognito User Pool
api.lambdaFunctions       // Map of all Lambda functions
```

For complete API documentation, see [API_REFERENCE.md](./API_REFERENCE.md)

### CDKServerlessAgenticAPIProps

Configuration properties for the CDKServerlessAgenticAPI.

| Property | Type | Required | Default | Description |
|----------|------|----------|---------|-------------|
| `domainName` | `string` | No | CloudFront generated domain | Custom domain name for the CloudFront distribution |
| `certificateArn` | `string` | Only if domainName is provided | - | ARN of the SSL certificate for the custom domain |
| `bucketName` | `string` | No | CDK generated name | Custom name for the S3 bucket |
| `userPoolName` | `string` | No | CDK generated name | Custom name for the Cognito User Pool |
| `apiName` | `string` | No | CDK generated name | Custom name for the API Gateway |
| `enableLogging` | `boolean` | No | `true` | Enable detailed logging for all components |

### AddResourceOptions

Options for adding a new API resource to the construct.

| Property | Type | Required | Default | Description |
|----------|------|----------|---------|-------------|
| `path` | `string` | Yes | - | The API path for the resource (e.g., '/users', '/products') |
| `method` | `string` | No | `'GET'` | HTTP method for the resource |
| `lambdaSourcePath` | `string` | Yes | - | Path to the directory containing the Lambda function source code |
| `requiresAuth` | `boolean` | No | `false` | Whether the resource requires authentication |
| `cognitoGroup` | `string` | No | - | Cognito group required to access this resource |
| `environment` | `{ [key: string]: string }` | No | - | Environment variables to pass to the Lambda function |

## Lambda Function Structure

When adding resources with `addResource`, you need to provide a Lambda function source directory. The directory should have the following structure:

```
lambda/
└── my-function/
    ├── index.js        # Main handler file
    ├── package.json    # Dependencies
    └── node_modules/   # Installed dependencies (optional)
```

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

## Default Endpoints

The construct automatically creates three default endpoints:

1. **Health Check** (`/api/health`): A public endpoint that returns a 200 OK response
2. **WhoAmI** (`/api/whoami`): An authenticated endpoint that returns the current user's Cognito claims
3. **Config** (`/api/config`): A public endpoint that provides frontend configuration information

### Using the Config Endpoint

The config endpoint returns essential information needed by frontend applications to connect to the backend services:

```javascript
// Example of fetching configuration from the config endpoint
async function fetchConfig() {
  const response = await fetch('https://your-api-url.com/api/config');
  const config = await response.json();
  
  // Use the configuration to set up your frontend app
  // This avoids hardcoding values from CDK outputs
  return config;
}

// Example response structure
{
  "auth": {
    "region": "us-east-1",
    "userPoolId": "us-east-1_abcdefghi",
    "userPoolWebClientId": "1234567890abcdefghijklmnop",
    "oauth": {
      "domain": "your-domain.auth.us-east-1.amazoncognito.com",
      "scope": ["email", "profile", "openid"],
      "redirectSignIn": "",
      "redirectSignOut": "",
      "responseType": "code"
    }
  },
  "api": {
    "endpoints": [
      {
        "name": "api",
        "endpoint": "https://api-id.execute-api.us-east-1.amazonaws.com/api",
        "region": "us-east-1"
      }
    ]
  },
  "version": "1.0.0"
}
```

> **Important**: Always use the config endpoint instead of hardcoding values from CDK outputs. This ensures your frontend application can adapt to changes in the backend infrastructure.

## Security Best Practices

The construct implements several security best practices:

- **HTTPS Enforcement**: All traffic is encrypted in transit
- **S3 Bucket Security**: Public access blocking, encryption at rest
- **IAM Least Privilege**: Minimal permissions for Lambda functions
- **Cognito Authentication**: JWT-based authentication for API endpoints
- **CORS Configuration**: Secure cross-origin resource sharing
- **Security Headers**: HTTP security headers for CloudFront

## Examples

### Complete Example with Custom Domain

```typescript
import { CDKServerlessAgenticAPI } from 'cdk-serverless-agentic-api';
import { Stack, StackProps, App } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';

class MyWebAppStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    // Create DynamoDB table for the application
    const table = new dynamodb.Table(this, 'UsersTable', {
      partitionKey: { name: 'userId', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST
    });

    // Create the serverless web app construct
    const webApp = new CDKServerlessAgenticAPI(this, 'MyWebApp', {
      domainName: 'example.com',
      certificateArn: 'arn:aws:acm:us-east-1:123456789012:certificate/12345678-1234-1234-1234-123456789012',
      enableLogging: true
    });

    // Add API resources
    const getUsersFunction = webApp.addResource({
      path: '/users',
      method: 'GET',
      lambdaSourcePath: './lambda/get-users',
      requiresAuth: true,
      environment: {
        TABLE_NAME: table.tableName
      }
    });

    const createUserFunction = webApp.addResource({
      path: '/users',
      method: 'POST',
      lambdaSourcePath: './lambda/create-user',
      requiresAuth: true,
      environment: {
        TABLE_NAME: table.tableName
      }
    });

    // Grant permissions to Lambda functions
    table.grantReadData(getUsersFunction);
    table.grantWriteData(createUserFunction);
  }
}

const app = new App();
new MyWebAppStack(app, 'MyWebAppStack');
app.synth();
```

### Example with Security Validation

```typescript
import { CDKServerlessAgenticAPI } from 'cdk-serverless-agentic-api';
import { Stack, StackProps, App } from 'aws-cdk-lib';
import { Construct } from 'constructs';

class SecureWebAppStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    // Create the serverless web app construct
    const webApp = new CDKServerlessAgenticAPI(this, 'SecureWebApp');

    // Add API resources
    webApp.addResource({
      path: '/secure-data',
      lambdaSourcePath: './lambda/secure-data',
      requiresAuth: true
    });

    // Validate security configuration
    const securityResults = webApp.validateSecurity({
      throwOnFailure: true,  // Throw error if validation fails
      logResults: true       // Log results to console
    });

    // Output security validation results
    new cdk.CfnOutput(this, 'SecurityValidationResults', {
      value: JSON.stringify(securityResults.map(r => ({
        component: r.message,
        passed: r.passed
      })))
    });
  }
}

const app = new App();
new SecureWebAppStack(app, 'SecureWebAppStack');
app.synth();
```

## Deployment Guide

### Prerequisites

1. Install the AWS CLI and configure your credentials:
   ```bash
   aws configure
   ```

2. Install the AWS CDK:
   ```bash
   npm install -g aws-cdk
   ```

3. Bootstrap your AWS environment (if not already done):
   ```bash
   cdk bootstrap aws://ACCOUNT-NUMBER/REGION
   ```

### Deployment Steps

1. Create a new CDK project:
   ```bash
   mkdir my-serverless-app
   cd my-serverless-app
   cdk init app --language typescript
   ```

2. Install the cdk-serverless-agentic-api:
   ```bash
   npm install cdk-serverless-agentic-api
   ```

3. Update your stack code to use the construct (see examples above)

4. Deploy the stack:
   ```bash
   cdk deploy
   ```

5. After deployment, the CDK will output the CloudFront domain name and other important information.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.