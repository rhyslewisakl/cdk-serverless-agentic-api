/**
 * Config Lambda function
 * 
 * Returns public configuration information needed by frontend applications
 * such as Cognito User Pool ID, Client ID, and API endpoints.
 * 
 * This endpoint is unauthenticated to allow frontend setup before authentication.
 */

// CORS headers for all responses
const CORS_HEADERS = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Requested-With',
  'Access-Control-Allow-Methods': 'GET,OPTIONS',
  'Access-Control-Allow-Credentials': 'true',
  'Access-Control-Max-Age': '86400'
};

exports.handler = async (event) => {
  // Handle OPTIONS requests for CORS
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: CORS_HEADERS,
      body: ''
    };
  }

  // Only allow GET requests
  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      headers: CORS_HEADERS,
      body: JSON.stringify({
        error: 'Method Not Allowed',
        message: 'Only GET requests are supported'
      })
    };
  }

  try {
    // Get configuration from environment variables
    const config = {
      auth: {
        region: process.env.AWS_REGION || 'us-east-1',
        userPoolId: process.env.USER_POOL_ID,
        userPoolWebClientId: process.env.USER_POOL_CLIENT_ID,
        oauth: {
          domain: process.env.COGNITO_DOMAIN,
          scope: ['email', 'profile', 'openid'],
          redirectSignIn: process.env.REDIRECT_URL || '',
          redirectSignOut: process.env.REDIRECT_URL || '',
          responseType: 'code'
        }
      },
      api: {
        endpoints: [
          {
            name: 'api',
            endpoint: process.env.API_URL,
            region: process.env.AWS_REGION || 'us-east-1'
          }
        ]
      },
      version: process.env.API_VERSION || '1.0.0'
    };

    return {
      statusCode: 200,
      headers: CORS_HEADERS,
      body: JSON.stringify(config)
    };
  } catch (error) {
    console.error('Error generating config:', error);
    
    return {
      statusCode: 500,
      headers: CORS_HEADERS,
      body: JSON.stringify({
        error: 'Internal Server Error',
        message: 'Failed to generate configuration'
      })
    };
  }
};