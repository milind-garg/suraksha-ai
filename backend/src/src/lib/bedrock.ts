import {
  BedrockRuntimeClient,
  InvokeModelCommand,
} from "@aws-sdk/client-bedrock-runtime";

const client = new BedrockRuntimeClient({
  region: process.env.AWS_REGION || "ap-south-1",
});

const MODEL_ID =
  process.env.BEDROCK_MODEL_ID || "anthropic.claude-3-5-sonnet-20241022-v2:0";

export interface BedrockMessage {
  role: "user" | "assistant";
  content: string;
}

// ─── Core invoke function ──────────────────────────────
export async function invokeClaude(
  prompt: string,
  systemPrompt?: string,
  maxTokens = 4096,
): Promise<string> {
  const body = {
    anthropic_version: "bedrock-2023-05-31",
    max_tokens: maxTokens,
    system:
      systemPrompt ||
      "You are Suraksha AI, an expert insurance policy analyzer for Indian families. Always respond in clear, simple language.",
    messages: [{ role: "user", content: prompt }],
  };

  const command = new InvokeModelCommand({
    modelId: MODEL_ID,
    contentType: "application/json",
    accept: "application/json",
    body: JSON.stringify(body),
  });

  const response = await client.send(command);
  const responseBody = JSON.parse(new TextDecoder().decode(response.body));

  return responseBody.content[0].text;
}

// ─── Analyze insurance policy ─────────────────────────
export async function analyzePolicyWithClaude(
  extractedText: string,
  policyType: string,
  policyName: string,
): Promise<string> {
  const systemPrompt = `You are Suraksha AI, an expert insurance policy analyzer for Indian families.
Your job is to analyze insurance policy documents and provide clear, actionable insights.
Always respond with valid JSON only — no markdown, no extra text.
Be accurate, helpful, and use simple language that Indian families can understand.`;

  const prompt = `Analyze this ${policyType} insurance policy named "${policyName}".

POLICY TEXT:
${extractedText.substring(0, 8000)}

Respond with ONLY this JSON structure (no markdown, no extra text):
{
  "summary": "2-3 sentence plain English summary of what this policy covers",
  "summaryHindi": "2-3 sentence Hindi summary (use Devanagari script)",
  "insurerName": "name of insurance company",
  "policyNumber": "policy number if found",
  "coverageDetails": [
    {
      "name": "coverage item name",
      "covered": true or false,
      "limit": "coverage limit or amount",
      "details": "one line explanation"
    }
  ],
  "exclusions": ["exclusion 1", "exclusion 2", "exclusion 3"],
  "claimProcess": ["step 1", "step 2", "step 3", "step 4"],
  "claimSuccessProbability": 75,
  "coverageGaps": [
    {
      "gap": "gap description",
      "severity": "high or medium or low",
      "recommendation": "what to do about it"
    }
  ],
  "recommendations": ["recommendation 1", "recommendation 2", "recommendation 3"],
  "keyDates": [
    {
      "label": "date label",
      "date": "date value",
      "importance": "why this date matters"
    }
  ]
}`;

  return await invokeClaude(prompt, systemPrompt, 4096);
}

// ─── Generate policy recommendations ───────────────────
export async function generateUserRecommendations(
  userProfile: {
    age: number;
    familySize: number;
    dependents: number;
    maritalStatus: string;
    annualIncome: number;
    jobTitle: string;
    industry: string;
    occupationalRisk: string;
    healthStatus: string;
    goals: string;
  },
  existingPolicies: Array<{
    policyType: string;
    sumInsured: number;
    policyName: string;
    endDate: string;
  }>,
  peerMetrics: {
    avgHealthCoverage: number;
    avgLifeInsurance: number;
    percentile: number;
  },
): Promise<string> {
  const systemPrompt = `You are Suraksha AI, an expert insurance advisor for Indian families.
Based on the user's profile, existing coverage, and peer benchmarks, provide 5-7 specific policy recommendations.
Consider: life stage, income, family responsibilities, occupation risks, and peer benchmarks.
Be specific, actionable, and use simple Indian terms.
Always respond with valid JSON only—no markdown, no extra text.`;

  const policiesList =
    existingPolicies.length > 0
      ? existingPolicies.map((p) => `- ${p.policyType}: ₹${p.sumInsured} (Expires: ${p.endDate})`).join('\n')
      : '- No existing policies';

  const prompt = `You are recommending insurance policies to an Indian family.

User Profile:
- Age: ${userProfile.age} years
- Family Size: ${userProfile.familySize} members (${userProfile.dependents} dependents)
- Annual Income: ₹${userProfile.annualIncome}
- Job Title: ${userProfile.jobTitle}
- Industry: ${userProfile.industry}
- Occupational Risk Level: ${userProfile.occupationalRisk}
- Health Status: ${userProfile.healthStatus}
- Primary Goals: ${userProfile.goals}
- Marital Status: ${userProfile.maritalStatus}

Current Coverage:
${policiesList}

Peer Benchmarks (Similar Age/Income/Occupation):
- Average Health Coverage: ₹${peerMetrics.avgHealthCoverage}
- Average Life Insurance: ₹${peerMetrics.avgLifeInsurance}
- User's Percentile Coverage Rank: ${peerMetrics.percentile}%

Provide recommendations as JSON only (no markdown, no extra text):
{
  "recommendations": [
    {
      "type": "New Policy" | "Coverage Enhancement" | "Risk Mitigation" | "Peer Comparison",
      "priority": "High" | "Medium" | "Low",
      "category": "health" | "life" | "vehicle" | "home" | "travel" | "other",
      "title": "Specific recommendation title",
      "description": "Why this matters for this person's situation (2-3 sentences)",
      "suggestedCoverage": "Suggested coverage amount in Indian rupees",
      "estimatedPremium": "Estimated annual premium range (use realistic Indian premium rates)",
      "relevanceForIndians": "Hindi/Hinglish reasoning that resonates with Indian families"
    }
  ],
  "overallRiskScore": 65,
  "riskAssessment": "Summary of identifying coverage gaps and risks",
  "actionNextSteps": "Specific action items for next 30 days"
}`;

  return await invokeClaude(prompt, systemPrompt, 4096);
}
