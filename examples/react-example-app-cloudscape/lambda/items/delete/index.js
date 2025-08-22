const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, DeleteCommand, GetCommand } = require('@aws-sdk/lib-dynamodb');

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

exports.handler = async (event) => {
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
    'Access-Control-Allow-Methods': 'DELETE,OPTIONS'
  };

  try {
    // Extract user ID from Cognito claims
    const userId = event.requestContext.authorizer.claims.sub;
    const itemId = event.pathParameters?.itemId;
    
    if (!userId) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ error: 'Unauthorized' })
      };
    }

    if (!itemId) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Item ID is required' })
      };
    }

    // Check if item exists and belongs to user
    const getParams = {
      TableName: process.env.ITEMS_TABLE_NAME,
      Key: { userId, itemId }
    };

    const existingItem = await docClient.send(new GetCommand(getParams));
    
    if (!existingItem.Item) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ error: 'Item not found' })
      };
    }

    const deleteParams = {
      TableName: process.env.ITEMS_TABLE_NAME,
      Key: { userId, itemId }
    };

    await docClient.send(new DeleteCommand(deleteParams));

    return {
      statusCode: 204,
      headers,
      body: ''
    };
  } catch (error) {
    console.error('Error deleting item:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Internal server error' })
    };
  }
};