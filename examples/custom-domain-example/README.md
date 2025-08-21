# Advanced Example

This example demonstrates advanced usage of the ServerlessWebAppConstruct with custom domain configuration and DynamoDB integration.

## Architecture

This example creates:

- CloudFront distribution with custom domain
- S3 bucket for static website hosting
- Cognito user pool for authentication
- API Gateway with multiple endpoints:
  - User management endpoints (authenticated)
  - Product management endpoints (mixed authentication)
- DynamoDB tables for data storage
- Security validation

## Features

- Custom domain with SSL/TLS
- Role-based access control with Cognito groups
- DynamoDB integration for persistent storage
- Multiple API resources with different HTTP methods
- Security validation

## Prerequisites

- Node.js 22+
- AWS CDK v2
- AWS CLI configured with appropriate credentials
- SSL certificate in ACM for your custom domain

## Deployment

1. Install dependencies:
   ```bash
   npm install
   ```

2. Update the certificate ARN and domain name in `app.ts` with your own values.

3. Build the project:
   ```bash
   npm run build
   ```

4. Deploy the stack:
   ```bash
   cdk deploy
   ```

5. After deployment, the CDK will output:
   - CloudFront domain name
   - API Gateway endpoint URL
   - Cognito User Pool ID
   - Cognito User Pool Client ID

6. Configure your DNS provider to point your custom domain to the CloudFront distribution.

## API Endpoints

### User Management

- `GET /api/users` - Get all users (authenticated)
- `POST /api/users` - Create a new user (authenticated)
- `GET /api/users/{userId}/profile` - Get user profile (authenticated)

### Product Management

- `GET /api/products` - Get all products (public)
- `POST /api/products` - Create a new product (authenticated, admin group only)
- `GET /api/products/{productId}` - Get product details (public)

## Testing

### Setting Up Authentication

1. Create a user in the Cognito user pool:
   ```bash
   aws cognito-idp sign-up \
     --client-id <user-pool-client-id> \
     --username admin@example.com \
     --password Password123! \
     --user-attributes Name=email,Value=admin@example.com
   ```

2. Confirm the user:
   ```bash
   aws cognito-idp admin-confirm-sign-up \
     --user-pool-id <user-pool-id> \
     --username admin@example.com
   ```

3. Add the user to the admin group:
   ```bash
   aws cognito-idp admin-add-user-to-group \
     --user-pool-id <user-pool-id> \
     --username admin@example.com \
     --group-name admin
   ```

4. Get an ID token:
   ```bash
   aws cognito-idp initiate-auth \
     --client-id <user-pool-client-id> \
     --auth-flow USER_PASSWORD_AUTH \
     --auth-parameters USERNAME=admin@example.com,PASSWORD=Password123!
   ```

### Testing the API

#### Public Endpoints

```bash
# Get all products
curl https://example.com/api/products

# Get product details
curl https://example.com/api/products/123
```

#### Authenticated Endpoints

```bash
# Get all users
curl -H "Authorization: <id-token>" https://example.com/api/users

# Create a new user
curl -X POST -H "Authorization: <id-token>" -H "Content-Type: application/json" \
  -d '{"name":"John Doe","email":"john@example.com"}' \
  https://example.com/api/users

# Get user profile
curl -H "Authorization: <id-token>" https://example.com/api/users/123/profile

# Create a new product (admin only)
curl -X POST -H "Authorization: <id-token>" -H "Content-Type: application/json" \
  -d '{"name":"Product 1","price":99.99,"description":"A great product"}' \
  https://example.com/api/products
```

## Security Validation

The example includes security validation that checks:

- IAM policies for least privilege
- HTTPS enforcement
- CORS configuration
- S3 bucket security

To view the security validation results, check the CloudWatch logs or add additional outputs to the stack.

## Cleanup

To remove all resources created by this example:

```bash
cdk destroy
```