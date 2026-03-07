import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'
import { extractTextFromS3 } from '../../lib/textract'
import { analyzePolicyWithClaude } from '../../lib/bedrock'
import { getPolicy, updatePolicy } from '../../lib/dynamodb'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type,Authorization',
  'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS'
}

const BUCKET_NAME = process.env.S3_BUCKET_NAME || ''

export const analyzePolicy = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers: corsHeaders, body: '' }
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

    // 2. Update status to processing
    await updatePolicy(policyId, { status: 'processing' })

    // 3. Extract text with Textract
    console.log(`Running Textract on ${policy.s3Key}`)
    let extractedText = ''

    try {
      extractedText = await extractTextFromS3(BUCKET_NAME, policy.s3Key)
      console.log(`Extracted ${extractedText.length} characters`)
    } catch (textractError: any) {
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
    await updatePolicy(policyId, {
      status: 'analyzed',
      extractedText: extractedText.substring(0, 50000),
      analysisResult
    })

    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({
        success: true,
        policyId,
        analysisResult
      })
    }

  } catch (error: any) {
    console.error('Analysis error:', error)
    await updatePolicy(policyId, { status: 'error' }).catch(() => {})

    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ error: error.message })
    }
  }
}