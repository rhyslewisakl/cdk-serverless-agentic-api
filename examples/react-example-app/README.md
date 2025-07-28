# React Example Application

This is a comprehensive example application demonstrating the full capabilities of the cdk-serverless-agentic-api construct. It showcases authentication workflows, API integration, and CRUD operations on a DynamoDB table.

## Project Structure

```
react-example-app/
├── frontend/          # React application
├── infrastructure/    # CDK infrastructure code
└── README.md         # This file
```

## Quick Start

1. **Deploy Infrastructure:**
   ```bash
   cd infrastructure
   npm install
   npm run deploy
   ```

2. **Start Frontend:**
   ```bash
   cd frontend
   npm install
   npm start
   ```

## Features

- User authentication with AWS Cognito
- CRUD operations on DynamoDB
- Responsive React UI
- Serverless architecture
- Error handling and user feedback
- Comprehensive testing

## Requirements

- Node.js 18+
- AWS CLI configured
- CDK CLI installed

For detailed setup and deployment instructions, see the documentation in each folder.