# API Reference

This document provides a comprehensive API reference for the ServerlessWebAppConstruct.

## Classes

### ServerlessWebAppConstruct

The main construct class that creates the serverless web application infrastructure.

```typescript
class ServerlessWebAppConstruct extends Construct {
  constructor(scope: Construct, id: string, props?: ServerlessWebAppConstructProps);
}
```

#### Constructor Parameters

- `scope`: The parent construct (usually a Stack)
- `id`: The construct ID
- `props`: Optional configuration properties

#### Properties

| Name | Type | Description |
|------|------|-------------|
| `bucket` | `s3.Bucket` | The S3 bucket for static website hosting |
| `distribution` | `cloudfront.Distribution` | The CloudFront distribution |
| `api` | `apigateway.RestApi` | The API Gateway REST API |
| `userPool` | `cognito.UserPool` | The Cognito user pool |
| `userPoolClient` | `cognito.UserPoolClient` | The Cognito user pool client |
| `identityPool` | `cognito.CfnIdentityPool` | The Cognito identity pool |
| `authenticatedRole` | `iam.Role` | The IAM role for authenticated users |
| `unauthenticatedRole` | `iam.Role` | The IAM role for unauthenticated users |
| `lambdaFunctions` | `Map<string, LambdaFunctionEntry>` | Registry of Lambda functions |
| `originAccessIdentity` | `cloudfront.OriginAccessIdentity` | The CloudFront Origin Access Identity for S3 bucket access |

#### Methods

##### addResource

Adds an API resource with Lambda integration.

```typescript
addResource(options: AddResourceOptions): lambda.Function
```

**Parameters:**
- `options`: Configuration options for the resource

**Returns:**
- The created Lambda function

**Example:**
```typescript
const myFunction = webApp.addResource({
  path: '/users',
  lambdaSourcePath: './lambda/users',
  requiresAuth: true
});
```

##### validateSecurity

Validates the security configuration of the construct.

```typescript
validateSecurity(options?: SecurityValidationOptions): SecurityValidationResult[]
```

**Parameters:**
- `options`: Optional validation options

**Returns:**
- Array of validation results

**Example:**
```typescript
const securityResults = webApp.validateSecurity({
  throwOnFailure: true,
  logResults: true
});
```

##### createLambdaFunction

Creates a Lambda function with the specified options.

```typescript
createLambdaFunction(options: LambdaFunctionOptions): lambda.Function
```

**Parameters:**
- `options`: Configuration options for the Lambda function

**Returns:**
- The created Lambda function

**Example:**
```typescript
const myFunction = webApp.createLambdaFunction({
  functionName: 'my-function',
  sourcePath: './lambda/my-function',
  environment: {
    TABLE_NAME: 'my-table'
  }
});
```

## Interfaces

### ServerlessWebAppConstructProps

Configuration properties for the ServerlessWebAppConstruct.

```typescript
interface ServerlessWebAppConstructProps {
  readonly domainName?: string;
  readonly certificateArn?: string;
  readonly bucketName?: string;
  readonly userPoolName?: string;
  readonly apiName?: string;
  readonly enableLogging?: boolean;
}
```

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

```typescript
interface AddResourceOptions {
  readonly path: string;
  readonly method?: string;
  readonly lambdaSourcePath: string;
  readonly requiresAuth?: boolean;
  readonly cognitoGroup?: string;
  readonly environment?: { [key: string]: string };
}
```

| Property | Type | Required | Default | Description |
|----------|------|----------|---------|-------------|
| `path` | `string` | Yes | - | The API path for the resource (e.g., '/users', '/products') |
| `method` | `string` | No | `'GET'` | HTTP method for the resource |
| `lambdaSourcePath` | `string` | Yes | - | Path to the directory containing the Lambda function source code |
| `requiresAuth` | `boolean` | No | `false` | Whether the resource requires authentication |
| `cognitoGroup` | `string` | No | - | Cognito group required to access this resource |
| `environment` | `{ [key: string]: string }` | No | - | Environment variables to pass to the Lambda function |

### ResourceConfig

Configuration for a resource within the construct.

```typescript
interface ResourceConfig {
  readonly path: string;
  readonly method: string;
  readonly requiresAuth: boolean;
  readonly cognitoGroup?: string;
  readonly lambdaSourcePath: string;
  readonly environment?: { [key: string]: string };
}
```

| Property | Type | Description |
|----------|------|-------------|
| `path` | `string` | The full API path including '/api' prefix |
| `method` | `string` | HTTP method for the resource |
| `requiresAuth` | `boolean` | Whether the resource requires authentication |
| `cognitoGroup` | `string` | Cognito group required to access this resource |
| `lambdaSourcePath` | `string` | Path to the Lambda function source directory |
| `environment` | `{ [key: string]: string }` | Environment variables for the Lambda function |

### LambdaFunctionEntry

Registry entry for Lambda functions.

```typescript
interface LambdaFunctionEntry {
  readonly function: lambda.Function;
  readonly config: ResourceConfig;
}
```

| Property | Type | Description |
|----------|------|-------------|
| `function` | `lambda.Function` | The Lambda function instance |
| `config` | `ResourceConfig` | Configuration used to create this function |

### LambdaFunctionOptions

Options for creating a Lambda function.

```typescript
interface LambdaFunctionOptions {
  readonly functionName: string;
  readonly sourcePath: string;
  readonly environment?: { [key: string]: string };
  readonly additionalPolicies?: any[];
}
```

| Property | Type | Description |
|----------|------|-------------|
| `functionName` | `string` | Unique name for the Lambda function |
| `sourcePath` | `string` | Path to the directory containing the Lambda function source code |
| `environment` | `{ [key: string]: string }` | Environment variables to pass to the Lambda function |
| `additionalPolicies` | `any[]` | Additional IAM policy statements to attach to the Lambda execution role |

### SecurityValidationOptions

Options for security validation.

```typescript
interface SecurityValidationOptions {
  readonly throwOnFailure?: boolean;
  readonly logResults?: boolean;
}
```

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `throwOnFailure` | `boolean` | `false` | Whether to throw an error when validation fails |
| `logResults` | `boolean` | `true` | Whether to log validation results |

### SecurityValidationResult

Result of a security validation check.

```typescript
interface SecurityValidationResult {
  readonly passed: boolean;
  readonly message: string;
  readonly details?: any;
}
```

| Property | Type | Description |
|----------|------|-------------|
| `passed` | `boolean` | Whether the validation passed |
| `message` | `string` | Message describing the validation result |
| `details` | `any` | Detailed information about the validation |

## Functions

### validateIamPolicyLeastPrivilege

Validates IAM policies for least privilege access.

```typescript
function validateIamPolicyLeastPrivilege(
  role: iam.Role,
  options?: SecurityValidationOptions
): SecurityValidationResult
```

**Parameters:**
- `role`: The IAM role to validate
- `options`: Optional validation options

**Returns:**
- Validation result

### validateHttpsEnforcement

Validates HTTPS enforcement for CloudFront distribution.

```typescript
function validateHttpsEnforcement(
  distribution: cloudfront.Distribution,
  options?: SecurityValidationOptions
): SecurityValidationResult
```

**Parameters:**
- `distribution`: The CloudFront distribution to validate
- `options`: Optional validation options

**Returns:**
- Validation result

### validateCorsConfiguration

Validates CORS configuration for API Gateway.

```typescript
function validateCorsConfiguration(
  api: apigateway.RestApi,
  options?: SecurityValidationOptions
): SecurityValidationResult
```

**Parameters:**
- `api`: The API Gateway REST API to validate
- `options`: Optional validation options

**Returns:**
- Validation result

### validateS3BucketSecurity

Validates S3 bucket security configuration.

```typescript
function validateS3BucketSecurity(
  bucket: s3.Bucket,
  options?: SecurityValidationOptions
): SecurityValidationResult
```

**Parameters:**
- `bucket`: The S3 bucket to validate
- `options`: Optional validation options

**Returns:**
- Validation result

### validateSecurityConfiguration

Validates all security aspects of the ServerlessWebAppConstruct.

```typescript
function validateSecurityConfiguration(
  scope: Construct,
  options?: SecurityValidationOptions
): SecurityValidationResult[]
```

**Parameters:**
- `scope`: The construct scope
- `options`: Optional validation options

**Returns:**
- Array of validation results