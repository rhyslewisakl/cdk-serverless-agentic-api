const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, QueryCommand } = require('@aws-sdk/lib-dynamodb');

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

exports.handler = async (event) => {
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type,Authorization',
    'Access-Control-Allow-Methods': 'GET,OPTIONS'
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

    const params = {
      TableName: process.env.USER_ITEMS_TABLE_NAME,
      IndexName: process.env.USER_ITEMS_GSI_NAME,
      KeyConditionExpression: 'userId = :userId',
      ExpressionAttributeValues: {
        ':userId': userId
      },
      ScanIndexForward: false
    };

    const result = await docClient.send(new QueryCommand(params));

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        items: result.Items || [],
        count: result.Count || 0
      })
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