# Lex AI Setup Guide

## 🔧 Prerequisites

### 1. Install Required Tools

```bash
# Node.js 18+ and npm
node --version  # Should be 18+
npm --version

# AWS CLI v2
brew install awscli  # macOS
# or download from: https://aws.amazon.com/cli/

# AWS CDK
npm install -g aws-cdk
```

### 2. AWS Account Setup

#### Configure AWS Credentials
```bash
aws configure
```

**Required Information:**
- AWS Access Key ID
- AWS Secret Access Key  
- Default region: `us-east-1` (recommended for Bedrock)
- Output format: `json`

#### Required AWS Permissions
Your AWS user/role needs permissions for:
- **Lambda** (create, update functions)
- **API Gateway** (create REST APIs)
- **S3** (create buckets, upload objects)
- **DynamoDB** (create tables)
- **IAM** (create roles and policies)
- **CloudFormation** (deploy stacks)
- **Amazon Bedrock** (invoke models)

#### 🚨 Enable Amazon Bedrock Access
1. Go to **AWS Console** → **Amazon Bedrock**
2. Navigate to **Model Access** (left sidebar)
3. Click **Request Model Access**
4. Select **Anthropic Claude 3 Haiku**
5. Submit request (usually approved instantly)

## 🚀 Quick Start

### 1. Deploy Backend First
```bash
cd backend
./deploy.sh
```

This will output your API Gateway URL like:
```
✅ Deployment completed successfully!
📋 Lex AI Contract Reviewer URLs:
   API Gateway: https://abc123.execute-api.us-east-1.amazonaws.com/prod/
```

### 2. Configure Frontend
Create `frontend/.env.local`:
```bash
# Copy the API Gateway URL from backend deployment
NEXT_PUBLIC_API_URL=https://abc123.execute-api.us-east-1.amazonaws.com/prod/
NODE_ENV=development
```

### 3. Run Frontend
```bash
cd frontend
npm run dev
```

Visit: `http://localhost:3000`

## 🔒 Security Notes

### No Application Secrets Required! 🎉
- **Lambda functions** use IAM roles (no hardcoded credentials)
- **Frontend** only needs the public API Gateway URL
- **AWS SDK** automatically uses IAM roles in Lambda
- **Bedrock access** is controlled via IAM policies

### What You DON'T Need
- ❌ Database passwords
- ❌ API keys for AI services  
- ❌ JWT secrets
- ❌ Third-party service tokens
- ❌ Hardcoded AWS credentials in code

## 🧪 Testing Setup

### Verify AWS Access
```bash
aws sts get-caller-identity
```

### Test Bedrock Access
```bash
aws bedrock list-foundation-models --region us-east-1
```

### Test API After Deployment
```bash
curl https://your-api-gateway-url
```

## 🚨 Troubleshooting

### Common Issues

**1. "AWS CLI not found"**
```bash
brew install awscli
```

**2. "Access Denied for Bedrock"**
- Enable model access in AWS Console
- Ensure you're in a supported region (us-east-1, us-west-2)

**3. "CDK Bootstrap Error"**
```bash
cdk bootstrap
```

**4. "Frontend can't connect to API"**
- Check `NEXT_PUBLIC_API_URL` in `.env.local`
- Verify API Gateway is deployed

### Cost Estimates
- **Development**: ~$1-5/month
- **Per contract analysis**: ~$0.10-1.00
- **Lambda**: Pay per invocation
- **S3**: Pay for storage used
- **DynamoDB**: Pay per request

## 🎯 Ready to Deploy!

Once you have:
1. ✅ AWS CLI configured
2. ✅ Bedrock access enabled  
3. ✅ Node.js 18+ installed

Run:
```bash
cd backend && ./deploy.sh
```

Then update your frontend `.env.local` and you're ready! 🚀 