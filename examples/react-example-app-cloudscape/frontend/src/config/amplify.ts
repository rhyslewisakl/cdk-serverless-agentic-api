import { Amplify } from 'aws-amplify';

// Configuration will be loaded from the API config endpoint
export const configureAmplify = async () => {
  try {
    // Get configuration from the API config endpoint
    const response = await fetch('/api/config');
    const config = await response.json();
    
    Amplify.configure({
      Auth: {
        Cognito: {
          userPoolId: config.auth.userPoolId,
          userPoolClientId: config.auth.userPoolWebClientId,
          loginWith: {
            oauth: {
              domain: config.auth.oauth.domain,
              scopes: config.auth.oauth.scope,
              redirectSignIn: [window.location.origin],
              redirectSignOut: [window.location.origin],
              responseType: config.auth.oauth.responseType,
            },
            email: true,
          },
        },
      },
      API: {
        REST: {
          api: {
            endpoint: config.api.endpoints[0].endpoint,
            region: config.auth.region,
          },
        },
      },
    });
    
    return config;
  } catch (error) {
    console.error('Failed to configure Amplify:', error);
    throw error;
  }
};