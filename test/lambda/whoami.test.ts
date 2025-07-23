import { describe, it, expect, beforeEach, vi } from 'vitest';

// Import the actual whoami handler for testing
const { handler: whoamiHandler } = require('../../lambda/whoami/index.js');

describe('WhoAmI Lambda Function', () => {
  beforeEach(() => {
    // Reset environment variables
    delete process.env.API_VERSION;
    delete process.env.NODE_ENV;
    
    // Mock console methods
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  it('should return user information when valid Cognito claims are provided', async () => {
    const event = {
      httpMethod: 'GET',
      path: '/api/whoami',
      headers: {
        Authorization: 'Bearer valid-jwt-token'
      },
      requestContext: {
        authorizer: {
          claims: {
            'cognito:username': 'testuser',
            'sub': '12345678-1234-1234-1234-123456789012',
            'email': 'test@example.com',
            'email_verified': 'true',
            'cognito:groups': 'user,admin',
            'given_name': 'Test',
            'family_name': 'User',
            'token_use': 'access',
            'auth_time': '1640995200',
            'iat': '1640995200',
            'exp': '1641081600'
          }
        }
      },
      queryStringParameters: null,
      body: null
    };

    const result = await whoamiHandler(event);

    expect(result.statusCode).toBe(200);
    expect(result.headers['Content-Type']).toBe('application/json');
    expect(result.headers['Access-Control-Allow-Origin']).toBe('*');
    
    const body = JSON.parse(result.body);
    expect(body.user).toBeDefined();
    expect(body.user.username).toBe('testuser');
    expect(body.user.email).toBe('test@example.com');
    expect(body.user.emailVerified).toBe(true);
    expect(body.user.groups).toEqual(['user', 'admin']);
    expect(body.user.givenName).toBe('Test');
    expect(body.user.familyName).toBe('User');
    expect(body.user.sub).toBe('12345678-1234-1234-1234-123456789012');
    expect(body.user.tokenUse).toBe('access');
    expect(body.timestamp).toBeDefined();
    expect(body.service).toBe('serverless-web-app-api');
  });

  it('should handle minimal Cognito claims correctly', async () => {
    const event = {
      httpMethod: 'GET',
      path: '/api/whoami',
      requestContext: {
        authorizer: {
          claims: {
            'sub': '12345678-1234-1234-1234-123456789012',
            'email': 'minimal@example.com'
          }
        }
      }
    };

    const result = await whoamiHandler(event);

    expect(result.statusCode).toBe(200);
    
    const body = JSON.parse(result.body);
    expect(body.user.username).toBe('12345678-1234-1234-1234-123456789012'); // Falls back to sub
    expect(body.user.email).toBe('minimal@example.com');
    expect(body.user.groups).toEqual([]); // Empty array when no groups
    expect(body.user.sub).toBe('12345678-1234-1234-1234-123456789012');
  });

  it('should return 401 when no Cognito claims are present', async () => {
    const event = {
      httpMethod: 'GET',
      path: '/api/whoami',
      requestContext: {
        // No authorizer claims
      }
    };

    const result = await whoamiHandler(event);

    expect(result.statusCode).toBe(401);
    expect(result.headers['Content-Type']).toBe('application/json');
    
    const body = JSON.parse(result.body);
    expect(body.error).toBe('Unauthorized');
    expect(body.message).toBe('No authentication claims found');
    expect(body.timestamp).toBeDefined();
  });

  it('should return 401 when requestContext is missing', async () => {
    const event = {
      httpMethod: 'GET',
      path: '/api/whoami'
      // No requestContext
    };

    const result = await whoamiHandler(event);

    expect(result.statusCode).toBe(401);
    
    const body = JSON.parse(result.body);
    expect(body.error).toBe('Unauthorized');
    expect(body.message).toBe('No authentication claims found');
  });

  it('should handle email_verified as string correctly', async () => {
    const event = {
      requestContext: {
        authorizer: {
          claims: {
            'sub': '12345678-1234-1234-1234-123456789012',
            'email': 'test@example.com',
            'email_verified': 'false'
          }
        }
      }
    };

    const result = await whoamiHandler(event);

    expect(result.statusCode).toBe(200);
    
    const body = JSON.parse(result.body);
    expect(body.user.emailVerified).toBe(false);
  });

  it('should parse groups string correctly', async () => {
    const event = {
      requestContext: {
        authorizer: {
          claims: {
            'sub': '12345678-1234-1234-1234-123456789012',
            'cognito:groups': 'admin,moderator,user'
          }
        }
      }
    };

    const result = await whoamiHandler(event);

    expect(result.statusCode).toBe(200);
    
    const body = JSON.parse(result.body);
    expect(body.user.groups).toEqual(['admin', 'moderator', 'user']);
  });

  it('should handle single group correctly', async () => {
    const event = {
      requestContext: {
        authorizer: {
          claims: {
            'sub': '12345678-1234-1234-1234-123456789012',
            'cognito:groups': 'admin'
          }
        }
      }
    };

    const result = await whoamiHandler(event);

    expect(result.statusCode).toBe(200);
    
    const body = JSON.parse(result.body);
    expect(body.user.groups).toEqual(['admin']);
  });

  it('should convert timestamp fields to ISO strings', async () => {
    const event = {
      requestContext: {
        authorizer: {
          claims: {
            'sub': '12345678-1234-1234-1234-123456789012',
            'auth_time': '1640995200',
            'iat': '1640995200',
            'exp': '1641081600'
          }
        }
      }
    };

    const result = await whoamiHandler(event);

    expect(result.statusCode).toBe(200);
    
    const body = JSON.parse(result.body);
    expect(body.user.authTime).toBe('2022-01-01T00:00:00.000Z');
    expect(body.user.iat).toBe('2022-01-01T00:00:00.000Z');
    expect(body.user.exp).toBe('2022-01-02T00:00:00.000Z');
  });

  it('should include proper CORS headers', async () => {
    const event = {
      requestContext: {
        authorizer: {
          claims: {
            'sub': '12345678-1234-1234-1234-123456789012'
          }
        }
      }
    };

    const result = await whoamiHandler(event);

    expect(result.headers['Access-Control-Allow-Origin']).toBe('*');
    expect(result.headers['Access-Control-Allow-Headers']).toBe('Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token');
    expect(result.headers['Access-Control-Allow-Methods']).toBe('GET,OPTIONS');
  });

  it('should remove undefined values from user object', async () => {
    const event = {
      requestContext: {
        authorizer: {
          claims: {
            'sub': '12345678-1234-1234-1234-123456789012',
            'email': 'test@example.com'
            // Many fields will be undefined
          }
        }
      }
    };

    const result = await whoamiHandler(event);

    expect(result.statusCode).toBe(200);
    
    const body = JSON.parse(result.body);
    const userKeys = Object.keys(body.user);
    
    // Should not contain undefined values
    userKeys.forEach(key => {
      expect(body.user[key]).not.toBeUndefined();
    });
    
    // Should contain the defined values
    expect(body.user.sub).toBe('12345678-1234-1234-1234-123456789012');
    expect(body.user.email).toBe('test@example.com');
  });

  it('should handle errors gracefully and return 500', async () => {
    // Mock an error by providing invalid event structure that causes parsing to fail
    const event = null;

    const result = await whoamiHandler(event);

    expect(result.statusCode).toBe(500);
    expect(result.headers['Content-Type']).toBe('application/json');
    
    const body = JSON.parse(result.body);
    expect(body.error).toBe('Internal Server Error');
    expect(body.message).toBe('An error occurred while processing the request');
    expect(body.timestamp).toBeDefined();
  });

  it('should log request and response for debugging', async () => {
    const consoleSpy = vi.spyOn(console, 'log');
    
    const event = {
      requestContext: {
        authorizer: {
          claims: {
            'sub': '12345678-1234-1234-1234-123456789012'
          }
        }
      }
    };

    await whoamiHandler(event);

    expect(consoleSpy).toHaveBeenCalledWith(
      'WhoAmI request received:',
      JSON.stringify(event, null, 2)
    );
    expect(consoleSpy).toHaveBeenCalledWith(
      'WhoAmI response:',
      expect.stringContaining('"statusCode": 200')
    );
  });

  it('should return ISO 8601 formatted timestamp', async () => {
    const event = {
      requestContext: {
        authorizer: {
          claims: {
            'sub': '12345678-1234-1234-1234-123456789012'
          }
        }
      }
    };

    const result = await whoamiHandler(event);
    const body = JSON.parse(result.body);

    // Check if timestamp is in ISO 8601 format
    const timestampRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;
    expect(body.timestamp).toMatch(timestampRegex);
    
    // Check if timestamp is a valid date
    const date = new Date(body.timestamp);
    expect(date.toISOString()).toBe(body.timestamp);
  });

  it('should return current timestamp within reasonable time window', async () => {
    const beforeCall = new Date();
    
    const event = {
      requestContext: {
        authorizer: {
          claims: {
            'sub': '12345678-1234-1234-1234-123456789012'
          }
        }
      }
    };
    
    const result = await whoamiHandler(event);
    
    const afterCall = new Date();
    const body = JSON.parse(result.body);
    const responseTime = new Date(body.timestamp);

    // Timestamp should be between before and after the call (within 1 second tolerance)
    expect(responseTime.getTime()).toBeGreaterThanOrEqual(beforeCall.getTime() - 1000);
    expect(responseTime.getTime()).toBeLessThanOrEqual(afterCall.getTime() + 1000);
  });

  it('should have consistent response structure for success', async () => {
    const event = {
      requestContext: {
        authorizer: {
          claims: {
            'sub': '12345678-1234-1234-1234-123456789012'
          }
        }
      }
    };
    
    const result = await whoamiHandler(event);

    expect(result).toHaveProperty('statusCode');
    expect(result).toHaveProperty('headers');
    expect(result).toHaveProperty('body');
    
    expect(typeof result.statusCode).toBe('number');
    expect(typeof result.headers).toBe('object');
    expect(typeof result.body).toBe('string');
    
    const body = JSON.parse(result.body);
    expect(body).toHaveProperty('user');
    expect(body).toHaveProperty('timestamp');
    expect(body).toHaveProperty('service');
    expect(typeof body.user).toBe('object');
  });

  it('should have consistent response structure for errors', async () => {
    const event = {
      requestContext: {}
    };
    
    const result = await whoamiHandler(event);

    expect(result).toHaveProperty('statusCode');
    expect(result).toHaveProperty('headers');
    expect(result).toHaveProperty('body');
    
    const body = JSON.parse(result.body);
    expect(body).toHaveProperty('error');
    expect(body).toHaveProperty('message');
    expect(body).toHaveProperty('timestamp');
  });
});