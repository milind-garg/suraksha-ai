import {
  BedrockRuntimeClient,
  InvokeModelCommand
} from '@aws-sdk/client-bedrock-runtime'

const client = new BedrockRuntimeClient({
  region: process.env.AWS_REGION || 'ap-south-1'
})

const MODEL_ID = process.env.BEDROCK_MODEL_ID ||
  'anthropic.claude-3-5-sonnet-20241022-v2:0'

export interface BedrockMessage {
  role: 'user' | 'assistant'
  content: string
}

// ─── Core invoke function ──────────────────────────────
export async function invokeClause(
  prompt: string,
  systemPrompt?: string,
  maxTokens = 4096
): Promise<string> {
  const body = {
    anthropic_version: 'bedrock-2023-05-31',
    max_tokens: maxTokens,
    system: systemPrompt || 'You are Suraksha AI, an expert insurance policy analyzer for Indian families. Always respond in clear, simple language.',
    messages: [
      { role: 'user', content: prompt }
    ]
  }

  const command = new InvokeModelCommand({
    modelId: MODEL_ID,
    contentType: 'application/json',
    accept: 'application/json',
    body: JSON.stringify(body)
  })

  const response = await client.send(command)
  const responseBody = JSON.parse(
    new TextDecoder().decode(response.body)
  )

  return responseBody.content[0].text
}

// ─── Analyze insurance policy ─────────────────────────
export async function analyzePolicyWithClaude(
  extractedText: string,
  policyType: string,
  policyName: string
): Promise<string> {
  const systemPrompt = `You are Suraksha AI, an expert insurance policy analyzer for Indian families.
Your job is to analyze insurance policy documents and provide clear, actionable insights.
Always respond with valid JSON only — no markdown, no extra text.
Be accurate, helpful, and use simple language that Indian families can understand.`

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
}`

  return await invokeClause(prompt, systemPrompt, 4096)
}