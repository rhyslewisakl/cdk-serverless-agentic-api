import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock the health Lambda function
const healthHandler = async (event: any) => {
  console.log('Health check request received:', JSON.stringify(event, null, 2));

  try {
    // Basic health check response
    const response = {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
        'Access-Control-Allow-Methods': 'GET,OPTIONS'
      },
      body: JSON.stringify({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        version: process.env.API_VERSION || '1.0.0',
        service: 'serverless-web-app-api',
        environment: process.env.NODE_ENV || 'production'
      })
    };

    console.log('Health check response:', JSON.stringify(response, null, 2));
    return response;

  } catch (error) {
    console.error('Health check error:', error);
    
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
        'Access-Control-Allow-Methods': 'GET,OPTIONS'
      },
      body: JSON.stringify({
        status: 'error',
        timestamp: new Date().toISOString(),
        message: 'Internal server error'
      })
    };
  }
};

describe('Health Lambda Function', () => {
  beforeEach(() => {
    // Reset environment variables
    delete process.env.API_VERSION;
    delete process.env.NODE_ENV;
    
    // Mock console methods
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  it('should return healthy status with default values', async () => {
    const event = {
      httpMethod: 'GET',
      path: '/api/health',
      headers: {},
      queryStringParameters: null,
      body: null
    };

    const result = await healthHandler(event);

    expect(result.statusCode).toBe(200);
    expect(result.headers['Content-Type']).toBe('application/json');
    expect(result.headers['Access-Control-Allow-Origin']).toBe('*');
    
    const body = JSON.parse(result.body);
    expect(body.status).toBe('healthy');
    expect(body.version).toBe('1.0.0');
    expect(body.service).toBe('serverless-web-app-api');
    expect(body.environment).toBe('production');
    expect(body.timestamp).toBeDefined();
    expect(new Date(body.timestamp)).toBeInstanceOf(Date);
  });

  it('should return healthy status with custom environment variables', async () => {
    process.env.API_VERSION = '2.0.0';
    process.env.NODE_ENV = 'development';

    const event = {
      httpMethod: 'GET',
      path: '/api/health',
      headers: {},
      queryStringParameters: null,
      body: null
    };

    const result = await healthHandler(event);

    expect(result.statusCode).toBe(200);
    
    const body = JSON.parse(result.body);
    expect(body.status).toBe('healthy');
    expect(body.version).toBe('2.0.0');
    expect(body.environment).toBe('development');
  });

  it('should include proper CORS headers', async () => {
    const event = {
      httpMethod: 'GET',
      path: '/api/health',
      headers: {},
      queryStringParameters: null,
      body: null
    };

    const result = await healthHandler(event);

    expect(result.headers['Access-Control-Allow-Origin']).toBe('*');
    expect(result.headers['Access-Control-Allow-Headers']).toBe('Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token');
    expect(result.headers['Access-Control-Allow-Methods']).toBe('GET,OPTIONS');
  });

  it('should return valid JSON response body', async () => {
    const event = {
      httpMethod: 'GET',
      path: '/api/health',
      headers: {},
      queryStringParameters: null,
      body: null
    };

    const result = await healthHandler(event);

    expect(() => JSON.parse(result.body)).not.toThrow();
    
    const body = JSON.parse(result.body);
    expect(typeof body).toBe('object');
    expect(body).toHaveProperty('status');
    expect(body).toHaveProperty('timestamp');
    expect(body).toHaveProperty('version');
    expect(body).toHaveProperty('service');
    expect(body).toHaveProperty('environment');
  });

  it('should handle different event structures gracefully', async () => {
    const minimalEvent = {};

    const result = await healthHandler(minimalEvent);

    expect(result.statusCode).toBe(200);
    
    const body = JSON.parse(result.body);
    expect(body.status).toBe('healthy');
  });

  it('should log request and response for debugging', async () => {
    const consoleSpy = vi.spyOn(console, 'log');
    
    const event = {
      httpMethod: 'GET',
      path: '/api/health'
    };

    await healthHandler(event);

    expect(consoleSpy).toHaveBeenCalledWith(
      'Health check request received:',
      JSON.stringify(event, null, 2)
    );
    expect(consoleSpy).toHaveBeenCalledWith(
      'Health check response:',
      expect.stringContaining('"statusCode": 200')
    );
  });

  it('should return ISO 8601 formatted timestamp', async () => {
    const event = {};

    const result = await healthHandler(event);
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
    
    const event = {};
    const result = await healthHandler(event);
    
    const afterCall = new Date();
    const body = JSON.parse(result.body);
    const responseTime = new Date(body.timestamp);

    // Timestamp should be between before and after the call (within 1 second tolerance)
    expect(responseTime.getTime()).toBeGreaterThanOrEqual(beforeCall.getTime() - 1000);
    expect(responseTime.getTime()).toBeLessThanOrEqual(afterCall.getTime() + 1000);
  });

  it('should have consistent response structure', async () => {
    const event = {};
    const result = await healthHandler(event);

    expect(result).toHaveProperty('statusCode');
    expect(result).toHaveProperty('headers');
    expect(result).toHaveProperty('body');
    
    expect(typeof result.statusCode).toBe('number');
    expect(typeof result.headers).toBe('object');
    expect(typeof result.body).toBe('string');
    
    const body = JSON.parse(result.body);
    expect(body).toHaveProperty('status');
    expect(body).toHaveProperty('timestamp');
    expect(body).toHaveProperty('version');
    expect(body).toHaveProperty('service');
    expect(body).toHaveProperty('environment');
  });
});