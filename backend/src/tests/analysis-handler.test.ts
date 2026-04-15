/**
 * Unit tests for the analysis handler (analyzePolicy).
 * Textract, Bedrock, and DynamoDB are fully mocked.
 */
import { analyzePolicy } from '../functions/analysis/handler'
import { extractTextFromS3 } from '../lib/textract'
import { analyzePolicyWithClaude } from '../lib/bedrock'
import { getPolicy, updatePolicy } from '../lib/dynamodb'
import { APIGatewayProxyEvent } from 'aws-lambda'

jest.mock('../lib/textract', () => ({
  extractTextFromS3: jest.fn(),
}))

jest.mock('../lib/bedrock', () => ({
  analyzePolicyWithClaude: jest.fn(),
}))

jest.mock('../lib/dynamodb', () => ({
  getPolicy: jest.fn(),
  updatePolicy: jest.fn(),
  docClient: { send: jest.fn() },
}))

const mockExtractText = extractTextFromS3 as jest.Mock
const mockAnalyze = analyzePolicyWithClaude as jest.Mock
const mockGetPolicy = getPolicy as jest.Mock
const mockUpdatePolicy = updatePolicy as jest.Mock

// A string long enough (>100 chars) to pass the minimum-text-length guard.
const LONG_TEXT = 'This is a valid insurance policy document excerpt. '.repeat(5)

const samplePolicy = {
  policyId: 'policy-abc',
  userId: 'user-123',
  policyName: 'Health Plus',
  policyType: 'health',
  s3Key: 'policies/user-123/policy-abc/document.pdf',
  insurerName: '',
  policyNumber: '',
}

const sampleAnalysis = {
  summary: 'Comprehensive health coverage.',
  summaryHindi: 'व्यापक स्वास्थ्य कवरेज।',
  coverageDetails: [],
  exclusions: [],
  claimProcess: [],
  claimSuccessProbability: 80,
  coverageGaps: [],
  recommendations: [],
  keyDates: [],
}

function makeEvent(overrides: Partial<APIGatewayProxyEvent> = {}): APIGatewayProxyEvent {
  return {
    httpMethod: 'POST',
    headers: {},
    body: null,
    pathParameters: { policyId: 'policy-abc' },
    queryStringParameters: null,
    requestContext: {
      authorizer: { claims: { sub: 'user-123' } },
    } as any,
    ...overrides,
  } as APIGatewayProxyEvent
}

describe('analyzePolicy', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockUpdatePolicy.mockResolvedValue(undefined)
  })

  // ─── Auth & routing ──────────────────────────────────

  it('returns 200 for OPTIONS preflight', async () => {
    const res = await analyzePolicy(makeEvent({ httpMethod: 'OPTIONS' }))
    expect(res.statusCode).toBe(200)
  })

  it('returns 401 when userId is absent', async () => {
    const res = await analyzePolicy(
      makeEvent({ requestContext: { authorizer: { claims: {} } } as any })
    )
    expect(res.statusCode).toBe(401)
    expect(JSON.parse(res.body).error).toBe('Unauthorized')
  })

  it('returns 400 when policyId path parameter is missing', async () => {
    const res = await analyzePolicy(makeEvent({ pathParameters: null }))
    expect(res.statusCode).toBe(400)
    expect(JSON.parse(res.body).error).toBe('Policy ID required')
  })

  // ─── Policy lookup ───────────────────────────────────

  it('returns 404 when policy does not exist', async () => {
    mockGetPolicy.mockResolvedValue(undefined)
    const res = await analyzePolicy(makeEvent())
    expect(res.statusCode).toBe(404)
    expect(JSON.parse(res.body).error).toBe('Policy not found')
  })

  it('returns 403 when policy belongs to a different user (IDOR protection)', async () => {
    mockGetPolicy.mockResolvedValue({ ...samplePolicy, userId: 'other-user' })
    const res = await analyzePolicy(makeEvent())
    expect(res.statusCode).toBe(403)
    expect(JSON.parse(res.body).error).toBe('Forbidden')
  })

  // ─── Textract failures ───────────────────────────────

  it('returns 422 and marks status=error when Textract fails', async () => {
    mockGetPolicy.mockResolvedValue(samplePolicy)
    mockExtractText.mockRejectedValue(new Error('Textract unavailable'))
    const res = await analyzePolicy(makeEvent())
    expect(res.statusCode).toBe(422)
    expect(JSON.parse(res.body).error).toMatch(/Could not read/)
    expect(mockUpdatePolicy).toHaveBeenCalledWith('policy-abc', { status: 'error' })
  })

  it('returns 422 when extracted text is too short (blank / corrupted document)', async () => {
    mockGetPolicy.mockResolvedValue(samplePolicy)
    mockExtractText.mockResolvedValue('Too short.')
    const res = await analyzePolicy(makeEvent())
    expect(res.statusCode).toBe(422)
    expect(JSON.parse(res.body).error).toMatch(/blank or contains too little text/)
    expect(mockUpdatePolicy).toHaveBeenCalledWith('policy-abc', { status: 'error' })
  })

  it('returns 422 when extracted text is exactly at the boundary (100 chars)', async () => {
    mockGetPolicy.mockResolvedValue(samplePolicy)
    // 99 chars – just below the 100-char minimum
    mockExtractText.mockResolvedValue('x'.repeat(99))
    const res = await analyzePolicy(makeEvent())
    expect(res.statusCode).toBe(422)
  })

  // ─── Claude / Bedrock responses ──────────────────────

  it('returns 422 when Claude flags the document as non-insurance content', async () => {
    mockGetPolicy.mockResolvedValue(samplePolicy)
    mockExtractText.mockResolvedValue(LONG_TEXT)
    mockAnalyze.mockResolvedValue(JSON.stringify({
      error: 'not_insurance_document',
      message: 'This is not an insurance policy.',
    }))
    const res = await analyzePolicy(makeEvent())
    expect(res.statusCode).toBe(422)
    expect(JSON.parse(res.body).error).toBe('This is not an insurance policy.')
    expect(mockUpdatePolicy).toHaveBeenCalledWith('policy-abc', { status: 'error' })
  })

  it('strips markdown code fences from Claude JSON response', async () => {
    mockGetPolicy.mockResolvedValue(samplePolicy)
    mockExtractText.mockResolvedValue(LONG_TEXT)
    mockAnalyze.mockResolvedValue('```json\n' + JSON.stringify(sampleAnalysis) + '\n```')
    const res = await analyzePolicy(makeEvent())
    expect(res.statusCode).toBe(200)
    expect(JSON.parse(res.body).analysisResult.summary).toBe('Comprehensive health coverage.')
  })

  it('handles malformed Claude JSON gracefully with a fallback object', async () => {
    mockGetPolicy.mockResolvedValue(samplePolicy)
    mockExtractText.mockResolvedValue(LONG_TEXT)
    mockAnalyze.mockResolvedValue('not { valid ] json !!!')
    const res = await analyzePolicy(makeEvent())
    expect(res.statusCode).toBe(200)
    const body = JSON.parse(res.body)
    expect(body.analysisResult.coverageDetails).toEqual([])
    expect(body.analysisResult.claimSuccessProbability).toBe(70)
  })

  // ─── Successful analysis ──────────────────────────────

  it('returns 200 and stores analysisResult with status=analyzed on success', async () => {
    mockGetPolicy.mockResolvedValue(samplePolicy)
    mockExtractText.mockResolvedValue(LONG_TEXT)
    mockAnalyze.mockResolvedValue(JSON.stringify(sampleAnalysis))
    const res = await analyzePolicy(makeEvent())
    expect(res.statusCode).toBe(200)
    const body = JSON.parse(res.body)
    expect(body.success).toBe(true)
    expect(body.policyId).toBe('policy-abc')
    expect(body.analysisResult.summary).toBe('Comprehensive health coverage.')

    // Verify the final DynamoDB update contains the right fields
    const lastUpdate = mockUpdatePolicy.mock.calls[mockUpdatePolicy.mock.calls.length - 1]
    expect(lastUpdate[0]).toBe('policy-abc')
    expect(lastUpdate[1].status).toBe('analyzed')
    expect(lastUpdate[1].analysisResult).toEqual(sampleAnalysis)
  })

  it('syncs insurerName and policyNumber from Claude when they are blank on the original record', async () => {
    mockGetPolicy.mockResolvedValue({ ...samplePolicy, insurerName: '', policyNumber: '' })
    mockExtractText.mockResolvedValue(LONG_TEXT)
    mockAnalyze.mockResolvedValue(JSON.stringify({ ...sampleAnalysis, insurerName: 'LIC', policyNumber: 'LIC-9999' }))
    await analyzePolicy(makeEvent())
    const lastUpdate = mockUpdatePolicy.mock.calls[mockUpdatePolicy.mock.calls.length - 1]
    expect(lastUpdate[1].insurerName).toBe('LIC')
    expect(lastUpdate[1].policyNumber).toBe('LIC-9999')
  })

  it('does not overwrite an existing insurerName or policyNumber with Claude values', async () => {
    mockGetPolicy.mockResolvedValue({ ...samplePolicy, insurerName: 'Existing Insurer', policyNumber: 'EXISTING-001' })
    mockExtractText.mockResolvedValue(LONG_TEXT)
    mockAnalyze.mockResolvedValue(JSON.stringify({ ...sampleAnalysis, insurerName: 'New Insurer', policyNumber: 'NEW-001' }))
    await analyzePolicy(makeEvent())
    const lastUpdate = mockUpdatePolicy.mock.calls[mockUpdatePolicy.mock.calls.length - 1]
    expect(lastUpdate[1].insurerName).toBeUndefined()
    expect(lastUpdate[1].policyNumber).toBeUndefined()
  })

  it('sets status=processing before calling Textract', async () => {
    mockGetPolicy.mockResolvedValue(samplePolicy)
    mockExtractText.mockResolvedValue(LONG_TEXT)
    mockAnalyze.mockResolvedValue(JSON.stringify(sampleAnalysis))
    await analyzePolicy(makeEvent())
    // First updatePolicy call must be the processing status update
    expect(mockUpdatePolicy.mock.calls[0]).toEqual(['policy-abc', { status: 'processing' }])
  })

  // ─── Unexpected errors ───────────────────────────────

  it('returns 500 and marks status=error when Claude throws', async () => {
    mockGetPolicy.mockResolvedValue(samplePolicy)
    mockExtractText.mockResolvedValue(LONG_TEXT)
    mockAnalyze.mockRejectedValue(new Error('Bedrock throttled'))
    const res = await analyzePolicy(makeEvent())
    expect(res.statusCode).toBe(500)
    expect(JSON.parse(res.body).error).toBe('Internal server error')
    expect(mockUpdatePolicy).toHaveBeenCalledWith('policy-abc', { status: 'error' })
  })
})
