/**
 * Example Lambda function for an authenticated API endpoint
 */
exports.handler = async (event) => {
  console.log('Profile function invoked with event:', JSON.stringify(event));
  
  // Extract user information from Cognito authorizer
  const claims = event.requestContext.authorizer?.claims || {};
  const userId = claims.sub || 'unknown';
  const email = claims.email || 'unknown';
  const emailVerified = claims.email_verified === 'true';
  
  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
      'Access-Control-Allow-Methods': 'GET,OPTIONS'
    },
    body: JSON.stringify({
      message: 'Profile information retrieved successfully',
      user: {
        id: userId,
        email: email,
        emailVerified: emailVerified,
        lastAccessed: new Date().toISOString()
      }
    })
  };
};