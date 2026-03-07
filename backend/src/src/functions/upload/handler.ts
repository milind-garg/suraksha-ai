import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'
import { v4 as uuidv4 } from 'uuid'
import { generateUploadUrl } from '../../lib/s3'
import { createPolicy } from '../../lib/dynamodb'

const ALLOWED_TYPES = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg']
const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type,Authorization',
  'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS'
}

export const getPresignedUrl = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers: corsHeaders, body: '' }
  }

  try {
    const userId = event.requestContext?.authorizer?.claims?.sub || 'demo-user'
    const body = JSON.parse(event.body || '{}')

    const { fileName, fileType, policyName, policyType } = body

    if (!fileName || !fileType || !policyName || !policyType) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'Missing required fields' })
      }
    }

    if (!ALLOWED_TYPES.includes(fileType)) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'File type not allowed. Use PDF, JPG, or PNG' })
      }
    }

    const policyId = uuidv4()
    const fileExtension = fileName.split('.').pop()
    const s3Key = `policies/${userId}/${policyId}/document.${fileExtension}`

    const uploadUrl = await generateUploadUrl(s3Key, fileType)

    // Create initial policy record in DynamoDB
    await createPolicy({
      policyId,
      userId,
      policyName,
      policyType,
      insurerName: body.insurerName || '',
      policyNumber: body.policyNumber || '',
      premiumAmount: body.premiumAmount || 0,
      sumInsured: body.sumInsured || 0,
      startDate: body.startDate || '',
      endDate: body.endDate || '',
      status: 'uploaded',
      s3Key,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    })

    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({ uploadUrl, policyId, s3Key })
    }

  } catch (error: any) {
    console.error('Upload error:', error)
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ error: error.message })
    }
  }
}