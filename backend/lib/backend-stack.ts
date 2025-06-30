import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as s3deploy from 'aws-cdk-lib/aws-s3-deployment';
import { Duration } from 'aws-cdk-lib';

export class BackendStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // S3 bucket for contract storage and frontend hosting
    const lexBucket = new s3.Bucket(this, 'LexBucket', {
      bucketName: `lex-contracts-${this.account}-${Math.random().toString(36).substring(7)}`,
      publicReadAccess: false,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      cors: [{
        allowedMethods: [
          s3.HttpMethods.GET,
          s3.HttpMethods.POST,
          s3.HttpMethods.PUT,
          s3.HttpMethods.DELETE
        ],
        allowedOrigins: ['*'],
        allowedHeaders: ['*'],
      }],
      versioned: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    // DynamoDB table for contract metadata and analysis results
    const contractsTable = new dynamodb.Table(this, 'LexContracts', {
      tableName: 'lex-contracts',
      partitionKey: { 
        name: 'contract_id', 
        type: dynamodb.AttributeType.STRING 
      },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      pointInTimeRecovery: true,
    });

    // Lambda execution role with necessary permissions
    const lambdaRole = new iam.Role(this, 'LexLambdaRole', {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole'),
      ],
      inlinePolicies: {
        LexPermissions: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: [
                's3:GetObject',
                's3:PutObject',
                's3:DeleteObject',
                's3:GeneratePresignedUrl'
              ],
              resources: [
                lexBucket.bucketArn,
                `${lexBucket.bucketArn}/*`
              ],
            }),
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: [
                'dynamodb:GetItem',
                'dynamodb:PutItem',
                'dynamodb:UpdateItem',
                'dynamodb:DeleteItem',
                'dynamodb:Query',
                'dynamodb:Scan'
              ],
              resources: [contractsTable.tableArn],
            }),
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: [
                'bedrock:InvokeModel',
                'bedrock:InvokeModelWithResponseStream'
              ],
              resources: [
                `arn:aws:bedrock:${this.region}::foundation-model/anthropic.claude-3-sonnet-20240229-v1:0`,
                `arn:aws:bedrock:${this.region}::foundation-model/anthropic.claude-3-haiku-20240307-v1:0`
              ],
            }),
          ],
        }),
      },
    });

    // Upload Lambda function
    const uploadFunction = new NodejsFunction(this, 'LexUploadFunction', {
      entry: 'lambda/upload/index.ts',
      runtime: lambda.Runtime.NODEJS_20_X,
      role: lambdaRole,
      timeout: Duration.seconds(30),
      memorySize: 512,
      bundling: {
        externalModules: ['@aws-sdk/*'],
      },
      environment: {
        BUCKET_NAME: lexBucket.bucketName,
        TABLE_NAME: contractsTable.tableName,
      },
    });

    // Analysis Lambda function
    const analyzeFunction = new NodejsFunction(this, 'LexAnalyzeFunction', {
      entry: 'lambda/analyze/index.ts',
      runtime: lambda.Runtime.NODEJS_20_X,
      role: lambdaRole,
      timeout: Duration.seconds(300), // 5 minutes for AI analysis
      memorySize: 1024,
      bundling: {
        externalModules: ['@aws-sdk/*'],
      },
      environment: {
        BUCKET_NAME: lexBucket.bucketName,
        TABLE_NAME: contractsTable.tableName,
      },
    });

    // Results Lambda function
    const resultsFunction = new NodejsFunction(this, 'LexResultsFunction', {
      entry: 'lambda/results/index.ts',
      runtime: lambda.Runtime.NODEJS_20_X,
      role: lambdaRole,
      timeout: Duration.seconds(30),
      memorySize: 256,
      bundling: {
        externalModules: ['@aws-sdk/*'],
      },
      environment: {
        BUCKET_NAME: lexBucket.bucketName,
        TABLE_NAME: contractsTable.tableName,
      },
    });

    // API Gateway
    const lexApi = new apigateway.RestApi(this, 'LexApi', {
      restApiName: 'Lex Contract Reviewer API',
      description: 'API for Lex AI Contract Reviewer',
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
        allowHeaders: ['Content-Type', 'X-Amz-Date', 'Authorization', 'X-Api-Key'],
      },
    });

    // API Gateway integrations
    const uploadIntegration = new apigateway.LambdaIntegration(uploadFunction, {
      requestTemplates: { 'application/json': '{ "statusCode": "200" }' }
    });

    const analyzeIntegration = new apigateway.LambdaIntegration(analyzeFunction, {
      requestTemplates: { 'application/json': '{ "statusCode": "200" }' }
    });

    const resultsIntegration = new apigateway.LambdaIntegration(resultsFunction, {
      requestTemplates: { 'application/json': '{ "statusCode": "200" }' }
    });

    // API endpoints
    const uploadResource = lexApi.root.addResource('upload');
    uploadResource.addMethod('POST', uploadIntegration);

    const analyzeResource = lexApi.root.addResource('analyze');
    analyzeResource.addMethod('POST', analyzeIntegration);

    const resultsResource = lexApi.root.addResource('results');
    resultsResource.addMethod('GET', resultsIntegration);
    
    const contractResource = resultsResource.addResource('{contract_id}');
    contractResource.addMethod('GET', resultsIntegration);

    // CloudFormation Outputs
    new cdk.CfnOutput(this, 'LexApiUrl', {
      value: lexApi.url,
      description: 'Lex API Gateway URL',
      exportName: 'LexApiUrl',
    });

    new cdk.CfnOutput(this, 'LexBucketName', {
      value: lexBucket.bucketName,
      description: 'Lex S3 Bucket Name',
      exportName: 'LexBucketName',
    });

    new cdk.CfnOutput(this, 'LexTableName', {
      value: contractsTable.tableName,
      description: 'Lex DynamoDB Table Name',
      exportName: 'LexTableName',
    });

    new cdk.CfnOutput(this, 'LexRegion', {
      value: this.region,
      description: 'AWS Region',
      exportName: 'LexRegion',
    });
  }
}
