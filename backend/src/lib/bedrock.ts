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

// ─── Sanitize user-controlled strings before embedding in prompts ──
// Removes characters that could be used to inject new instructions into
// the prompt (angle brackets, backticks, null bytes).
function sanitizeForPrompt(value: string, maxLength = 500): string {
  return String(value)
    .replace(/[<>`\u0000]/g, "")
    .trim()
    .substring(0, maxLength);
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

  // Sanitize user-supplied fields that are embedded in the prompt
  const safePolicyType = sanitizeForPrompt(policyType, 100);
  const safePolicyName = sanitizeForPrompt(policyName, 200);
  // Extracted text comes from Textract (not directly user-controlled) but we
  // still cap it to prevent runaway token usage.
  const safeText = extractedText.substring(0, 8000);

  const prompt = `You have been given a document that is supposed to be a ${safePolicyType} insurance policy named "${safePolicyName}".

DOCUMENT TEXT:
${safeText}

STEP 1 — VALIDATION:
Determine whether this document is actually an insurance policy or an insurance-related document.
Acceptable documents include: policy schedules, certificates of insurance, premium receipts, and policy wordings.
If the document is clearly NOT insurance-related (e.g. a recipe, news article, random text, or any non-insurance content), respond with ONLY this JSON and nothing else:
{"error": "not_insurance_document", "message": "The uploaded document does not appear to be an insurance policy. Please upload a valid insurance policy document (PDF or image of your policy)."}

STEP 2 — ANALYSIS (only if the document passes validation):
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

  // Sanitize all user-controlled string fields to prevent prompt injection
  const safeJobTitle = sanitizeForPrompt(userProfile.jobTitle, 100);
  const safeIndustry = sanitizeForPrompt(userProfile.industry, 100);
  const safeOccRisk = sanitizeForPrompt(userProfile.occupationalRisk, 50);
  const safeHealthStatus = sanitizeForPrompt(userProfile.healthStatus, 100);
  const safeGoals = sanitizeForPrompt(userProfile.goals, 300);
  const safeMaritalStatus = sanitizeForPrompt(userProfile.maritalStatus, 50);

  const policiesList =
    existingPolicies.length > 0
      ? existingPolicies.map((p) => `- ${sanitizeForPrompt(p.policyType, 50)}: ₹${Number(p.sumInsured)} (Expires: ${sanitizeForPrompt(p.endDate, 20)})`).join('\n')
      : '- No existing policies';

  const prompt = `You are recommending insurance policies to an Indian family.

User Profile:
- Age: ${Number(userProfile.age)} years
- Family Size: ${Number(userProfile.familySize)} members (${Number(userProfile.dependents)} dependents)
- Annual Income: ₹${Number(userProfile.annualIncome)}
- Job Title: ${safeJobTitle}
- Industry: ${safeIndustry}
- Occupational Risk Level: ${safeOccRisk}
- Health Status: ${safeHealthStatus}
- Primary Goals: ${safeGoals}
- Marital Status: ${safeMaritalStatus}

Current Coverage:
${policiesList}

Peer Benchmarks (Similar Age/Income/Occupation):
- Average Health Coverage: ₹${Number(peerMetrics.avgHealthCoverage)}
- Average Life Insurance: ₹${Number(peerMetrics.avgLifeInsurance)}
- User's Percentile Coverage Rank: ${Number(peerMetrics.percentile)}%

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
