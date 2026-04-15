# 🛡️ Suraksha AI — Insurance Intelligence Platform

> AI-powered insurance policy analyzer for Indian families | AWS AI for Bharat Hackathon

## 🌟 What is Suraksha AI?

**Suraksha AI** (सुरक्षा AI) helps Indian families understand their insurance policies in simple Hindi and English. Most Indians don't fully understand what their insurance covers — Suraksha AI fixes that with AI-powered analysis.

### Key Features

- 📄 **Policy Upload** — Upload any insurance PDF and get instant AI analysis
- 🧠 **AI Analysis** — Claude (AWS Bedrock) extracts coverage details, exclusions, and claim tips
- 📊 **Coverage Gap Analysis** — Compares your coverage against Indian insurance standards
- 🎯 **Claim Success Prediction** — AI predicts probability of claim success
- 🇮🇳 **Bilingual** — Every insight in Hindi + English
- 👤 **Profile & Dashboard** — Track all policies and coverage health score

---

## 🏗️ Architecture

```
Frontend (Next.js 16)
    ↓
AWS Amplify / Vercel (Hosting)
    ↓
AWS API Gateway → AWS Lambda (Node.js 20)
    ↓                    ↓
AWS Cognito          AWS Bedrock (Claude 3.5 Sonnet)
(Auth)               AWS Textract (OCR)
                     AWS DynamoDB (Database)
                     AWS S3 (Document Storage)
```

### AWS Services Used

| Service | Purpose |
|---|---|
| **AWS Bedrock (Claude 3.5 Sonnet)** | AI policy analysis in Hindi + English |
| **AWS Textract** | OCR text extraction from PDF policies |
| **AWS DynamoDB** | Policy data and user storage |
| **AWS S3** | Insurance document storage |
| **AWS Cognito** | User authentication |
| **AWS Lambda** | Serverless backend API |
| **AWS API Gateway** | REST API endpoints |
| **AWS Amplify** | Frontend CI/CD and hosting |
| **AWS CloudFormation** | Infrastructure as code |

---

## 🚀 Getting Started

### Prerequisites

- Node.js 20+
- AWS Account (ap-south-1 Mumbai region)
- npm

### Local Development

```bash
# Clone the repository
git clone https://github.com/milind-garg/suraksha-ai.git
cd suraksha-ai

# Install frontend dependencies
cd frontend
npm install --legacy-peer-deps

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your AWS values

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### Environment Variables

Create `frontend/.env.local`:

```env
NEXT_PUBLIC_AWS_REGION=ap-south-1
NEXT_PUBLIC_USER_POOL_ID=your-cognito-user-pool-id
NEXT_PUBLIC_USER_POOL_CLIENT_ID=your-cognito-client-id
NEXT_PUBLIC_S3_BUCKET=your-s3-bucket-name
NEXT_PUBLIC_API_URL=your-api-gateway-url
NEXT_PUBLIC_APP_NAME=Suraksha AI
```

> 💡 **Demo Mode**: If `NEXT_PUBLIC_API_URL` is set to `PLACEHOLDER`, the app runs in demo mode with mock AI analysis — no AWS required!

---

## 🧪 Demo

**Live URL**: [https://suraksha-ai-milind-gargs-projects.vercel.app](https://suraksha-ai-milind-gargs-projects.vercel.app)

### Demo Flow

1. Go to the live URL
2. Click **"Try Demo"** — no signup needed
3. Go to **Upload Policy** → fill in details → click Upload
4. Click **"Start AI Analysis"** on your policy
5. See claim probability, coverage gaps, and recommendations
6. Go to **Gap Analysis** to see your overall protection score

---

## 📁 Project Structure

```
suraksha-ai/
├── frontend/                    # Next.js 16 app
│   ├── src/
│   │   ├── app/
│   │   │   ├── page.tsx         # Landing page
│   │   │   ├── login/           # Login page
│   │   │   ├── signup/          # Signup page
│   │   │   └── dashboard/
│   │   │       ├── page.tsx         # Dashboard home
│   │   │       ├── upload/          # Policy upload
│   │   │       ├── policies/        # Policy list
│   │   │       │   └── [policyId]/  # Policy detail + AI analysis
│   │   │       ├── gap-analysis/    # Coverage gap analyzer
│   │   │       └── profile/         # User profile
│   │   ├── components/
│   │   │   ├── layout/          # Sidebar, nav, header
│   │   │   └── ui/              # shadcn/ui components
│   │   ├── store/
│   │   │   ├── policy-store.ts  # Zustand policy state (persisted)
│   │   │   └── auth-store.ts    # Zustand auth state
│   │   └── lib/
│   │       ├── amplify-config.ts # AWS Amplify configuration
│   │       └── api.ts            # API client
│   ├── .npmrc                   # legacy-peer-deps=true
│   └── next.config.ts
├── backend/                     # AWS Lambda functions
│   └── src/
│       ├── handlers/
│       │   ├── uploadPolicy.ts
│       │   ├── analyzePolicy.ts
│       │   └── getPolicy.ts
│       └── services/
│           ├── bedrock.ts       # Claude AI integration
│           └── textract.ts      # OCR service
├── infrastructure/
│   └── cloudformation/          # AWS CloudFormation templates
├── amplify.yml                  # AWS Amplify build config
└── README.md
```

---

## 🌐 Deployment

The app can be deployed to **both Vercel and AWS Amplify** simultaneously.
Both platforms support Next.js SSR natively — no static export or extra config
is required.

---

### Deploy to Vercel

1. Fork this repository
2. Go to [vercel.com](https://vercel.com) → New Project → Import repo
3. Set **Root Directory** to `frontend`
4. Add the environment variables listed above
5. Click **Deploy**

> **Note**: Disable Deployment Protection in Vercel Settings for public access.

---

### Deploy to AWS Amplify (SSR / Compute mode)

The `amplify.yml` at the repo root configures the monorepo build.
Amplify auto-detects `amplify.yml` — no extra configuration is needed in the
Amplify Console build settings.

> **Important**: Select **Web compute** (SSR) as the platform, not
> *Web hosting* (static), when creating the Amplify app.  This enables
> Next.js Server-Side Rendering and dynamic routing out-of-the-box.

#### Option A — Console (quick start)

1. Open [AWS Amplify Console](https://console.aws.amazon.com/amplify/) → **New app → Host web app**
2. Connect your GitHub repository and select the branch (e.g. `main`)
3. On the **Build settings** screen, confirm the platform is **Web compute**
4. Amplify auto-detects `amplify.yml` — review and click **Save and deploy**
5. Set the environment variables below in **App settings → Environment variables**

#### Option B — CloudFormation (infrastructure-as-code)

The `infrastructure/cloudformation/amplify-hosting.yaml` template creates the
Amplify App (WEB_COMPUTE platform) and Branch automatically.

```bash
# Mac/Linux
# Retrieve the token from Secrets Manager (never hard-code it):
GITHUB_TOKEN=$(aws secretsmanager get-secret-value \
  --secret-id suraksha-ai/github-token \
  --query SecretString --output text)

DEPLOY_AMPLIFY=true \
GITHUB_REPOSITORY=https://github.com/<your-fork>/suraksha-ai \
GITHUB_OAUTH_TOKEN="$GITHUB_TOKEN" \
GITHUB_BRANCH=main \
./infrastructure/scripts/deploy.sh dev ap-south-1

# Windows (PowerShell)
# Retrieve the token from Secrets Manager (never hard-code it):
$GithubToken = (aws secretsmanager get-secret-value `
  --secret-id suraksha-ai/github-token `
  --query SecretString --output text)

./infrastructure/scripts/deploy.ps1 `
  -Environment dev `
  -Region ap-south-1 `
  -DeployAmplify `
  -GitHubRepository "https://github.com/<your-fork>/suraksha-ai" `
  -GitHubOAuthToken $GithubToken `
  -GitHubBranch "main"
```

#### Amplify Environment Variables

Set these in the Amplify Console under **App settings → Environment variables**:

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_AWS_REGION` | `ap-south-1` |
| `NEXT_PUBLIC_USER_POOL_ID` | Cognito User Pool ID |
| `NEXT_PUBLIC_USER_POOL_CLIENT_ID` | Cognito User Pool Client ID |
| `NEXT_PUBLIC_S3_BUCKET` | S3 bucket name |
| `NEXT_PUBLIC_API_URL` | API Gateway URL (or `PLACEHOLDER` for demo mode) |
| `NEXT_PUBLIC_APP_NAME` | `Suraksha AI` |

---

### Deploy Backend (AWS Lambda)

```bash
cd infrastructure/scripts
./deploy.sh dev ap-south-1    # Mac/Linux
# or
./deploy.ps1 -Environment dev -Region ap-south-1   # Windows
```

This deploys the CloudFormation stack with Cognito, S3, DynamoDB, Lambda, and API Gateway.

---

## 🔑 Tech Stack

**Frontend**
- Next.js 16 with TypeScript
- Tailwind CSS
- shadcn/ui components
- Zustand (state management with localStorage persistence)
- AWS Amplify JS (auth)

**Backend**
- AWS Lambda (Node.js 20)
- AWS Bedrock — Claude 3.5 Sonnet (`anthropic.claude-3-5-sonnet-20241022-v2:0`)
- AWS Textract
- AWS DynamoDB
- AWS S3
- AWS Cognito

**Infrastructure**
- AWS CloudFormation
- AWS API Gateway (REST)
- AWS Amplify (CI/CD)

---

## 📊 Coverage Gap Analysis

Suraksha AI compares your policies against Indian insurance standards:

| Category | Minimum | Ideal |
|---|---|---|
| 🏥 Health Insurance | ₹5 Lakh | ₹10 Lakh |
| 💚 Life Insurance | ₹50 Lakh | ₹1 Crore |
| 🚗 Vehicle Insurance | ₹1 Lakh | ₹5 Lakh |
| 🏠 Home Insurance | ₹10 Lakh | ₹50 Lakh |
| ✈️ Travel Insurance | ₹5 Lakh | ₹20 Lakh |

---

## 🏆 Why This Wins Hackathons

1. **India-specific** — Uses real Indian insurance standards and regulations
2. **Bilingual** — Every insight in Hindi + English (accessibility for Bharat)
3. **Actionable** — Not just analysis but specific recommendations
4. **AWS-native** — Uses Bedrock, Textract, Cognito, Lambda, DynamoDB, S3
5. **Demo-ready** — Works without real AWS setup via demo mode

---

## 👨‍💻 Author

**Milind Garg**
- GitHub: [@milind-garg](https://github.com/milind-garg)

---

## 📄 License

MIT License — feel free to use for learning and projects.

---

*Built with ❤️ for AWS AI for Bharat Hackathon 🇮🇳*
