/**
 * Authentication Lambda functions
 * Handles password change operations with Cognito integration
 */

import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import { 
  CognitoIdentityProviderClient, 
  ChangePasswordCommand,
  ChangePasswordCommandInput
} from '@aws-sdk/client-cognito-identity-provider';

let cognitoClient: CognitoIdentityProviderClient;

function getCognitoClient(): CognitoIdentityProviderClient {
  if (!cognitoClient) {
    cognitoClient = new CognitoIdentityProviderClient({
      region: process.env.AWS_REGION || 'us-east-1',
    });
  }
  return cognitoClient;
}

// For testing purposes
export function setCognitoClient(client: CognitoIdentityProviderClient): void {
  cognitoClient = client;
}

/**
 * Extract access token from Authorization header
 */
function getAccessTokenFromEvent(event: APIGatewayProxyEvent): string | null {
  try {
    const authHeader = event.headers.Authorization || event.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }
    return authHeader.substring(7); // Remove 'Bearer ' prefix
  } catch (error) {
    console.error('Error extracting access token:', error);
    return null;
  }
}

/**
 * Create standardized API response
 */
function createResponse(statusCode: number, body: any, headers: Record<string, string> = {}): APIGatewayProxyResult {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
      'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
      ...headers
    },
    body: JSON.stringify(body)
  };
}

/**
 * Create error response
 */
function createErrorResponse(statusCode: number, message: string, error?: any): APIGatewayProxyResult {
  const errorBody = {
    error: 'Authentication Error',
    message,
    timestamp: new Date().toISOString(),
    requestId: error?.requestId
  };

  if (error?.details) {
    errorBody.details = error.details;
  }

  return createResponse(statusCode, errorBody);
}

/**
 * Validate password change request
 */
function validatePasswordChangeRequest(body: any): { previousPassword: string; proposedPassword: string } | null {
  if (!body || typeof body !== 'object') {
    return null;
  }

  if (!body.previousPassword || typeof body.previousPassword !== 'string') {
    return null;
  }

  if (!body.proposedPassword || typeof body.proposedPassword !== 'string') {
    return null;
  }

  // Basic password validation
  if (body.proposedPassword.length < 8) {
    return null;
  }

  return {
    previousPassword: body.previousPassword,
    proposedPassword: body.proposedPassword
  };
}

/**
 * Map Cognito errors to HTTP status codes and user-friendly messages
 */
function mapCognitoError(error: any): { statusCode: number; message: string } {
  const errorName = error.name || error.code;
  
  switch (errorName) {
    case 'NotAuthorizedException':
      if (error.message?.includes('Incorrect username or password')) {
        return { statusCode: 400, message: 'Current password is incorrect' };
      }
      return { statusCode: 401, message: 'Authentication failed' };
    
    case 'InvalidPasswordException':
      return { statusCode: 400, message: 'New password does not meet requirements' };
    
    case 'LimitExceededException':
      return { statusCode: 429, message: 'Too many password change attempts. Please try again later' };
    
    case 'UserNotFoundException':
      return { statusCode: 404, message: 'User not found' };
    
    case 'UserNotConfirmedException':
      return { statusCode: 400, message: 'User account is not confirmed' };
    
    case 'PasswordResetRequiredException':
      return { statusCode: 400, message: 'Password reset is required' };
    
    case 'InvalidParameterException':
      return { statusCode: 400, message: 'Invalid request parameters' };
    
    case 'TooManyRequestsException':
      return { statusCode: 429, message: 'Too many requests. Please try again later' };
    
    default:
      console.error('Unmapped Cognito error:', errorName, error.message);
      return { statusCode: 500, message: 'Internal server error' };
  }
}

/**
 * POST /api/auth/change-password - Change user password
 */
export async function changePassword(event: APIGatewayProxyEvent, context: Context): Promise<APIGatewayProxyResult> {
  try {
    // Extract access token from Authorization header
    const accessToken = getAccessTokenFromEvent(event);
    if (!accessToken) {
      return createErrorResponse(401, 'Authorization header with Bearer token is required');
    }

    if (!event.body) {
      return createErrorResponse(400, 'Request body is required');
    }

    let requestBody;
    try {
      requestBody = JSON.parse(event.body);
    } catch (error) {
      return createErrorResponse(400, 'Invalid JSON in request body');
    }

    const passwordRequest = validatePasswordChangeRequest(requestBody);
    if (!passwordRequest) {
      return createErrorResponse(400, 'Invalid request body. Required fields: previousPassword, proposedPassword (minimum 8 characters)');
    }

    // Call Cognito to change password
    const changePasswordParams: ChangePasswordCommandInput = {
      AccessToken: accessToken,
      PreviousPassword: passwordRequest.previousPassword,
      ProposedPassword: passwordRequest.proposedPassword
    };

    await getCognitoClient().send(new ChangePasswordCommand(changePasswordParams));

    // Return success response
    return createResponse(200, {
      message: 'Password changed successfully',
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('Error changing password:', error);
    
    // Map Cognito-specific errors
    const { statusCode, message } = mapCognitoError(error);
    return createErrorResponse(statusCode, message, error);
  }
}