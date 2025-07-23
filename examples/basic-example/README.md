# Basic Example

This example demonstrates the basic usage of the ServerlessWebAppConstruct to create a serverless web application with both public and authenticated API endpoints.

## Architecture

This example creates:

- CloudFront distribution for content delivery
- S3 bucket for static website hosting
- Cognito user pool for authentication
- API Gateway with two endpoints:
  - `/api/hello` - Public endpoint that returns a greeting
  - `/api/profile` - Authenticated endpoint that returns user profile information

## Prerequisites

- Node.js 22+
- AWS CDK v2
- AWS CLI configured with appropriate credentials

## Deployment

1. Install dependencies:
   ```bash
   npm install
   ```

2. Build the project:
   ```bash
   npm run build
   ```

3. Deploy the stack:
   ```bash
   cdk deploy
   ```

4. After deployment, the CDK will output the CloudFront domain name.

## Testing

### Testing the Public Endpoint

```bash
curl https://<cloudfront-domain>/api/hello
```

Expected response:
```json
{
  "message": "Hello from the serverless web app!",
  "timestamp": "2025-07-23T12:34:56.789Z",
  "path": "/api/hello",
  "method": "GET"
}
```

### Testing the Authenticated Endpoint

1. Create a user in the Cognito user pool:
   ```bash
   aws cognito-idp sign-up \
     --client-id <user-pool-client-id> \
     --username user@example.com \
     --password Password123! \
     --user-attributes Name=email,Value=user@example.com
   ```

2. Confirm the user:
   ```bash
   aws cognito-idp admin-confirm-sign-up \
     --user-pool-id <user-pool-id> \
     --username user@example.com
   ```

3. Get an ID token:
   ```bash
   aws cognito-idp initiate-auth \
     --client-id <user-pool-client-id> \
     --auth-flow USER_PASSWORD_AUTH \
     --auth-parameters USERNAME=user@example.com,PASSWORD=Password123!
   ```

4. Use the ID token to call the authenticated endpoint:
   ```bash
   curl -H "Authorization: <id-token>" https://<cloudfront-domain>/api/profile
   ```

Expected response:
```json
{
  "message": "Profile information retrieved successfully",
  "user": {
    "id": "12345678-1234-1234-1234-123456789012",
    "email": "user@example.com",
    "emailVerified": true,
    "lastAccessed": "2025-07-23T12:34:56.789Z"
  }
}
```

## Cleanup

To remove all resources created by this example:

```bash
cdk destroy
```