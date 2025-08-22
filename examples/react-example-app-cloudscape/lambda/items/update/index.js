const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, UpdateCommand, GetCommand } = require('@aws-sdk/lib-dynamodb');

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

exports.handler = async (event) => {
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
    'Access-Control-Allow-Methods': 'PUT,OPTIONS'
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

    const body = JSON.parse(event.body || '{}');
    const { title, description, category, status } = body;

    const updateExpression = [];
    const expressionAttributeValues = {};
    const expressionAttributeNames = {};

    if (title) {
      updateExpression.push('#title = :title');
      expressionAttributeNames['#title'] = 'title';
      expressionAttributeValues[':title'] = title;
    }

    if (description) {
      updateExpression.push('description = :description');
      expressionAttributeValues[':description'] = description;
    }

    if (category) {
      updateExpression.push('category = :category');
      expressionAttributeValues[':category'] = category;
    }

    if (status) {
      updateExpression.push('#status = :status');
      expressionAttributeNames['#status'] = 'status';
      expressionAttributeValues[':status'] = status;
    }

    updateExpression.push('updatedAt = :updatedAt');
    expressionAttributeValues[':updatedAt'] = new Date().toISOString();

    const updateParams = {
      TableName: process.env.ITEMS_TABLE_NAME,
      Key: { userId, itemId },
      UpdateExpression: `SET ${updateExpression.join(', ')}`,
      ExpressionAttributeValues: expressionAttributeValues,
      ExpressionAttributeNames: Object.keys(expressionAttributeNames).length > 0 ? expressionAttributeNames : undefined,
      ReturnValues: 'ALL_NEW'
    };

    const result = await docClient.send(new UpdateCommand(updateParams));

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ item: result.Attributes })
    };
  } catch (error) {
    console.error('Error updating item:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Internal server error' })
    };
  }
};