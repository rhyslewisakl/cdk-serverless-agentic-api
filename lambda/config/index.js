/**
 * Config Lambda function
 * 
 * Returns public configuration information needed by frontend applications
 * such as Cognito User Pool ID, Client ID, and API endpoints.
 * 
 * This endpoint is unauthenticated to allow frontend setup before authentication.
 * It dynamically looks up Cognito resources to avoid circular dependencies.
 */

// Import AWS SDK v3
const { CognitoIdentityProviderClient, ListUserPoolsCommand, ListUserPoolClientsCommand } = require('@aws-sdk/client-cognito-identity-provider');

// CORS headers for all responses
const CORS_HEADERS = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Requested-With',
  'Access-Control-Allow-Methods': 'GET,OPTIONS',
  'Access-Control-Allow-Credentials': 'true',
  'Access-Control-Max-Age': '86400'
};

// Get the AWS region
const region = process.env.AWS_REGION || 'us-east-1';

// Initialize Cognito client
const cognitoClient = new CognitoIdentityProviderClient({ region });

/**
 * Finds the user pool ID by listing user pools and matching by name prefix
 * @param {string} stackName - The stack name to match against user pool names
 * @returns {Promise<string|null>} - The user pool ID or null if not found
 */
async function findUserPoolId(stackName) {
  try {
    // List user pools with a reasonable limit
    const command = new ListUserPoolsCommand({ MaxResults: 60 });
    const response = await cognitoClient.send(command);

    // Find user pool that matches our stack name pattern
    const userPool = response.UserPools.find(pool =>
      pool.Name.startsWith(stackName) ||
      pool.Name.includes(stackName)
    );

    return userPool ? userPool.Id : null;
  } catch (error) {
    console.error('Error finding user pool:', error);
    return null;
  }
}

/**
 * Finds the user pool client ID for a given user pool
 * @param {string} userPoolId - The user pool ID
 * @returns {Promise<string|null>} - The client ID or null if not found
 */
async function findUserPoolClientId(userPoolId) {
  try {
    // List clients for the user pool
    const command = new ListUserPoolClientsCommand({
      UserPoolId: userPoolId,
      MaxResults: 60
    });
    const response = await cognitoClient.send(command);

    // Get the first client (typically there's only one for our use case)
    const client = response.UserPoolClients[0];
    return client ? client.ClientId : null;
  } catch (error) {
    console.error('Error finding user pool client:', error);
    return null;
  }
}

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
    // Extract stack name from Lambda function ARN or use a default
    const stackName = process.env.AWS_LAMBDA_FUNCTION_NAME?.split('-').slice(0, -2).join('-') || 'ServerlessAgenticApi';

    // Look up Cognito resources dynamically
    const userPoolId = await findUserPoolId(stackName);
    const userPoolClientId = userPoolId ? await findUserPoolClientId(userPoolId) : null;
    const cognitoDomain = userPoolId ? `${userPoolId}.auth.${region}.amazoncognito.com` : null;

    // Build configuration
    const config = {
      auth: {
        region: region,
        userPoolId: userPoolId,
        userPoolWebClientId: userPoolClientId,
        oauth: {
          domain: cognitoDomain,
          scope: ['email', 'profile', 'openid'],
          redirectSignIn: process.env.REDIRECT_URL || '',
          redirectSignOut: process.env.REDIRECT_URL || '',
          responseType: 'code'
        }
      },
      // API endpoint information removed - frontend should determine this dynamically
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