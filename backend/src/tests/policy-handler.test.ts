/**
 * Unit tests for the policy handler:
 *   listPolicies, getPolicyById, deletePolicyById
 *
 * AWS dependencies (DynamoDB, S3) are fully mocked.
 */
import { listPolicies, getPolicyById, deletePolicyById } from '../functions/policy/handler'
import { getPolicy, getUserPolicies, deletePolicy } from '../lib/dynamodb'
import { deleteS3Object, generateDownloadUrl } from '../lib/s3'
import { APIGatewayProxyEvent } from 'aws-lambda'

jest.mock('../lib/dynamodb', () => ({
  getPolicy: jest.fn(),
  getUserPolicies: jest.fn(),
  deletePolicy: jest.fn(),
  docClient: { send: jest.fn() },
}))

jest.mock('../lib/s3', () => ({
  deleteS3Object: jest.fn(),
  generateDownloadUrl: jest.fn(),
}))

const mockGetPolicy = getPolicy as jest.Mock
const mockGetUserPolicies = getUserPolicies as jest.Mock
const mockDeletePolicy = deletePolicy as jest.Mock
const mockDeleteS3Object = deleteS3Object as jest.Mock
const mockGenerateDownloadUrl = generateDownloadUrl as jest.Mock

function makeEvent(overrides: Partial<APIGatewayProxyEvent> = {}): APIGatewayProxyEvent {
  return {
    httpMethod: 'GET',
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

const samplePolicy = {
  policyId: 'policy-abc',
  userId: 'user-123',
  policyName: 'Health Plus',
  policyType: 'health',
  s3Key: 'policies/user-123/policy-abc/document.pdf',
  status: 'analyzed',
}

// ─── listPolicies ──────────────────────────────────────────────

describe('listPolicies', () => {
  beforeEach(() => jest.clearAllMocks())

  it('returns 200 for OPTIONS preflight', async () => {
    const res = await listPolicies(makeEvent({ httpMethod: 'OPTIONS' }))
    expect(res.statusCode).toBe(200)
  })

  it('returns 401 when userId is absent', async () => {
    const res = await listPolicies(
      makeEvent({ requestContext: { authorizer: { claims: {} } } as any })
    )
    expect(res.statusCode).toBe(401)
    expect(JSON.parse(res.body).error).toBe('Unauthorized')
  })

  it('returns 200 with the user\'s policies', async () => {
    mockGetUserPolicies.mockResolvedValue([samplePolicy])
    const res = await listPolicies(makeEvent())
    expect(res.statusCode).toBe(200)
    const body = JSON.parse(res.body)
    expect(body.success).toBe(true)
    expect(body.data).toHaveLength(1)
    expect(body.data[0].policyId).toBe('policy-abc')
  })

  it('returns 200 with empty array when user has no policies', async () => {
    mockGetUserPolicies.mockResolvedValue([])
    const res = await listPolicies(makeEvent())
    expect(res.statusCode).toBe(200)
    expect(JSON.parse(res.body).data).toEqual([])
  })

  it('returns 500 when DynamoDB throws', async () => {
    mockGetUserPolicies.mockRejectedValue(new Error('DB error'))
    const res = await listPolicies(makeEvent())
    expect(res.statusCode).toBe(500)
    expect(JSON.parse(res.body).error).toBe('Internal server error')
  })
})

// ─── getPolicyById ─────────────────────────────────────────────

describe('getPolicyById', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockGenerateDownloadUrl.mockResolvedValue('https://s3.example.com/download')
  })

  it('returns 200 for OPTIONS preflight', async () => {
    const res = await getPolicyById(makeEvent({ httpMethod: 'OPTIONS' }))
    expect(res.statusCode).toBe(200)
  })

  it('returns 401 when not authenticated', async () => {
    const res = await getPolicyById(
      makeEvent({ requestContext: { authorizer: { claims: {} } } as any })
    )
    expect(res.statusCode).toBe(401)
  })

  it('returns 400 when policyId path parameter is missing', async () => {
    const res = await getPolicyById(makeEvent({ pathParameters: null }))
    expect(res.statusCode).toBe(400)
    expect(JSON.parse(res.body).error).toBe('Policy ID required')
  })

  it('returns 404 when policy does not exist', async () => {
    mockGetPolicy.mockResolvedValue(undefined)
    const res = await getPolicyById(makeEvent({ pathParameters: { policyId: 'ghost' } }))
    expect(res.statusCode).toBe(404)
    expect(JSON.parse(res.body).error).toBe('Policy not found')
  })

  it('returns 403 when policy belongs to a different user (IDOR protection)', async () => {
    mockGetPolicy.mockResolvedValue({ ...samplePolicy, userId: 'other-user' })
    const res = await getPolicyById(makeEvent({ pathParameters: { policyId: 'policy-abc' } }))
    expect(res.statusCode).toBe(403)
    expect(JSON.parse(res.body).error).toBe('Forbidden')
  })

  it('returns 200 with policy and a signed download URL', async () => {
    mockGetPolicy.mockResolvedValue(samplePolicy)
    const res = await getPolicyById(makeEvent({ pathParameters: { policyId: 'policy-abc' } }))
    expect(res.statusCode).toBe(200)
    const body = JSON.parse(res.body)
    expect(body.success).toBe(true)
    expect(body.data.policyId).toBe('policy-abc')
    expect(body.data.documentUrl).toBe('https://s3.example.com/download')
    expect(mockGenerateDownloadUrl).toHaveBeenCalledWith(samplePolicy.s3Key)
  })

  it('returns 200 without documentUrl when s3Key is absent', async () => {
    const { s3Key: _omit, ...noS3Policy } = samplePolicy
    mockGetPolicy.mockResolvedValue(noS3Policy)
    const res = await getPolicyById(makeEvent({ pathParameters: { policyId: 'policy-abc' } }))
    expect(res.statusCode).toBe(200)
    expect(JSON.parse(res.body).data.documentUrl).toBeUndefined()
    expect(mockGenerateDownloadUrl).not.toHaveBeenCalled()
  })

  it('does not mutate the original DynamoDB item when adding documentUrl', async () => {
    mockGetPolicy.mockResolvedValue(samplePolicy)
    await getPolicyById(makeEvent({ pathParameters: { policyId: 'policy-abc' } }))
    expect((samplePolicy as any).documentUrl).toBeUndefined()
  })

  it('returns 500 on unexpected error', async () => {
    mockGetPolicy.mockRejectedValue(new Error('DB error'))
    const res = await getPolicyById(makeEvent({ pathParameters: { policyId: 'policy-abc' } }))
    expect(res.statusCode).toBe(500)
  })
})

// ─── deletePolicyById ──────────────────────────────────────────

describe('deletePolicyById', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockDeleteS3Object.mockResolvedValue(undefined)
    mockDeletePolicy.mockResolvedValue(undefined)
  })

  it('returns 200 for OPTIONS preflight', async () => {
    const res = await deletePolicyById(makeEvent({ httpMethod: 'OPTIONS' }))
    expect(res.statusCode).toBe(200)
  })

  it('returns 401 when not authenticated', async () => {
    const res = await deletePolicyById(
      makeEvent({ requestContext: { authorizer: { claims: {} } } as any })
    )
    expect(res.statusCode).toBe(401)
  })

  it('returns 400 when policyId is missing', async () => {
    const res = await deletePolicyById(makeEvent({ pathParameters: null }))
    expect(res.statusCode).toBe(400)
    expect(JSON.parse(res.body).error).toBe('Policy ID required')
  })

  it('returns 404 when policy does not exist', async () => {
    mockGetPolicy.mockResolvedValue(undefined)
    const res = await deletePolicyById(makeEvent({ pathParameters: { policyId: 'ghost' } }))
    expect(res.statusCode).toBe(404)
  })

  it('returns 403 when policy belongs to a different user (IDOR protection)', async () => {
    mockGetPolicy.mockResolvedValue({ ...samplePolicy, userId: 'other-user' })
    const res = await deletePolicyById(makeEvent({ pathParameters: { policyId: 'policy-abc' } }))
    expect(res.statusCode).toBe(403)
  })

  it('returns 200 and deletes both the S3 object and DynamoDB record', async () => {
    mockGetPolicy.mockResolvedValue(samplePolicy)
    const res = await deletePolicyById(makeEvent({ pathParameters: { policyId: 'policy-abc' } }))
    expect(res.statusCode).toBe(200)
    expect(JSON.parse(res.body).success).toBe(true)
    expect(mockDeleteS3Object).toHaveBeenCalledWith(samplePolicy.s3Key)
    expect(mockDeletePolicy).toHaveBeenCalledWith('policy-abc')
  })

  it('still deletes the DynamoDB record even when S3 deletion fails', async () => {
    mockGetPolicy.mockResolvedValue(samplePolicy)
    mockDeleteS3Object.mockRejectedValue(new Error('S3 failure'))
    const res = await deletePolicyById(makeEvent({ pathParameters: { policyId: 'policy-abc' } }))
    expect(res.statusCode).toBe(200)
    expect(mockDeletePolicy).toHaveBeenCalledWith('policy-abc')
  })

  it('skips S3 deletion when s3Key is absent', async () => {
    const { s3Key: _omit, ...noS3Policy } = samplePolicy
    mockGetPolicy.mockResolvedValue(noS3Policy)
    const res = await deletePolicyById(makeEvent({ pathParameters: { policyId: 'policy-abc' } }))
    expect(res.statusCode).toBe(200)
    expect(mockDeleteS3Object).not.toHaveBeenCalled()
    expect(mockDeletePolicy).toHaveBeenCalledWith('policy-abc')
  })

  it('returns 500 on unexpected DynamoDB error', async () => {
    mockGetPolicy.mockRejectedValue(new Error('DB error'))
    const res = await deletePolicyById(makeEvent({ pathParameters: { policyId: 'policy-abc' } }))
    expect(res.statusCode).toBe(500)
  })
})
