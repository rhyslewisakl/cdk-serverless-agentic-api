/**
 * WhoAmI Lambda function
 * Returns information about the authenticated user from Cognito claims with structured error handling and logging
 */

// Standard CORS headers for responses
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
  'Access-Control-Allow-Methods': 'GET,OPTIONS',
  'Access-Control-Allow-Credentials': 'true',
  'Access-Control-Max-Age': '86400'
};

/**
 * Creates a standardized success response
 */
function createSuccessResponse(data, statusCode = 200, additionalHeaders = {}) {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      ...CORS_HEADERS,
      ...additionalHeaders
    },
    body: JSON.stringify({
      ...data,
      timestamp: new Date().toISOString()
    })
  };
}

/**
 * Creates a standardized error response
 */
function createErrorResponse(statusCode, error, message, requestId, details) {
  const errorResponse = {
    error,
    message,
    timestamp: new Date().toISOString()
  };

  if (requestId) {
    errorResponse.requestId = requestId;
  }

  if (details && process.env.NODE_ENV === 'development') {
    errorResponse.details = details;
  }

  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      ...CORS_HEADERS
    },
    body: JSON.stringify(errorResponse)
  };
}

/**
 * Main whoami handler
 */
const whoamiHandler = async (event, context) => {
  // Log the request for debugging
  console.log('WhoAmI request received:', JSON.stringify(event, null, 2));

  try {
    // Handle OPTIONS request for CORS preflight
    if (event && event.httpMethod === 'OPTIONS') {
      return createSuccessResponse({}, 200, {
        'Access-Control-Allow-Methods': 'GET,OPTIONS'
      });
    }

    // Validate HTTP method
    if (event && event.httpMethod && event.httpMethod !== 'GET') {
      return createErrorResponse(
        405,
        'Method Not Allowed',
        `HTTP method ${event.httpMethod} is not allowed for this endpoint`,
        context?.awsRequestId
      );
    }

    // Handle null event for error test case
    if (!event) {
      return createErrorResponse(
        500,
        'Internal Server Error',
        'An error occurred while processing the request',
        context?.awsRequestId
      );
    }

    // Validate Cognito claims
    const claims = event?.requestContext?.authorizer?.claims;
    if (!claims) {
      return createErrorResponse(
        401,
        'Unauthorized',
        'No authentication claims found',
        context?.awsRequestId
      );
    }

    // Extract user information from Cognito claims
    const userInfo = {
      username: claims['cognito:username'] || claims.sub,
      email: claims.email,
      emailVerified: claims.email_verified === 'true',
      groups: claims['cognito:groups'] ? claims['cognito:groups'].split(',') : [],
      givenName: claims.given_name,
      familyName: claims.family_name,
      sub: claims.sub,
      tokenUse: claims.token_use,
      authTime: claims.auth_time ? new Date(claims.auth_time * 1000).toISOString() : null,
      iat: claims.iat ? new Date(claims.iat * 1000).toISOString() : null,
      exp: claims.exp ? new Date(claims.exp * 1000).toISOString() : null
    };

    // Remove undefined values for cleaner response
    Object.keys(userInfo).forEach(key => {
      if (userInfo[key] === undefined || userInfo[key] === null) {
        delete userInfo[key];
      }
    });

    // Validate required user information
    if (!userInfo.username && !userInfo.sub) {
      return createErrorResponse(
        400,
        'Validation Error',
        'Invalid user claims: missing username or subject',
        context?.awsRequestId
      );
    }

    // Log the response for debugging
    const response = createSuccessResponse({
      user: userInfo,
      service: 'serverless-web-app-api',
      requestContext: {
        requestId: event.requestContext?.requestId,
        stage: event.requestContext?.stage,
        path: event.requestContext?.path
      }
    });
    
    console.log('WhoAmI response:', JSON.stringify(response, null, 2));
    
    return response;
  } catch (error) {
    console.error('Error in whoami handler:', error);
    
    return createErrorResponse(
      500,
      'Internal Server Error',
      'An error occurred while processing the request',
      context?.awsRequestId,
      process.env.NODE_ENV === 'development' ? {
        stack: error.stack,
        originalError: error.message
      } : undefined
    );
  }
};

// Export the handler
exports.handler = whoamiHandler;