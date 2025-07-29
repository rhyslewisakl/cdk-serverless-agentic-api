const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand } = require('@aws-sdk/lib-dynamodb');
const { randomUUID } = require('crypto');

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

exports.handler = async (event) => {
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type,Authorization',
    'Access-Control-Allow-Methods': 'POST,OPTIONS'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    const userId = event.requestContext?.authorizer?.claims?.sub;
    if (!userId) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ error: 'Unauthorized' })
      };
    }

    const body = JSON.parse(event.body || '{}');
    const { title, description, category = 'Personal', priority = 1 } = body;

    if (!title) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Title is required' })
      };
    }

    const item = {
      id: randomUUID(),
      userId,
      title,
      description: description || '',
      category,
      priority,
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    await docClient.send(new PutCommand({
      TableName: process.env.USER_ITEMS_TABLE_NAME,
      Item: item
    }));

    return {
      statusCode: 201,
      headers,
      body: JSON.stringify(item)
    };
  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Internal server error' })
    };
  }
};