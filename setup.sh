#!/bin/bash

# Lex AI Setup Script
echo "🚀 Setting up Lex AI Contract Reviewer..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check Node.js
echo "🔍 Checking Node.js..."
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    echo "✅ Node.js found: $NODE_VERSION"
else
    echo -e "${RED}❌ Node.js not found. Please install Node.js 18+ first.${NC}"
    echo "   Visit: https://nodejs.org/"
    exit 1
fi

# Check npm
if command -v npm &> /dev/null; then
    NPM_VERSION=$(npm --version)
    echo "✅ npm found: $NPM_VERSION"
else
    echo -e "${RED}❌ npm not found. Please install npm first.${NC}"
    exit 1
fi

# Check AWS CLI
echo "🔍 Checking AWS CLI..."
if command -v aws &> /dev/null; then
    AWS_VERSION=$(aws --version)
    echo "✅ AWS CLI found: $AWS_VERSION"
else
    echo -e "${YELLOW}⚠️  AWS CLI not found. Installing...${NC}"
    echo "🍺 Installing AWS CLI via Homebrew..."
    if command -v brew &> /dev/null; then
        brew install awscli
    else
        echo -e "${RED}❌ Homebrew not found. Please install AWS CLI manually:${NC}"
        echo "   https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html"
        exit 1
    fi
fi

# Check AWS credentials
echo "🔍 Checking AWS credentials..."
if aws sts get-caller-identity &> /dev/null; then
    ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
    REGION=$(aws configure get region)
    echo "✅ AWS credentials configured"
    echo "   Account: $ACCOUNT_ID"
    echo "   Region: $REGION"
else
    echo -e "${YELLOW}⚠️  AWS credentials not configured.${NC}"
    echo "🔧 Please run: aws configure"
    echo "   You'll need:"
    echo "   - AWS Access Key ID"
    echo "   - AWS Secret Access Key"
    echo "   - Default region (recommend: us-east-1)"
    echo "   - Output format: json"
    echo ""
    echo "💡 After configuring, run this script again."
    exit 1
fi

# Check CDK
echo "🔍 Checking AWS CDK..."
if command -v cdk &> /dev/null; then
    CDK_VERSION=$(cdk --version)
    echo "✅ AWS CDK found: $CDK_VERSION"
else
    echo -e "${YELLOW}⚠️  AWS CDK not found. Installing globally...${NC}"
    npm install -g aws-cdk
fi

# Install dependencies
echo "📦 Installing project dependencies..."
echo "   Installing backend dependencies..."
cd backend && npm install

echo "   Installing frontend dependencies..."
cd ../frontend && npm install

cd ..

# Check Bedrock access
echo "🤖 Checking Amazon Bedrock access..."
if aws bedrock list-foundation-models --region ${REGION:-us-east-1} &> /dev/null; then
    echo "✅ Amazon Bedrock access confirmed"
else
    echo -e "${YELLOW}⚠️  Amazon Bedrock access not configured or region not supported.${NC}"
    echo "🔧 Please:"
    echo "   1. Go to AWS Console → Amazon Bedrock"
    echo "   2. Navigate to 'Model Access'"
    echo "   3. Request access to 'Anthropic Claude 3 Haiku'"
    echo "   4. Ensure you're in a supported region (us-east-1, us-west-2)"
fi

echo ""
echo -e "${GREEN}🎉 Setup complete!${NC}"
echo ""
echo "🚀 Next steps:"
echo "   1. Deploy backend:    cd backend && ./deploy.sh"
echo "   2. Configure frontend: Update frontend/.env.local with API URL"
echo "   3. Run frontend:      cd frontend && npm run dev"
echo ""
echo "📖 For detailed instructions, see: SETUP.md"
echo ""
echo -e "${GREEN}Happy contracting with Lex! ⚖️✨${NC}" 