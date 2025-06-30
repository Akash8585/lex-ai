# Lex - AI Contract Reviewer

> **AI-powered contract analysis that identifies risks and provides actionable insights. Analyze contracts in seconds, not hours.**

Lex is an intelligent contract review system built for the AWS Lambda Hackathon. It leverages AWS Lambda for serverless compute, Amazon Bedrock for AI analysis, and provides a clean, modern web interface for contract analysis.

## 🌟 Features

- **📄 Smart Document Processing**: Upload PDF and DOCX contracts with drag-and-drop interface
- **🤖 AI-Powered Analysis**: Amazon Bedrock Claude integration for intelligent contract review  
- **⚡ Risk Assessment**: Automated risk scoring and categorization (1-10 scale)
- **🎯 Key Terms Extraction**: Identify payment terms, termination clauses, and liability limitations
- **🚨 Red Flag Detection**: Highlight concerning terms and missing clauses
- **💡 Actionable Recommendations**: Get specific suggestions for contract improvements
- **📊 Clean Dashboard**: Modern, responsive UI inspired by Linear and Notion
- **☁️ Serverless Architecture**: Scales automatically, pay only for what you use

## 🏗️ Architecture

**Tech Stack:**
- **Frontend**: Next.js 14, TypeScript, Tailwind CSS, Shadcn/ui, React Dropzone
- **Backend**: AWS Lambda (Node.js 20), TypeScript, API Gateway
- **AI**: Amazon Bedrock (Claude 3 Haiku)
- **Storage**: Amazon S3, DynamoDB
- **Infrastructure**: AWS CDK (TypeScript), CloudFormation

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm
- AWS CLI configured with appropriate permissions
- AWS CDK installed globally: `npm install -g aws-cdk`

### 1. Clone and Setup

```bash
git clone https://github.com/yourusername/lex-ai.git
cd lex-ai

# Install frontend dependencies
cd frontend
npm install

# Install backend dependencies  
cd ../backend
npm install
```

### 2. Deploy AWS Infrastructure

```bash
cd backend
chmod +x deploy.sh
./deploy.sh
```

### 3. Configure Frontend

Create `frontend/.env.local` with your API Gateway URL:

```env
NEXT_PUBLIC_API_URL=https://your-api-gateway-url
```

### 4. Run Frontend

```bash
cd frontend
npm run dev
```

Visit `http://localhost:3000` to see Lex in action!

## 🎯 Usage

### Upload and Analyze

1. **Upload Contract**: Drag and drop a PDF or DOCX contract file
2. **AI Analysis**: Lex automatically processes the document with Amazon Bedrock
3. **Review Results**: Get comprehensive analysis including:
   - Overall risk score (1-10)
   - Executive summary
   - Key terms breakdown
   - Specific risk categories
   - Actionable recommendations
   - Red flags and missing clauses

## 🛠️ Development

### Project Structure

```
lex-ai/
├── frontend/                 # Next.js application
│   ├── src/
│   │   ├── app/             # App Router pages
│   │   │   ├── layout.tsx   # Root layout with Geist font
│   │   │   ├── page.tsx     # Main contract upload interface
│   │   │   └── globals.css  # Tailwind + Shadcn styles
│   │   └── components/ui/   # Shadcn UI components
│   └── package.json
├── backend/                 # AWS CDK infrastructure  
│   ├── lib/
│   │   └── backend-stack.ts # Complete AWS infrastructure
│   ├── lambda/             # TypeScript Lambda functions
│   │   ├── upload/         # File upload handler (TS)
│   │   │   ├── index.ts
│   │   │   └── package.json
│   │   ├── analyze/        # AI analysis handler (TS) 
│   │   │   ├── index.ts
│   │   │   └── package.json
│   │   └── results/        # Results retrieval (TS)
│   │       ├── index.ts
│   │       └── package.json
│   ├── deploy.sh           # TypeScript deployment script
│   └── package.json
├── package.json            # Root project management
└── README.md
```

## 📊 AWS Resources

Lex creates the following AWS resources:

| Service | Purpose | Cost Impact |
|---------|---------|-------------|
| Lambda Functions | Contract processing and AI analysis | Pay per invocation |
| API Gateway | REST API endpoints | Pay per request |
| S3 Bucket | Contract document storage | Pay for storage used |
| DynamoDB | Contract metadata and results | Pay per request |
| Amazon Bedrock | AI contract analysis | Pay per token |

**Estimated costs**: ~$0.10-$1.00 per contract analysis

## 🔒 Security & Privacy

- **Data Encryption**: All data encrypted in transit and at rest
- **Access Control**: Lambda functions use least-privilege IAM roles
- **No Data Retention**: Contracts can be automatically deleted after analysis
- **Audit Trail**: CloudWatch logs for all operations

## 🏆 AWS Lambda Hackathon

Lex demonstrates serverless best practices:

- **Event-driven architecture** with Lambda triggers
- **Auto-scaling** based on demand  
- **Pay-per-use** pricing model
- **Managed services** integration (Bedrock, DynamoDB, S3)
- **Infrastructure as Code** with AWS CDK
- **TypeScript end-to-end** for type safety and developer experience
- **Modern tooling** with Next.js 14, Shadcn/ui, and Geist font
- **Monitoring and observability** with CloudWatch

Built with ❤️ for the AWS Lambda Hackathon

**Happy contracting with Lex! ⚖️✨** 