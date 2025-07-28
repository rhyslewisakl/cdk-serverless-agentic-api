#!/bin/bash

# React Example App Infrastructure Deployment Script
# This script deploys the CDK infrastructure for the React example application

set -e

echo "🚀 Deploying React Example App Infrastructure..."

# Check if AWS CLI is configured
if ! aws sts get-caller-identity > /dev/null 2>&1; then
    echo "❌ AWS CLI is not configured. Please run 'aws configure' first."
    exit 1
fi

# Check if CDK is bootstrapped
echo "📋 Checking CDK bootstrap status..."
if ! aws cloudformation describe-stacks --stack-name CDKToolkit > /dev/null 2>&1; then
    echo "⚠️  CDK is not bootstrapped. Running bootstrap..."
    npx cdk bootstrap
fi

# Build the TypeScript code
echo "🔨 Building TypeScript code..."
npm run build

# Deploy the stack
echo "🚀 Deploying CDK stack..."
npx cdk deploy --require-approval never

# Get stack outputs
echo "📋 Stack outputs:"
aws cloudformation describe-stacks \
    --stack-name ReactExampleAppStack \
    --query 'Stacks[0].Outputs[*].[OutputKey,OutputValue]' \
    --output table

echo "✅ Deployment complete!"
echo ""
echo "Next steps:"
echo "1. Note the CloudFront URL and S3 bucket name from the outputs above"
echo "2. Configure the frontend with these values"
echo "3. Build and deploy the frontend to the S3 bucket"