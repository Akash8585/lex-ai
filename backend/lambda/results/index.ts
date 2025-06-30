import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand, ScanCommand } from '@aws-sdk/lib-dynamodb';

// Initialize AWS clients
const dynamoDbClient = new DynamoDBClient({ region: process.env.AWS_REGION });
const docClient = DynamoDBDocumentClient.from(dynamoDbClient);

// Environment variables
const TABLE_NAME = process.env.TABLE_NAME!;

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  console.log('Results function triggered:', JSON.stringify(event, null, 2));

  try {
    // Get HTTP method and path parameters
    const httpMethod = event.httpMethod || 'GET';
    const pathParameters = event.pathParameters || {};
    const queryStringParameters = event.queryStringParameters || {};
    
    const contractId = pathParameters.contract_id;
    
    if (contractId) {
      // Get specific contract
      return await getContractAnalysis(contractId);
    } else {
      // List contracts with optional filtering
      const limit = parseInt(queryStringParameters.limit || '20', 10);
      const statusFilter = queryStringParameters.status;
      return await listContracts(limit, statusFilter);
    }
    
  } catch (error) {
    console.error('Unexpected error:', error);
    return createResponse(500, { error: `Internal server error: ${error}` });
  }
};

async function getContractAnalysis(contractId: string): Promise<APIGatewayProxyResult> {
  try {
    const getCommand = new GetCommand({
      TableName: TABLE_NAME,
      Key: { contract_id: contractId },
    });

    const response = await docClient.send(getCommand);
    
    if (!response.Item) {
      return createResponse(404, { error: 'Contract not found' });
    }

    const contract = response.Item;
    
    // Check if analysis is complete
    if (contract.status === 'uploaded') {
      return createResponse(202, {
        contract_id: contractId,
        status: 'uploaded',
        message: 'Contract uploaded but analysis not started',
      });
    } else if (contract.status === 'analyzing') {
      return createResponse(202, {
        contract_id: contractId,
        status: 'analyzing',
        message: 'Analysis in progress',
      });
    } else if (contract.status !== 'completed') {
      return createResponse(500, {
        contract_id: contractId,
        status: contract.status || 'unknown',
        error: 'Analysis failed or status unknown',
      });
    }

    // Return complete analysis
    const analysisResult = {
      contract_id: contractId,
      filename: contract.filename,
      status: contract.status,
      created_at: contract.created_at,
      analyzed_at: contract.analyzed_at,
      analysis: contract.analysis || {},
    };

    return createResponse(200, analysisResult);
    
  } catch (error) {
    console.error('DynamoDB error:', error);
    return createResponse(500, { error: `Failed to retrieve contract: ${error}` });
  }
}

async function listContracts(limit: number = 20, statusFilter?: string): Promise<APIGatewayProxyResult> {
  try {
    const scanParams: any = {
      TableName: TABLE_NAME,
      Limit: Math.min(limit, 100), // Cap at 100
      ProjectionExpression: 'contract_id, filename, #status, created_at, analyzed_at, file_size',
      ExpressionAttributeNames: { '#status': 'status' },
    };

    if (statusFilter) {
      scanParams.FilterExpression = '#status = :status';
      scanParams.ExpressionAttributeValues = { ':status': statusFilter };
    }

    const scanCommand = new ScanCommand(scanParams);
    const response = await docClient.send(scanCommand);
    const contracts = response.Items || [];

    // Sort by created_at descending
    contracts.sort((a, b) => {
      const aDate = new Date(a.created_at || '').getTime();
      const bDate = new Date(b.created_at || '').getTime();
      return bDate - aDate;
    });

    // Add summary statistics
    const totalContracts = contracts.length;
    const completedContracts = contracts.filter(c => c.status === 'completed').length;
    const analyzingContracts = contracts.filter(c => c.status === 'analyzing').length;

    return createResponse(200, {
      contracts,
      summary: {
        total: totalContracts,
        completed: completedContracts,
        analyzing: analyzingContracts,
        uploaded: totalContracts - completedContracts - analyzingContracts,
      },
      pagination: {
        limit,
        has_more: 'LastEvaluatedKey' in response,
      },
    });
    
  } catch (error) {
    console.error('DynamoDB scan error:', error);
    return createResponse(500, { error: `Failed to list contracts: ${error}` });
  }
}

function createResponse(statusCode: number, body: any): APIGatewayProxyResult {
  return {
    statusCode,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  };
} 