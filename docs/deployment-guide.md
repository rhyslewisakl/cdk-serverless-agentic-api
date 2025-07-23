# Deployment Guide

This guide provides detailed instructions for deploying a serverless web application using the ServerlessWebAppConstruct.

## Prerequisites

Before you begin, ensure you have the following:

1. **AWS Account**: You need an AWS account with appropriate permissions.

2. **AWS CLI**: Install and configure the AWS CLI:
   ```bash
   # Install AWS CLI
   curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
   unzip awscliv2.zip
   sudo ./aws/install

   # Configure AWS CLI
   aws configure
   ```

3. **Node.js and npm**: Install Node.js (version 22.0.0 or higher) and npm:
   ```bash
   # Using nvm (recommended)
   curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.3/install.sh | bash
   nvm install 22
   nvm use 22
   ```

4. **AWS CDK**: Install the AWS CDK toolkit:
   ```bash
   npm install -g aws-cdk
   ```

5. **CDK Bootstrap**: Bootstrap your AWS environment:
   ```bash
   cdk bootstrap aws://ACCOUNT-NUMBER/REGION
   ```

## Step 1: Create a New CDK Project

1. Create a new directory for your project:
   ```bash
   mkdir my-serverless-app
   cd my-serverless-app
   ```

2. Initialize a new CDK project:
   ```bash
   cdk init app --language typescript
   ```

3. Install the serverless-web-app-construct:
   ```bash
   npm install serverless-web-app-construct
   ```

## Step 2: Create Lambda Functions

1. Create directories for your Lambda functions:
   ```bash
   mkdir -p lambda/hello
   mkdir -p lambda/profile
   ```

2. Create a simple Lambda function for a public endpoint:
   ```bash
   # lambda/hello/index.js
   exports.handler = async (event) => {
     return {
       statusCode: 200,
       headers: {
         'Content-Type': 'application/json',
         'Access-Control-Allow-Origin': '*'
       },
       body: JSON.stringify({
         message: 'Hello from the serverless web app!',
         timestamp: new Date().toISOString()
       })
     };
   };
   ```

3. Create a Lambda function for an authenticated endpoint:
   ```bash
   # lambda/profile/index.js
   exports.handler = async (event) => {
     const claims = event.requestContext.authorizer?.claims || {};
     const userId = claims.sub || 'unknown';
     
     return {
       statusCode: 200,
       headers: {
         'Content-Type': 'application/json',
         'Access-Control-Allow-Origin': '*'
       },
       body: JSON.stringify({
         message: 'Profile information retrieved successfully',
         user: {
           id: userId,
           email: claims.email || 'unknown',
           lastAccessed: new Date().toISOString()
         }
       })
     };
   };
   ```

## Step 3: Update the CDK Stack

Update the `lib/my-serverless-app-stack.ts` file with the following code:

```typescript
import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { ServerlessWebAppConstruct } from 'serverless-web-app-construct';

export class MyServerlessAppStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Create the serverless web app construct
    const webApp = new ServerlessWebAppConstruct(this, 'MyWebApp', {
      enableLogging: true
    });

    // Add API resources
    webApp.addResource({
      path: '/hello',
      lambdaSourcePath: './lambda/hello',
      requiresAuth: false
    });

    webApp.addResource({
      path: '/profile',
      lambdaSourcePath: './lambda/profile',
      requiresAuth: true
    });

    // Output the CloudFront domain name
    new cdk.CfnOutput(this, 'CloudFrontDomainName', {
      value: webApp.distribution.distributionDomainName,
      description: 'CloudFront domain name'
    });

    // Output the Cognito User Pool ID and Client ID
    new cdk.CfnOutput(this, 'UserPoolId', {
      value: webApp.userPool.userPoolId,
      description: 'Cognito User Pool ID'
    });

    new cdk.CfnOutput(this, 'UserPoolClientId', {
      value: webApp.userPoolClient.userPoolClientId,
      description: 'Cognito User Pool Client ID'
    });
  }
}
```

## Step 4: Deploy the Stack

1. Build the project:
   ```bash
   npm run build
   ```

2. Deploy the stack:
   ```bash
   cdk deploy
   ```

3. Note the outputs from the deployment, including:
   - CloudFront domain name
   - Cognito User Pool ID
   - Cognito User Pool Client ID

## Step 5: Set Up Authentication

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

## Step 6: Test the API

1. Test the public endpoint:
   ```bash
   curl https://<cloudfront-domain>/api/hello
   ```

2. Get an authentication token:
   ```bash
   aws cognito-idp initiate-auth \
     --client-id <user-pool-client-id> \
     --auth-flow USER_PASSWORD_AUTH \
     --auth-parameters USERNAME=user@example.com,PASSWORD=Password123!
   ```

3. Test the authenticated endpoint:
   ```bash
   curl -H "Authorization: <id-token>" https://<cloudfront-domain>/api/profile
   ```

## Step 7: Deploy Static Website Content

1. Create a simple index.html file:
   ```html
   <!DOCTYPE html>
   <html>
   <head>
     <title>My Serverless Web App</title>
     <meta charset="UTF-8">
     <meta name="viewport" content="width=device-width, initial-scale=1.0">
   </head>
   <body>
     <h1>Welcome to My Serverless Web App</h1>
     <p>This is a static website hosted on S3 and served through CloudFront.</p>
     <button id="publicApi">Call Public API</button>
     <button id="privateApi">Call Private API</button>
     <pre id="result"></pre>

     <script>
       document.getElementById('publicApi').addEventListener('click', async () => {
         const response = await fetch('https://<cloudfront-domain>/api/hello');
         const data = await response.json();
         document.getElementById('result').textContent = JSON.stringify(data, null, 2);
       });

       document.getElementById('privateApi').addEventListener('click', async () => {
         // This is just a placeholder - you would need to implement proper authentication
         const token = prompt('Enter your ID token:');
         if (!token) return;

         try {
           const response = await fetch('https://<cloudfront-domain>/api/profile', {
             headers: {
               'Authorization': token
             }
           });
           const data = await response.json();
           document.getElementById('result').textContent = JSON.stringify(data, null, 2);
         } catch (error) {
           document.getElementById('result').textContent = 'Error: ' + error.message;
         }
       });
     </script>
   </body>
   </html>
   ```

2. Upload the file to the S3 bucket:
   ```bash
   aws s3 cp index.html s3://<bucket-name>/index.html
   ```

## Step 8: Set Up Custom Domain (Optional)

1. Register a domain name (if you don't already have one).

2. Request an SSL certificate in AWS Certificate Manager:
   ```bash
   aws acm request-certificate \
     --domain-name example.com \
     --validation-method DNS \
     --region us-east-1
   ```

3. Add the validation CNAME records to your DNS provider.

4. Update your CDK stack to use the custom domain:
   ```typescript
   const webApp = new ServerlessWebAppConstruct(this, 'MyWebApp', {
     domainName: 'example.com',
     certificateArn: 'arn:aws:acm:us-east-1:123456789012:certificate/12345678-1234-1234-1234-123456789012',
     enableLogging: true
   });
   ```

5. Deploy the updated stack:
   ```bash
   cdk deploy
   ```

6. Create a CNAME record in your DNS provider pointing your domain to the CloudFront distribution domain name.

## Step 9: Monitor and Troubleshoot

1. View CloudWatch logs for Lambda functions:
   ```bash
   aws logs describe-log-groups --log-group-name-prefix /aws/lambda/MyServerlessAppStack
   ```

2. View specific log events:
   ```bash
   aws logs get-log-events --log-group-name /aws/lambda/MyServerlessAppStack-MyWebAppgetprofile --log-stream-name <log-stream-name>
   ```

3. Monitor API Gateway:
   ```bash
   aws apigateway get-resources --rest-api-id <api-id>
   ```

## Step 10: Clean Up

To remove all resources created by the stack:

```bash
cdk destroy
```

## Advanced Configuration

### Adding DynamoDB Integration

1. Update your CDK stack to include DynamoDB:
   ```typescript
   import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';

   // Create a DynamoDB table
   const table = new dynamodb.Table(this, 'UsersTable', {
     partitionKey: { name: 'userId', type: dynamodb.AttributeType.STRING },
     billingMode: dynamodb.BillingMode.PAY_PER_REQUEST
   });

   // Add API resource with DynamoDB integration
   const usersFunction = webApp.addResource({
     path: '/users',
     lambdaSourcePath: './lambda/users',
     requiresAuth: true,
     environment: {
       TABLE_NAME: table.tableName
     }
   });

   // Grant permissions
   table.grantReadWriteData(usersFunction);
   ```

2. Create a Lambda function that uses DynamoDB:
   ```javascript
   // lambda/users/index.js
   const AWS = require('aws-sdk');
   const dynamodb = new AWS.DynamoDB.DocumentClient();

   exports.handler = async (event) => {
     const tableName = process.env.TABLE_NAME;
     const claims = event.requestContext.authorizer?.claims || {};
     const userId = claims.sub;

     try {
       const result = await dynamodb.get({
         TableName: tableName,
         Key: { userId }
       }).promise();

       return {
         statusCode: 200,
         headers: {
           'Content-Type': 'application/json',
           'Access-Control-Allow-Origin': '*'
         },
         body: JSON.stringify({
           user: result.Item || { userId }
         })
       };
     } catch (error) {
       return {
         statusCode: 500,
         headers: {
           'Content-Type': 'application/json',
           'Access-Control-Allow-Origin': '*'
         },
         body: JSON.stringify({
           error: 'Failed to retrieve user data',
           message: error.message
         })
       };
     }
   };
   ```

### Security Validation

To validate the security configuration of your serverless web app:

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