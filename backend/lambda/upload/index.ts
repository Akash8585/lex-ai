import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb';
import { randomUUID } from 'crypto';

// Initialize AWS clients
const s3Client = new S3Client({ region: process.env.AWS_REGION });
const dynamoDbClient = new DynamoDBClient({ region: process.env.AWS_REGION });
const docClient = DynamoDBDocumentClient.from(dynamoDbClient);

// Environment variables
const BUCKET_NAME = process.env.BUCKET_NAME!;
const TABLE_NAME = process.env.TABLE_NAME!;

interface UploadRequest {
  filename: string;
  file_data: string;
  content_type?: string;
}

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  console.log('Upload function triggered:', JSON.stringify(event, null, 2));

  try {
    // Parse request body
    const body: UploadRequest = event.body 
      ? JSON.parse(event.body) 
      : event as unknown as UploadRequest;

    const { filename, file_data, content_type = 'application/pdf' } = body;

    if (!file_data) {
      return createResponse(400, { error: 'No file data provided' });
    }

    // Generate unique contract ID
    const contractId = randomUUID();
    
    // Decode base64 file content
    let fileBuffer: Buffer;
    try {
      fileBuffer = Buffer.from(file_data, 'base64');
    } catch (error) {
      console.error('Base64 decode error:', error);
      return createResponse(400, { error: 'Invalid base64 file data' });
    }

    // Create S3 key
    const fileExtension = filename.split('.').pop()?.toLowerCase() || 'pdf';
    const s3Key = `contracts/${contractId}/${contractId}.${fileExtension}`;

    // Upload file to S3
    try {
      const putObjectCommand = new PutObjectCommand({
        Bucket: BUCKET_NAME,
        Key: s3Key,
        Body: fileBuffer,
        ContentType: content_type,
        Metadata: {
          contract_id: contractId,
          original_filename: filename,
          uploaded_at: new Date().toISOString(),
        },
      });

      await s3Client.send(putObjectCommand);
      console.log(`Successfully uploaded file to S3: ${s3Key}`);
    } catch (error) {
      console.error('S3 upload error:', error);
      return createResponse(500, { error: `Failed to upload file: ${error}` });
    }

    // Store metadata in DynamoDB
    try {
      const putCommand = new PutCommand({
        TableName: TABLE_NAME,
        Item: {
          contract_id: contractId,
          filename,
          s3_key: s3Key,
          content_type,
          file_size: fileBuffer.length,
          status: 'uploaded',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      });

      await docClient.send(putCommand);
      console.log(`Successfully stored metadata in DynamoDB for contract: ${contractId}`);
    } catch (error) {
      console.error('DynamoDB error:', error);
      
      // Try to cleanup S3 file if DynamoDB fails
      try {
        const { DeleteObjectCommand } = await import('@aws-sdk/client-s3');
        await s3Client.send(new DeleteObjectCommand({
          Bucket: BUCKET_NAME,
          Key: s3Key,
        }));
      } catch (cleanupError) {
        console.error('Failed to cleanup S3 file:', cleanupError);
      }
      
      return createResponse(500, { error: `Failed to store metadata: ${error}` });
    }

    // Return success response
    return createResponse(200, {
      contract_id: contractId,
      status: 'uploaded',
      filename,
      s3_key: s3Key,
      message: 'Contract uploaded successfully',
    });

  } catch (error) {
    console.error('Unexpected error:', error);
    return createResponse(500, { error: `Internal server error: ${error}` });
  }
};

function createResponse(statusCode: number, body: any): APIGatewayProxyResult {
  return {
    statusCode,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  };
} 