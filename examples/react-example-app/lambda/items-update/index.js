const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, UpdateCommand, GetCommand } = require('@aws-sdk/lib-dynamodb');

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

exports.handler = async (event) => {
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type,Authorization',
    'Access-Control-Allow-Methods': 'PUT,OPTIONS'
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

    const body = JSON.parse(event.body || '{}');
    const { title, description, category, priority, status } = body;

    const updateExpression = [];
    const expressionAttributeValues = {};
    const expressionAttributeNames = {};

    if (title !== undefined) {
      updateExpression.push('#title = :title');
      expressionAttributeNames['#title'] = 'title';
      expressionAttributeValues[':title'] = title;
    }
    if (description !== undefined) {
      updateExpression.push('description = :description');
      expressionAttributeValues[':description'] = description;
    }
    if (category !== undefined) {
      updateExpression.push('category = :category');
      expressionAttributeValues[':category'] = category;
    }
    if (priority !== undefined) {
      updateExpression.push('priority = :priority');
      expressionAttributeValues[':priority'] = priority;
    }
    if (status !== undefined) {
      updateExpression.push('#status = :status');
      expressionAttributeNames['#status'] = 'status';
      expressionAttributeValues[':status'] = status;
    }

    updateExpression.push('updatedAt = :updatedAt');
    expressionAttributeValues[':updatedAt'] = new Date().toISOString();

    const result = await docClient.send(new UpdateCommand({
      TableName: process.env.USER_ITEMS_TABLE_NAME,
      Key: { id: itemId },
      UpdateExpression: `SET ${updateExpression.join(', ')}`,
      ExpressionAttributeValues: expressionAttributeValues,
      ExpressionAttributeNames: Object.keys(expressionAttributeNames).length > 0 ? expressionAttributeNames : undefined,
      ReturnValues: 'ALL_NEW'
    }));

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(result.Attributes)
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