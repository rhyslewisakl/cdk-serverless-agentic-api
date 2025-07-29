const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, DeleteCommand, GetCommand } = require('@aws-sdk/lib-dynamodb');

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

exports.handler = async (event) => {
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type,Authorization',
    'Access-Control-Allow-Methods': 'DELETE,OPTIONS'
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

    const itemId = event.pathParameters?.id;
    if (!itemId) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Item ID is required' })
      };
    }

    // Check if item exists and belongs to user
    const getResult = await docClient.send(new GetCommand({
      TableName: process.env.USER_ITEMS_TABLE_NAME,
      Key: { id: itemId }
    }));

    if (!getResult.Item || getResult.Item.userId !== userId) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ error: 'Item not found' })
      };
    }

    await docClient.send(new DeleteCommand({
      TableName: process.env.USER_ITEMS_TABLE_NAME,
      Key: { id: itemId }
    }));

    return {
      statusCode: 204,
      headers,
      body: ''
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