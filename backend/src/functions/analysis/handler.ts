import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'
import { extractTextFromS3 } from '../../lib/textract'
import { analyzePolicyWithClaude } from '../../lib/bedrock'
import { getPolicy, updatePolicy } from '../../lib/dynamodb'
import { getCorsHeaders, makePreflightResponse } from '../../lib/cors'

const BUCKET_NAME = process.env.S3_BUCKET_NAME || ''

export const analyzePolicy = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  const requestOrigin = event.headers?.origin ?? event.headers?.Origin
  const corsHeaders = getCorsHeaders(requestOrigin)

  if (event.httpMethod === 'OPTIONS') {
    return makePreflightResponse(requestOrigin)
  }

  const userId = event.requestContext?.authorizer?.claims?.sub
  if (!userId) {
    return {
      statusCode: 401,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Unauthorized' })
    }
  }

  const policyId = event.pathParameters?.policyId

  if (!policyId) {
    return {
      statusCode: 400,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Policy ID required' })
    }
  }

  try {
    // 1. Get policy from DynamoDB
    const policy = await getPolicy(policyId)
    if (!policy) {
      return {
        statusCode: 404,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'Policy not found' })
      }
    }

    // Ownership check
    if (policy.userId !== userId) {
      return {
        statusCode: 403,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'Forbidden' })
      }
    }

    // 2. Update status to processing
    await updatePolicy(policyId, { status: 'processing' })

    // 3. Extract text with Textract
    console.log(`Running Textract on ${policy.s3Key}`)
    let extractedText = ''

    try {
      extractedText = await extractTextFromS3(BUCKET_NAME, policy.s3Key)
      console.log(`Extracted ${extractedText.length} characters`)
    } catch (textractError: unknown) {
      console.error('Textract error:', textractError)
      extractedText = `Policy Name: ${policy.policyName}\nPolicy Type: ${policy.policyType}\nInsurer: ${policy.insurerName}\nSum Insured: ${policy.sumInsured}\nPremium: ${policy.premiumAmount}`
    }

    // 4. Analyze with Claude
    console.log('Calling Claude for analysis...')
    const analysisJson = await analyzePolicyWithClaude(
      extractedText,
      policy.policyType,
      policy.policyName
    )

    // 5. Parse Claude response
    let analysisResult
    try {
      const cleanJson = analysisJson
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim()
      analysisResult = JSON.parse(cleanJson)
    } catch (parseError) {
      console.error('Parse error:', parseError)
      analysisResult = {
        summary: analysisJson.substring(0, 500),
        summaryHindi: 'विश्लेषण पूर्ण हुआ',
        coverageDetails: [],
        exclusions: [],
        claimProcess: [],
        claimSuccessProbability: 70,
        coverageGaps: [],
        recommendations: ['Please review the policy document manually']
      }
    }

    // 6. Update DynamoDB with results
    // Also sync back the AI-extracted top-level fields (insurerName, policyNumber)
    // so they are visible even if the user left them blank during upload.
    const topLevelUpdates: Record<string, any> = {
      status: 'analyzed',
      extractedText: extractedText.substring(0, 50000),
      analysisResult
    }
    if (analysisResult.insurerName && !policy.insurerName) {
      topLevelUpdates.insurerName = String(analysisResult.insurerName).substring(0, 200)
    }
    if (analysisResult.policyNumber && !policy.policyNumber) {
      topLevelUpdates.policyNumber = String(analysisResult.policyNumber).substring(0, 100)
    }

    await updatePolicy(policyId, topLevelUpdates)

    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({
        success: true,
        policyId,
        analysisResult
      })
    }

  } catch (error: unknown) {
    console.error('Analysis error:', error)
    await updatePolicy(policyId, { status: 'error' }).catch(() => {})

    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Internal server error' })
    }
  }
}