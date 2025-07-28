# React Example App Frontend

This is the React frontend application that demonstrates the capabilities of the `cdk-serverless-agentic-api` construct. It provides a complete user interface for authentication and CRUD operations.

## Features

- User authentication with AWS Cognito
- Responsive React UI with TypeScript
- CRUD operations on user items
- Error handling and user feedback
- Integration with AWS services

## Prerequisites

- Node.js 18 or later
- Deployed infrastructure (see `../infrastructure/`)

## Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure AWS Amplify:**
   After deploying the infrastructure, you'll need to configure the frontend with the output values from the CDK deployment.

## Development

1. **Start development server:**
   ```bash
   npm start
   ```
   
   The app will open at [http://localhost:3000](http://localhost:3000)

2. **Run tests:**
   ```bash
   npm test
   ```

3. **Build for production:**
   ```bash
   npm run build
   ```

## Deployment

After building the infrastructure and getting the S3 bucket name:

1. **Build the application:**
   ```bash
   npm run build
   ```

2. **Deploy to S3:**
   ```bash
   export S3_BUCKET_NAME=your-bucket-name
   npm run deploy
   ```

## Project Structure

```
src/
├── components/     # React components
├── services/       # API and authentication services
├── types/          # TypeScript type definitions
├── utils/          # Utility functions
├── App.tsx         # Main application component
└── index.tsx       # Application entry point
```

## Configuration

The application will be configured to connect to:
- Cognito User Pool for authentication
- API Gateway for backend operations
- DynamoDB for data storage (via API)

Configuration details will be added in subsequent implementation tasks.

## Available Scripts

- `npm start`: Start development server
- `npm test`: Run test suite
- `npm run build`: Build for production
- `npm run deploy`: Deploy to S3 (requires S3_BUCKET_NAME env var)

## Next Steps

This is the initial project structure. The following components will be implemented in subsequent tasks:

1. Authentication components and flows
2. CRUD interface components
3. API service integration
4. Error handling and user feedback
5. Testing suite
6. Performance optimizations

## Troubleshooting

### Common Issues

1. **CORS Errors**: Ensure API Gateway CORS is properly configured
2. **Authentication Issues**: Verify Cognito configuration matches frontend setup
3. **Build Errors**: Check TypeScript configuration and dependencies

### Development Tips

- Use React Developer Tools for debugging
- Check browser console for error messages
- Verify network requests in browser DevTools