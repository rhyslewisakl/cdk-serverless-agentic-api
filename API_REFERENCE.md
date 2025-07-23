# API Reference

## Key Methods

### `addResource(options)`
Adds an API endpoint with Lambda integration.

```typescript
// Basic endpoint
const helloFunction = api.addResource({
  path: '/hello',
  lambdaSourcePath: './lambda/hello',
  requiresAuth: false
});

// Authenticated endpoint with specific HTTP method
const createUserFunction = api.addResource({
  path: '/users',
  method: 'POST',
  lambdaSourcePath: './lambda/create-user',
  requiresAuth: true,
  cognitoGroup: 'admins' // Optional: restrict to specific group
});
```

### `validateSecurity(options?)`
Checks your infrastructure for security best practices.

```typescript
// Basic validation
const results = api.validateSecurity();
console.log(`Passed: ${results.filter(r => r.passed).length}/${results.length}`);

// Strict validation (throws on failure)
api.validateSecurity({ throwOnFailure: true });
```

### `createLambdaFunction(name, path, env?, policies?)`
Creates a standalone Lambda function (not connected to API Gateway).

```typescript
const processorFunction = api.createLambdaFunction(
  'DataProcessor',
  './lambda/processor',
  { BUCKET_NAME: api.bucket.bucketName }
);

// Grant additional permissions
api.bucket.grantReadWrite(processorFunction);
```

### `enforceSecurityBestPractices(options?)`
Automatically applies security best practices to your infrastructure.

```typescript
// Apply all security best practices
api.enforceSecurityBestPractices();

// Apply specific security practices
api.enforceSecurityBestPractices({
  enforceHttps: true,
  enforceS3Security: true,
  enforceLambdaSecurity: false
});
```

## Properties

| Property | Description | Common Use Case |
|----------|-------------|----------------|
| `bucket` | S3 bucket for static assets | `bucket.grantRead(someFunction)` |
| `distribution` | CloudFront CDN | `distribution.distributionDomainName` |
| `api` | API Gateway REST API | `api.deploymentStage.urlForPath('/api')` |
| `userPool` | Cognito User Pool | `userPool.addClient(...)` |
| `userPoolClient` | Cognito User Pool Client | `userPoolClient.userPoolClientId` |
| `cognitoAuthorizer` | API Gateway Cognito authorizer | `cognitoAuthorizer.ref` |
| `lambdaFunctions` | Map of all Lambda functions | `lambdaFunctions.get('/api/users')?.function` |

## Default Endpoints

### Config Endpoint

The construct automatically creates a `/api/config` endpoint that provides frontend applications with necessary configuration information:

```typescript
// The config endpoint returns:
{
  "auth": {
    "region": "us-east-1",                           // AWS region
    "userPoolId": "us-east-1_abcdefghi",             // Cognito User Pool ID
    "userPoolWebClientId": "1234567890abcdefghi",   // Cognito User Pool Client ID
    "oauth": { /* OAuth configuration */ }
  },
  "api": {
    "endpoints": [{ "name": "api", "endpoint": "https://..." }]
  },
  "version": "1.0.0"
}
```

This endpoint should be used by frontend applications to retrieve configuration values instead of hardcoding them from CDK outputs.

## Configuration Options

### CDKServerlessAgenticAPIProps

| Property | Type | Required | Default | Description |
|----------|------|----------|---------|-------------|
| `domainName` | `string` | No | CloudFront domain | Custom domain name |
| `certificateArn` | `string` | Only with domainName | - | SSL certificate ARN |
| `bucketName` | `string` | No | Auto-generated | S3 bucket name |
| `userPoolName` | `string` | No | Auto-generated | Cognito User Pool name |
| `apiName` | `string` | No | Auto-generated | API Gateway name |
| `enableLogging` | `boolean` | No | `true` | Enable detailed logging |

### AddResourceOptions

| Property | Type | Required | Default | Description |
|----------|------|----------|---------|-------------|
| `path` | `string` | Yes | - | API path (e.g., '/users') |
| `method` | `string` | No | `'GET'` | HTTP method |
| `lambdaSourcePath` | `string` | Yes | - | Path to Lambda code |
| `requiresAuth` | `boolean` | No | `false` | Require authentication |
| `cognitoGroup` | `string` | No | - | Required Cognito group |
| `environment` | `object` | No | - | Lambda environment variables |