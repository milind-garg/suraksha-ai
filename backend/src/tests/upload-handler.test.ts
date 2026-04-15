/**
 * Unit tests for the upload handler (getPresignedUrl).
 * AWS dependencies (S3, DynamoDB) are fully mocked.
 */
import { getPresignedUrl } from '../functions/upload/handler'
import { generateUploadUrl } from '../lib/s3'
import { createPolicy } from '../lib/dynamodb'
import { APIGatewayProxyEvent } from 'aws-lambda'

jest.mock('../lib/s3', () => ({
  generateUploadUrl: jest.fn(),
}))

jest.mock('../lib/dynamodb', () => ({
  createPolicy: jest.fn(),
  docClient: { send: jest.fn() },
}))

jest.mock('uuid', () => ({
  v4: jest.fn(() => 'test-uuid-1234'),
}))

const mockGenerateUploadUrl = generateUploadUrl as jest.Mock
const mockCreatePolicy = createPolicy as jest.Mock

function makeEvent(overrides: Partial<APIGatewayProxyEvent> = {}): APIGatewayProxyEvent {
  return {
    httpMethod: 'POST',
    headers: {},
    body: null,
    pathParameters: null,
    queryStringParameters: null,
    requestContext: {
      authorizer: { claims: { sub: 'user-123' } },
    } as any,
    ...overrides,
  } as APIGatewayProxyEvent
}

describe('getPresignedUrl', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockGenerateUploadUrl.mockResolvedValue('https://s3.example.com/upload')
    mockCreatePolicy.mockResolvedValue(undefined)
  })

  it('returns 200 for OPTIONS preflight without checking auth', async () => {
    const res = await getPresignedUrl(makeEvent({ httpMethod: 'OPTIONS' }))
    expect(res.statusCode).toBe(200)
    expect(res.body).toBe('')
  })

  it('returns 401 when userId is absent from authorizer claims', async () => {
    const event = makeEvent({
      requestContext: { authorizer: { claims: {} } } as any,
    })
    const res = await getPresignedUrl(event)
    expect(res.statusCode).toBe(401)
    expect(JSON.parse(res.body).error).toBe('Unauthorized')
  })

  it('returns 400 when required fields are missing', async () => {
    const event = makeEvent({
      body: JSON.stringify({ fileName: 'test.pdf' }), // missing fileType, policyName, policyType
    })
    const res = await getPresignedUrl(event)
    expect(res.statusCode).toBe(400)
    expect(JSON.parse(res.body).error).toMatch(/Missing required fields/)
  })

  it('returns 400 for a disallowed file type', async () => {
    const event = makeEvent({
      body: JSON.stringify({
        fileName: 'doc.exe',
        fileType: 'application/octet-stream',
        policyName: 'My Policy',
        policyType: 'health',
      }),
    })
    const res = await getPresignedUrl(event)
    expect(res.statusCode).toBe(400)
    expect(JSON.parse(res.body).error).toMatch(/File type not allowed/)
  })

  it.each([
    'application/pdf',
    'image/jpeg',
    'image/jpg',
    'image/png',
  ])('accepts allowed file type: %s', async (fileType) => {
    const event = makeEvent({
      body: JSON.stringify({ fileName: 'policy.pdf', fileType, policyName: 'P', policyType: 'health' }),
    })
    const res = await getPresignedUrl(event)
    expect(res.statusCode).toBe(200)
  })

  it('returns 200 with uploadUrl, policyId and s3Key on success', async () => {
    const event = makeEvent({
      body: JSON.stringify({
        fileName: 'policy.pdf',
        fileType: 'application/pdf',
        policyName: 'Health Plus',
        policyType: 'health',
      }),
    })
    const res = await getPresignedUrl(event)
    expect(res.statusCode).toBe(200)
    const body = JSON.parse(res.body)
    expect(body.uploadUrl).toBe('https://s3.example.com/upload')
    expect(body.policyId).toBe('test-uuid-1234')
    expect(body.s3Key).toBe('policies/user-123/test-uuid-1234/document.pdf')
    expect(mockCreatePolicy).toHaveBeenCalledTimes(1)
  })

  it('creates the DynamoDB record with status "uploaded" and correct userId', async () => {
    const event = makeEvent({
      body: JSON.stringify({
        fileName: 'policy.pdf',
        fileType: 'application/pdf',
        policyName: 'Health Plus',
        policyType: 'health',
        premiumAmount: 5000,
        sumInsured: 500000,
      }),
    })
    await getPresignedUrl(event)
    const [created] = mockCreatePolicy.mock.calls[0]
    expect(created.status).toBe('uploaded')
    expect(created.userId).toBe('user-123')
    expect(created.policyId).toBe('test-uuid-1234')
    expect(created.premiumAmount).toBe(5000)
    expect(created.sumInsured).toBe(500000)
  })

  it('uses empty string defaults for optional fields when omitted', async () => {
    const event = makeEvent({
      body: JSON.stringify({
        fileName: 'doc.png',
        fileType: 'image/png',
        policyName: 'Min Policy',
        policyType: 'life',
      }),
    })
    await getPresignedUrl(event)
    const [created] = mockCreatePolicy.mock.calls[0]
    expect(created.insurerName).toBe('')
    expect(created.policyNumber).toBe('')
    expect(created.premiumAmount).toBe(0)
    expect(created.sumInsured).toBe(0)
    expect(created.startDate).toBe('')
    expect(created.endDate).toBe('')
  })

  it('returns 500 when generateUploadUrl throws', async () => {
    mockGenerateUploadUrl.mockRejectedValue(new Error('S3 unavailable'))
    const event = makeEvent({
      body: JSON.stringify({
        fileName: 'policy.pdf',
        fileType: 'application/pdf',
        policyName: 'Health Plus',
        policyType: 'health',
      }),
    })
    const res = await getPresignedUrl(event)
    expect(res.statusCode).toBe(500)
    expect(JSON.parse(res.body).error).toBe('Internal server error')
  })

  it('returns 500 when createPolicy throws', async () => {
    mockCreatePolicy.mockRejectedValue(new Error('DynamoDB error'))
    const event = makeEvent({
      body: JSON.stringify({
        fileName: 'policy.pdf',
        fileType: 'application/pdf',
        policyName: 'Health Plus',
        policyType: 'health',
      }),
    })
    const res = await getPresignedUrl(event)
    expect(res.statusCode).toBe(500)
  })
})
