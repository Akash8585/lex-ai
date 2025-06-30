#!/bin/bash

# Lex AI Contract Reviewer - TypeScript Deployment Script
echo "🚀 Deploying Lex AI Contract Reviewer (TypeScript Edition)..."

# Check if AWS CLI is configured
if ! aws sts get-caller-identity > /dev/null 2>&1; then
    echo "❌ AWS CLI not configured. Please run 'aws configure' first."
    exit 1
fi

# Check if Node.js and npm are available
if ! command -v node &> /dev/null; then
    echo "❌ Node.js not found. Please install Node.js 18+ first."
    exit 1
fi

if ! command -v npm &> /dev/null; then
    echo "❌ npm not found. Please install npm first."
    exit 1
fi

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Bootstrap CDK (only needed once per AWS account/region)
echo "🔧 Bootstrapping CDK..."
cdk bootstrap

# Build the project
echo "🏗️  Building TypeScript project..."
npm run build

# Deploy the stack
echo "📦 Deploying Lex Stack with TypeScript Lambda functions..."
cdk deploy --require-approval never

# Get the outputs
echo "📊 Getting deployment outputs..."
API_URL=$(aws cloudformation describe-stacks --stack-name BackendStack --query 'Stacks[0].Outputs[?OutputKey==`LexApiUrl`].OutputValue' --output text)
BUCKET_NAME=$(aws cloudformation describe-stacks --stack-name BackendStack --query 'Stacks[0].Outputs[?OutputKey==`LexBucketName`].OutputValue' --output text)

echo ""
echo "✅ Deployment completed successfully!"
echo ""
echo "📋 Lex AI Contract Reviewer URLs:"
echo "   API Gateway: $API_URL"
echo "   S3 Bucket: $BUCKET_NAME"
echo ""
echo "🔧 Next steps:"
echo "   1. Update frontend/.env.local with the API URL:"
echo "      NEXT_PUBLIC_API_URL=$API_URL"
echo "   2. Test the API endpoints"
echo "   3. Deploy the frontend"
echo ""
echo "🧪 Test the API:"
echo "   curl $API_URL"
echo ""

# Save outputs to a file for easy access
cat > outputs.json << EOF
{
  "api_url": "$API_URL",
  "bucket_name": "$BUCKET_NAME"
}
EOF

echo "💾 Outputs saved to outputs.json"

# Test basic connectivity
echo "🧪 Testing API connectivity..."
if curl -s --connect-timeout 5 "$API_URL" > /dev/null; then
    echo "✅ API is responding"
else
    echo "⚠️  API not responding yet (may take a few moments to warm up)"
fi

echo ""
echo "🎉 TypeScript Lex deployment complete!"
echo "Ready for AWS Lambda Hackathon! 🏆" 