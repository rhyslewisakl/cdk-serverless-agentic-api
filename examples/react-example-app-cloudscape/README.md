# React Cloudscape Example Application

A React TypeScript application demonstrating the CDK Serverless Agentic API construct with AWS Cloudscape Design System.

## Features

- **Authentication**: Complete Cognito user management (signup, login, email confirmation, password change)
- **CRUD Operations**: Full item management with DynamoDB integration
- **Modern UI**: AWS Cloudscape Design System components
- **State Management**: Redux Toolkit for application state
- **TypeScript**: Full type safety throughout the application

## Project Structure

```
├── frontend/                 # React application
│   ├── src/
│   │   ├── components/      # Reusable components
│   │   │   ├── auth/       # Authentication components
│   │   │   ├── items/      # Item management components
│   │   │   ├── layout/     # Layout components
│   │   │   └── common/     # Common UI components
│   │   ├── pages/          # Page components
│   │   ├── store/          # Redux store and slices
│   │   ├── services/       # API services
│   │   ├── types/          # TypeScript type definitions
│   │   └── utils/          # Utility functions
├── infrastructure/          # CDK infrastructure
└── lambda/                 # Lambda function source code
```

## Getting Started

### Prerequisites

- Node.js 18+ 
- AWS CLI configured
- AWS CDK v2

### Installation

1. Install dependencies:
   ```bash
   cd frontend
   npm install
   ```

2. Deploy infrastructure:
   ```bash
   cd infrastructure
   npm install
   npm run deploy
   ```

3. Start development server:
   ```bash
   cd frontend
   npm run dev
   ```

### Production Deployment

1. Build the frontend:
   ```bash
   cd frontend
   npm run build
   ```

2. Get the S3 bucket name from CDK outputs:
   ```bash
   aws cloudformation describe-stacks --stack-name CloudscapeExampleStack --query "Stacks[0].Outputs[?OutputKey=='BucketName'].OutputValue" --output text
   ```

3. Sync built files to S3:
   ```bash
   export DEPLOYMENT_BUCKET="your-bucket-name-from-step-2"
   aws s3 sync dist/ s3://$DEPLOYMENT_BUCKET --delete
   ```

4. Access your application via the CloudFront URL from CDK outputs

## Development

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
- `npm run type-check` - Run TypeScript type checking

## Architecture

This application demonstrates:

- **Frontend**: React + TypeScript + Cloudscape + Redux Toolkit
- **Backend**: AWS Lambda + API Gateway + DynamoDB
- **Authentication**: AWS Cognito User Pools
- **Infrastructure**: AWS CDK construct

## License

MIT License - see the main project LICENSE file for details.