# API Reference

This document provides a comprehensive API reference for the CDKServerlessAgenticAPI.

## Classes

### CDKServerlessAgenticAPI

The main construct class that creates the serverless web application infrastructure.

```typescript
class CDKServerlessAgenticAPI extends Construct {
  constructor(scope: Construct, id: string, props?: CDKServerlessAgenticAPIProps);
}
```

#### Constructor Parameters

- `scope`: The parent construct (usually a Stack)
- `id`: The construct ID
- `props`: Optional configuration properties

#### Properties

| Name | Type | Description |
|------|------|-------------|
| `bucket` | `s3.Bucket?` | The S3 bucket for static website hosting (optional in extension mode) |
| `distribution` | `cloudfront.Distribution?` | The CloudFront distribution (optional in extension mode) |
| `api` | `apigateway.RestApi` | The API Gateway REST API |
| `userPool` | `cognito.UserPool` | The Cognito user pool |
| `userPoolClient` | `cognito.UserPoolClient` | The Cognito user pool client |
| `cognitoAuthorizer` | `apigateway.CfnAuthorizer` | The Cognito authorizer for authenticated API endpoints |
| `lambdaFunctions` | `Record<string, LambdaFunctionEntry>` | Registry of Lambda functions indexed by method and path |
| `originAccessIdentity` | `cloudfront.OriginAccessIdentity?` | The CloudFront Origin Access Identity for S3 bucket access (optional in extension mode) |

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
createLambdaFunction(
  functionName: string,
  sourcePath: string,
  environment?: { [key: string]: string },
  additionalPolicies?: iam.PolicyStatement[]
): lambda.Function
```

**Parameters:**
- `functionName`: Unique name for the Lambda function
- `sourcePath`: Path to the directory containing the Lambda function source code
- `environment`: Environment variables to pass to the Lambda function
- `additionalPolicies`: Additional IAM policies to attach to the Lambda execution role

**Returns:**
- The created Lambda function

**Example:**
```typescript
const myFunction = webApp.createLambdaFunction(
  'my-function',
  './lambda/my-function',
  { TABLE_NAME: 'my-table' }
);
```

##### getLambdaFunction

Gets a Lambda function by path and method.

```typescript
getLambdaFunction(path: string, method?: string): lambda.Function | undefined
```

**Parameters:**
- `path`: The API path (e.g., '/users')
- `method`: The HTTP method (defaults to 'GET')

**Returns:**
- The Lambda function or undefined if not found

**Example:**
```typescript
const usersFunction = webApp.getLambdaFunction('/users', 'GET');
const createUserFunction = webApp.getLambdaFunction('/users', 'POST');
```

##### grantDynamoDBAccess

Grants DynamoDB access to a Lambda function.

```typescript
grantDynamoDBAccess(
  lambdaFunction: lambda.Function,
  table: any,
  accessType?: 'read' | 'write' | 'readwrite'
): void
```

**Parameters:**
- `lambdaFunction`: The Lambda function to grant access to
- `table`: The DynamoDB table to grant access to
- `accessType`: The type of access to grant (defaults to 'readwrite')

**Example:**
```typescript
const userFunction = webApp.addResource({
  path: '/users',
  lambdaSourcePath: './lambda/users',
  requiresAuth: true
});

webApp.grantDynamoDBAccess(userFunction, myTable, 'readwrite');
```

##### getExportableResourceIds

Gets exportable resource IDs for use in extension stacks.

```typescript
getExportableResourceIds(): ExportableResourceIds
```

**Returns:**
- Object containing resource IDs that can be used by extension stacks

**Example:**
```typescript
const resourceIds = mainStack.getExportableResourceIds();
// Use resourceIds in extension stacks
```

## Interfaces

### CDKServerlessAgenticAPIProps

Configuration properties for the CDKServerlessAgenticAPI.

```typescript
interface CDKServerlessAgenticAPIProps {
  readonly domainName?: string;
  readonly certificateArn?: string;
  readonly bucketName?: string;
  readonly userPoolName?: string;
  readonly apiName?: string;
  readonly enableLogging?: boolean;
  readonly lambdaSourcePath?: string;
  readonly errorPagesPath?: string;
  readonly extensionMode?: ExtensionModeConfig;
  readonly skipResources?: SkipResourcesConfig;
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
| `lambdaSourcePath` | `string` | No | Bundled lambda directory | Custom path to the directory containing Lambda function source code for default endpoints |
| `errorPagesPath` | `string` | No | Bundled error-pages directory | Custom path to the directory containing error page HTML files |
| `extensionMode` | `ExtensionModeConfig` | No | - | Extension mode configuration - use existing resources from another stack |
| `skipResources` | `SkipResourcesConfig` | No | - | Skip creating certain resources (for extension mode) |

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
| `enableDLQ` | `boolean` | No | `false` | Whether to enable Dead Letter Queue for the Lambda function |
| `enableHealthAlarms` | `boolean` | No | `false` | Whether to enable health alarms for the Lambda function |

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
| `enableDLQ` | `boolean` | Whether Dead Letter Queue is enabled for the Lambda function |
| `enableHealthAlarms` | `boolean` | Whether health alarms are enabled for the Lambda function |

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

### ExtensionModeConfig

Configuration for extension mode - using existing resources from another stack.

```typescript
interface ExtensionModeConfig {
  readonly apiId?: string;
  readonly userPoolId?: string;
  readonly userPoolClientId?: string;
  readonly bucketName?: string;
  readonly distributionId?: string;
  readonly cognitoAuthorizerId?: string;
}
```

| Property | Type | Description |
|----------|------|-------------|
| `apiId` | `string` | Existing API Gateway REST API ID |
| `userPoolId` | `string` | Existing Cognito User Pool ID |
| `userPoolClientId` | `string` | Existing Cognito User Pool Client ID |
| `bucketName` | `string` | Existing S3 bucket name |
| `distributionId` | `string` | Existing CloudFront distribution ID |
| `cognitoAuthorizerId` | `string` | Existing Cognito authorizer ID |

### SkipResourcesConfig

Configuration for skipping resource creation.

```typescript
interface SkipResourcesConfig {
  readonly skipBucket?: boolean;
  readonly skipDistribution?: boolean;
  readonly skipLoggingBucket?: boolean;
  readonly skipDefaultEndpoints?: boolean;
}
```

| Property | Type | Description |
|----------|------|-------------|
| `skipBucket` | `boolean` | Skip creating S3 bucket |
| `skipDistribution` | `boolean` | Skip creating CloudFront distribution |
| `skipLoggingBucket` | `boolean` | Skip creating logging bucket |
| `skipDefaultEndpoints` | `boolean` | Skip creating default endpoints (/health, /whoami, /config) |

### ExportableResourceIds

Exportable resource IDs for use in extension stacks.

```typescript
interface ExportableResourceIds {
  readonly apiId: string;
  readonly userPoolId: string;
  readonly userPoolClientId: string;
  readonly bucketName?: string;
  readonly distributionId?: string;
  readonly cognitoAuthorizerId: string;
}
```

| Property | Type | Description |
|----------|------|-------------|
| `apiId` | `string` | API Gateway REST API ID |
| `userPoolId` | `string` | Cognito User Pool ID |
| `userPoolClientId` | `string` | Cognito User Pool Client ID |
| `bucketName` | `string` | S3 bucket name |
| `distributionId` | `string` | CloudFront distribution ID |
| `cognitoAuthorizerId` | `string` | Cognito authorizer ID |

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