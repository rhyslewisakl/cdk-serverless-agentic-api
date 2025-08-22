# Deployment Guide

This guide covers deploying the React Cloudscape Example Application to AWS.

## 📋 Prerequisites

- AWS CLI configured with appropriate permissions
- AWS CDK v2 installed globally
- Node.js 18+ and npm
- Domain name (optional, for custom domain)

## 🏗️ Infrastructure Deployment

### 1. Deploy Backend Infrastructure

```bash
# Navigate to the main CDK project
cd cdk-serverless-agentic-api

# Install dependencies
npm install

# Bootstrap CDK (first time only)
cdk bootstrap

# Deploy the stack
cdk deploy
```

### 2. Note the Outputs

After deployment, note these important outputs:
- **CloudFront Distribution URL**: Your application URL
- **Cognito User Pool ID**: For authentication
- **API Gateway URL**: Backend API endpoint

## 🚀 Frontend Deployment

### 1. Build the Application

```bash
cd examples/react-example-app-cloudscape/frontend
npm install
npm run build
```

### 2. Upload to S3

The build artifacts are automatically uploaded to the S3 bucket created by the CDK stack.

### 3. Verify Deployment

1. Open the CloudFront URL in your browser
2. You should see the login page
3. Register a new account to test the flow

## 🌐 Custom Domain Setup (Optional)

### 1. Request SSL Certificate

```bash
# Request certificate in us-east-1 (required for CloudFront)
aws acm request-certificate \
  --domain-name yourdomain.com \
  --validation-method DNS \
  --region us-east-1
```

### 2. Update CDK Stack

```typescript
// In your CDK stack
const webApp = new CDKServerlessAgenticAPI(this, 'MyWebApp', {
  domainName: 'yourdomain.com',
  certificateArn: 'arn:aws:acm:us-east-1:123456789012:certificate/...'
});
```

### 3. Redeploy

```bash
cdk deploy
```

### 4. Update DNS

Point your domain's DNS to the CloudFront distribution.

## 🔧 Environment Configuration

### Development Environment

```bash
# Start local development server
npm run dev
```

The development server will proxy API calls to your deployed backend.

### Production Environment

The production build is optimized with:
- Code splitting for better caching
- Minified assets
- Gzip compression
- CDN distribution

## 📊 Monitoring Setup

### 1. CloudWatch Dashboards

Monitor your application with CloudWatch:
- API Gateway metrics
- Lambda function performance
- DynamoDB usage
- CloudFront cache hit rates

### 2. Error Tracking

Set up error tracking:
- CloudWatch Logs for Lambda functions
- Browser error reporting
- API error monitoring

## 🔐 Security Configuration

### 1. Cognito Settings

Configure Cognito User Pool:
- Password policies
- MFA settings (optional)
- User attributes
- Email verification

### 2. API Security

Ensure API security:
- CORS configuration
- Authentication on all protected endpoints
- Rate limiting (if needed)

### 3. CloudFront Security

Configure CloudFront:
- HTTPS redirect
- Security headers
- Origin access control

## 🚀 CI/CD Pipeline (Optional)

### GitHub Actions Example

```yaml
name: Deploy React App

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          
      - name: Install dependencies
        run: |
          cd examples/react-example-app-cloudscape/frontend
          npm install
          
      - name: Build application
        run: |
          cd examples/react-example-app-cloudscape/frontend
          npm run build
          
      - name: Deploy to AWS
        run: |
          # Upload to S3 and invalidate CloudFront
          aws s3 sync dist/ s3://your-bucket-name --delete
          aws cloudfront create-invalidation --distribution-id YOUR_DISTRIBUTION_ID --paths "/*"
        env:
          AWS_ACCESS_KEY_ID: ${{ secrets.AWS_ACCESS_KEY_ID }}
          AWS_SECRET_ACCESS_KEY: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
```

## 🧪 Testing Deployment

### 1. Smoke Tests

After deployment, verify:
- [ ] Application loads without errors
- [ ] User registration works
- [ ] Email confirmation works
- [ ] Login/logout functions
- [ ] CRUD operations work
- [ ] Responsive design on mobile

### 2. Performance Tests

Check performance:
- [ ] Page load times < 3 seconds
- [ ] Bundle sizes are optimized
- [ ] CDN cache hit rates > 80%
- [ ] API response times < 500ms

## 🔄 Updates and Maintenance

### 1. Application Updates

To update the application:
```bash
# Build new version
npm run build

# Deploy automatically uploads to S3
# CloudFront cache will be invalidated
```

### 2. Infrastructure Updates

To update infrastructure:
```bash
# Update CDK code
# Then redeploy
cdk deploy
```

### 3. Rollback Strategy

If issues occur:
1. Revert to previous S3 version
2. Invalidate CloudFront cache
3. Monitor for resolution

## 🆘 Troubleshooting

### Common Issues

**1. CORS Errors**
- Check API Gateway CORS configuration
- Verify allowed origins include your domain

**2. Authentication Issues**
- Verify Cognito configuration
- Check JWT token expiration
- Confirm API Gateway authorizer setup

**3. 404 Errors on Refresh**
- Ensure CloudFront has proper error page configuration
- Check S3 bucket routing rules

**4. Slow Loading**
- Verify CloudFront cache settings
- Check bundle sizes
- Monitor CDN performance

### Debug Commands

```bash
# Check CloudFront distribution
aws cloudfront get-distribution --id YOUR_DISTRIBUTION_ID

# Check S3 bucket contents
aws s3 ls s3://your-bucket-name --recursive

# Check API Gateway
aws apigateway get-rest-apis

# Check Cognito User Pool
aws cognito-idp describe-user-pool --user-pool-id YOUR_POOL_ID
```

## 📞 Support

For deployment issues:
1. Check AWS CloudWatch logs
2. Review CDK deployment outputs
3. Verify all prerequisites are met
4. Consult AWS documentation
5. Open a support ticket if needed