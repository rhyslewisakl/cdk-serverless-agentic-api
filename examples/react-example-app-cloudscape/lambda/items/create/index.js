const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand } = require('@aws-sdk/lib-dynamodb');
const { randomUUID } = require('crypto');

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

exports.handler = async (event) => {
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
    'Access-Control-Allow-Methods': 'POST,OPTIONS'
  };

  try {
    // Extract user ID from Cognito claims
    const userId = event.requestContext.authorizer.claims.sub;
    
    if (!userId) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ error: 'Unauthorized' })
      };
    }

    const body = JSON.parse(event.body || '{}');
    const { title, description, category, status = 'active' } = body;

    if (!title || !description) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Title and description are required' })
      };
    }

    const itemId = randomUUID();
    const now = new Date().toISOString();

    const item = {
      userId,
      itemId,
      title,
      description,
      category: category || 'general',
      status,
      createdAt: now,
      updatedAt: now
    };

    const params = {
      TableName: process.env.ITEMS_TABLE_NAME,
      Item: item
    };

    await docClient.send(new PutCommand(params));

    return {
      statusCode: 201,
      headers,
      body: JSON.stringify({ item })
    };
  } catch (error) {
    console.error('Error creating item:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Internal server error' })
    };
  }
};