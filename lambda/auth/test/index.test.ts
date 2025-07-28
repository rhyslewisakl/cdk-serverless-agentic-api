/**
 * Unit tests for Authentication Lambda functions
 * Tests password change operations with Cognito integration
 */

import { describe, it, expect, beforeEach, vi, Mock } from 'vitest';
import { APIGatewayProxyEvent, Context } from 'aws-lambda';
import * as authHandler from '../index';
import { CognitoIdentityProviderClient, ChangePasswordCommand } from '@aws-sdk/client-cognito-identity-provider';

describe('Authentication Lambda Functions', () => {
  let mockCognitoClient: {
    send: Mock;
  };

  const mockContext: Context = {
    callbackWaitsForEmptyEventLoop: false,
    functionName: 'test-function',
    functionVersion: '1',
    invokedFunctionArn: 'arn:aws:lambda:us-east-1:123456789012:function:test-function',
    memoryLimitInMB: '128',
    awsRequestId: 'test-request-id',
    logGroupName: '/aws/lambda/test-function',
    logStreamName: '2023/01/01/[$LATEST]test-stream',
    getRemainingTimeInMillis: () => 30000,
    done: vi.fn(),
    fail: vi.fn(),
    succeed: vi.fn()
  };

  const createMockEvent = (overrides: Partial<APIGatewayProxyEvent> = {}): APIGatewayProxyEvent => ({
    body: null,
    headers: {
      Authorization: 'Bearer test-access-token'
    },
    multiValueHeaders: {},
    httpMethod: 'POST',
    isBase64Encoded: false,
    path: '/api/auth/change-password',
    pathParameters: null,
    queryStringParameters: null,
    multiValueQueryStringParameters: null,
    stageVariables: null,
    requestContext: {
      accountId: '123456789012',
      apiId: 'test-api',
      authorizer: {
        claims: {
          sub: 'user-123',
          email: 'test@example.com'
        }
      },
      httpMethod: 'POST',
      identity: {
        accessKey: null,
        accountId: null,
        apiKey: null,
        apiKeyId: null,
        caller: null,
        cognitoAuthenticationProvider: null,
        cognitoAuthenticationType: null,
        cognitoIdentityId: null,
        cognitoIdentityPoolId: null,
        principalOrgId: null,
        sourceIp: '127.0.0.1',
        user: null,
        userAgent: 'test-agent',
        userArn: null,
        clientCert: null
      },
      path: '/api/auth/change-password',
      protocol: 'HTTP/1.1',
      requestId: 'test-request-id',
      requestTime: '01/Jan/2023:00:00:00 +0000',
      requestTimeEpoch: 1672531200,
      resourceId: 'test-resource',
      resourcePath: '/api/auth/change-password',
      stage: 'test'
    },
    resource: '/api/auth/change-password',
    ...overrides
  });

  beforeEach(() => {
    vi.clearAllMocks();
    
    mockCognitoClient = {
      send: vi.fn()
    };

    // Set the mock client for testing
    authHandler.setCognitoClient(mockCognitoClient as any);
  });

  describe('changePassword', () => {
    it('should change password successfully', async () => {
      mockCognitoClient.send.mockResolvedValueOnce({});

      const event = createMockEvent({
        body: JSON.stringify({
          previousPassword: 'oldPassword123',
          proposedPassword: 'newPassword123'
        })
      });

      const result = await authHandler.changePassword(event, mockContext);

      expect(result.statusCode).toBe(200);
      const responseBody = JSON.parse(result.body);
      expect(responseBody.message).toBe('Password changed successfully');
      expect(responseBody.timestamp).toBeDefined();
      
      expect(mockCognitoClient.send).toHaveBeenCalledWith(expect.any(ChangePasswordCommand));
      const callArgs = mockCognitoClient.send.mock.calls[0][0];
      expect(callArgs.input).toMatchObject({
        AccessToken: 'test-access-token',
        PreviousPassword: 'oldPassword123',
        ProposedPassword: 'newPassword123'
      });
    });

    it('should return 401 if Authorization header is missing', async () => {
      const event = createMockEvent({
        headers: {},
        body: JSON.stringify({
          previousPassword: 'oldPassword123',
          proposedPassword: 'newPassword123'
        })
      });

      const result = await authHandler.changePassword(event, mockContext);

      expect(result.statusCode).toBe(401);
      expect(JSON.parse(result.body).message).toBe('Authorization header with Bearer token is required');
      expect(mockCognitoClient.send).not.toHaveBeenCalled();
    });

    it('should return 401 if Authorization header is malformed', async () => {
      const event = createMockEvent({
        headers: {
          Authorization: 'InvalidToken'
        },
        body: JSON.stringify({
          previousPassword: 'oldPassword123',
          proposedPassword: 'newPassword123'
        })
      });

      const result = await authHandler.changePassword(event, mockContext);

      expect(result.statusCode).toBe(401);
      expect(JSON.parse(result.body).message).toBe('Authorization header with Bearer token is required');
      expect(mockCognitoClient.send).not.toHaveBeenCalled();
    });

    it('should return 400 if request body is missing', async () => {
      const event = createMockEvent({
        body: null
      });

      const result = await authHandler.changePassword(event, mockContext);

      expect(result.statusCode).toBe(400);
      expect(JSON.parse(result.body).message).toBe('Request body is required');
      expect(mockCognitoClient.send).not.toHaveBeenCalled();
    });

    it('should return 400 if JSON is invalid', async () => {
      const event = createMockEvent({
        body: 'invalid json'
      });

      const result = await authHandler.changePassword(event, mockContext);

      expect(result.statusCode).toBe(400);
      expect(JSON.parse(result.body).message).toBe('Invalid JSON in request body');
      expect(mockCognitoClient.send).not.toHaveBeenCalled();
    });

    it('should return 400 if previousPassword is missing', async () => {
      const event = createMockEvent({
        body: JSON.stringify({
          proposedPassword: 'newPassword123'
        })
      });

      const result = await authHandler.changePassword(event, mockContext);

      expect(result.statusCode).toBe(400);
      expect(JSON.parse(result.body).message).toContain('Invalid request body');
      expect(mockCognitoClient.send).not.toHaveBeenCalled();
    });

    it('should return 400 if proposedPassword is missing', async () => {
      const event = createMockEvent({
        body: JSON.stringify({
          previousPassword: 'oldPassword123'
        })
      });

      const result = await authHandler.changePassword(event, mockContext);

      expect(result.statusCode).toBe(400);
      expect(JSON.parse(result.body).message).toContain('Invalid request body');
      expect(mockCognitoClient.send).not.toHaveBeenCalled();
    });

    it('should return 400 if proposedPassword is too short', async () => {
      const event = createMockEvent({
        body: JSON.stringify({
          previousPassword: 'oldPassword123',
          proposedPassword: 'short'
        })
      });

      const result = await authHandler.changePassword(event, mockContext);

      expect(result.statusCode).toBe(400);
      expect(JSON.parse(result.body).message).toContain('minimum 8 characters');
      expect(mockCognitoClient.send).not.toHaveBeenCalled();
    });

    it('should handle NotAuthorizedException for incorrect password', async () => {
      const error = new Error('Incorrect username or password');
      error.name = 'NotAuthorizedException';
      mockCognitoClient.send.mockRejectedValueOnce(error);

      const event = createMockEvent({
        body: JSON.stringify({
          previousPassword: 'wrongPassword',
          proposedPassword: 'newPassword123'
        })
      });

      const result = await authHandler.changePassword(event, mockContext);

      expect(result.statusCode).toBe(400);
      expect(JSON.parse(result.body).message).toBe('Current password is incorrect');
    });

    it('should handle InvalidPasswordException', async () => {
      const error = new Error('Password does not meet requirements');
      error.name = 'InvalidPasswordException';
      mockCognitoClient.send.mockRejectedValueOnce(error);

      const event = createMockEvent({
        body: JSON.stringify({
          previousPassword: 'oldPassword123',
          proposedPassword: 'weakpass'
        })
      });

      const result = await authHandler.changePassword(event, mockContext);

      expect(result.statusCode).toBe(400);
      expect(JSON.parse(result.body).message).toBe('New password does not meet requirements');
    });

    it('should handle LimitExceededException', async () => {
      const error = new Error('Too many attempts');
      error.name = 'LimitExceededException';
      mockCognitoClient.send.mockRejectedValueOnce(error);

      const event = createMockEvent({
        body: JSON.stringify({
          previousPassword: 'oldPassword123',
          proposedPassword: 'newPassword123'
        })
      });

      const result = await authHandler.changePassword(event, mockContext);

      expect(result.statusCode).toBe(429);
      expect(JSON.parse(result.body).message).toBe('Too many password change attempts. Please try again later');
    });

    it('should handle UserNotFoundException', async () => {
      const error = new Error('User not found');
      error.name = 'UserNotFoundException';
      mockCognitoClient.send.mockRejectedValueOnce(error);

      const event = createMockEvent({
        body: JSON.stringify({
          previousPassword: 'oldPassword123',
          proposedPassword: 'newPassword123'
        })
      });

      const result = await authHandler.changePassword(event, mockContext);

      expect(result.statusCode).toBe(404);
      expect(JSON.parse(result.body).message).toBe('User not found');
    });

    it('should handle TooManyRequestsException', async () => {
      const error = new Error('Too many requests');
      error.name = 'TooManyRequestsException';
      mockCognitoClient.send.mockRejectedValueOnce(error);

      const event = createMockEvent({
        body: JSON.stringify({
          previousPassword: 'oldPassword123',
          proposedPassword: 'newPassword123'
        })
      });

      const result = await authHandler.changePassword(event, mockContext);

      expect(result.statusCode).toBe(429);
      expect(JSON.parse(result.body).message).toBe('Too many requests. Please try again later');
    });

    it('should handle unknown Cognito errors', async () => {
      const error = new Error('Unknown error');
      error.name = 'UnknownException';
      mockCognitoClient.send.mockRejectedValueOnce(error);

      const event = createMockEvent({
        body: JSON.stringify({
          previousPassword: 'oldPassword123',
          proposedPassword: 'newPassword123'
        })
      });

      const result = await authHandler.changePassword(event, mockContext);

      expect(result.statusCode).toBe(500);
      expect(JSON.parse(result.body).message).toBe('Internal server error');
    });

    it('should handle case-insensitive Authorization header', async () => {
      mockCognitoClient.send.mockResolvedValueOnce({});

      const event = createMockEvent({
        headers: {
          authorization: 'Bearer test-access-token' // lowercase
        },
        body: JSON.stringify({
          previousPassword: 'oldPassword123',
          proposedPassword: 'newPassword123'
        })
      });

      const result = await authHandler.changePassword(event, mockContext);

      expect(result.statusCode).toBe(200);
      expect(mockCognitoClient.send).toHaveBeenCalledWith(expect.any(ChangePasswordCommand));
    });
  });
});