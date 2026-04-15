/**
 * Unit tests for the LinkedIn handler.
 * Covers:
 * – Auth enforcement
 * – URL validation
 * – Salary-band inference (indirectly, since inferSalaryBand is private)
 * – DynamoDB persistence
 */
import { handler } from '../functions/linkedin/handler'
import { docClient } from '../lib/dynamodb'
import { APIGatewayProxyEvent } from 'aws-lambda'

jest.mock('../lib/dynamodb', () => ({
  docClient: { send: jest.fn() },
}))

const mockSend = docClient.send as jest.Mock

function makeEvent(overrides: Partial<APIGatewayProxyEvent> = {}): APIGatewayProxyEvent {
  return {
    httpMethod: 'POST',
    headers: {},
    body: JSON.stringify({ linkedinUrl: 'https://www.linkedin.com/in/johndoe' }),
    pathParameters: null,
    queryStringParameters: null,
    requestContext: {
      authorizer: { claims: { sub: 'user-123' } },
    } as any,
    ...overrides,
  } as APIGatewayProxyEvent
}

describe('LinkedIn handler – auth & routing', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockSend.mockResolvedValue({})
  })

  it('returns 401 when userId is absent', async () => {
    const res = await handler(
      makeEvent({ requestContext: { authorizer: { claims: {} } } as any })
    )
    expect(res.statusCode).toBe(401)
    expect(JSON.parse(res.body).error).toBe('Unauthorized')
  })

  it('returns 200 for OPTIONS preflight', async () => {
    const res = await handler(makeEvent({ httpMethod: 'OPTIONS' }))
    expect(res.statusCode).toBe(200)
  })

  it('returns 400 for non-POST requests', async () => {
    const res = await handler(makeEvent({ httpMethod: 'GET', body: null }))
    expect(res.statusCode).toBe(400)
    expect(JSON.parse(res.body).error).toBe('Invalid request')
  })
})

describe('LinkedIn handler – URL validation', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockSend.mockResolvedValue({})
  })

  it('returns 400 when linkedinUrl is missing from the body', async () => {
    const res = await handler(makeEvent({ body: JSON.stringify({}) }))
    expect(res.statusCode).toBe(400)
    expect(JSON.parse(res.body).error).toMatch(/LinkedIn URL is required/)
  })

  it('returns 400 when the URL does not contain linkedin.com', async () => {
    const res = await handler(
      makeEvent({ body: JSON.stringify({ linkedinUrl: 'https://evil.example.com/profile' }) })
    )
    expect(res.statusCode).toBe(400)
    expect(JSON.parse(res.body).error).toMatch(/Invalid LinkedIn URL/)
  })

  it('accepts any URL that contains linkedin.com', async () => {
    const res = await handler(
      makeEvent({ body: JSON.stringify({ linkedinUrl: 'https://linkedin.com/in/someone' }) })
    )
    expect(res.statusCode).toBe(200)
  })
})

describe('LinkedIn handler – successful analysis', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockSend.mockResolvedValue({})
  })

  it('returns 200 with linkedinData and a salary estimate', async () => {
    const res = await handler(makeEvent())
    expect(res.statusCode).toBe(200)
    const body = JSON.parse(res.body)
    expect(body.success).toBe(true)
    expect(body.data.linkedinData).toBeDefined()
    expect(body.data.salaryEstimate).toBeDefined()
  })

  it('marks the returned linkedinData as simulated', async () => {
    const res = await handler(makeEvent())
    const { linkedinData } = JSON.parse(res.body).data
    expect(linkedinData.isSimulated).toBe(true)
  })

  it('persists the LinkedIn data and salary estimate in DynamoDB', async () => {
    const url = 'https://www.linkedin.com/in/johndoe'
    await handler(makeEvent({ body: JSON.stringify({ linkedinUrl: url }) }))
    expect(mockSend).toHaveBeenCalledTimes(1)
    const cmd = mockSend.mock.calls[0][0]
    const vals = cmd.input.ExpressionAttributeValues
    expect(vals[':linkedin'].profileUrl).toBe(url)
    expect(vals[':linkedin'].isSimulated).toBe(true)
    expect(vals[':salary']).toHaveProperty('min')
    expect(vals[':salary']).toHaveProperty('max')
    expect(vals[':salary'].currency).toBe('INR')
  })

  it('returns 500 on DynamoDB error', async () => {
    mockSend.mockRejectedValue(new Error('DynamoDB error'))
    const res = await handler(makeEvent())
    expect(res.statusCode).toBe(500)
    expect(JSON.parse(res.body).error).toMatch(/Failed to analyze LinkedIn/)
  })
})

// ─── Salary-band inference (tested indirectly through the handler) ──────────
//
// The mock LinkedIn extractor always returns:
//   { jobTitle: 'Software Engineer', industry: 'IT', experienceYears: 5 }
// The SALARY_LOOKUP table maps this to the "5-8" experience bracket:
//   IT > Software Engineer > 5-8: { min: 1_300_000, max: 2_000_000 }

describe('LinkedIn handler – salary-band inference', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockSend.mockResolvedValue({})
  })

  it('returns a salary band with numeric min and max values', async () => {
    const res = await handler(makeEvent())
    const { salaryEstimate } = JSON.parse(res.body).data
    expect(typeof salaryEstimate.min).toBe('number')
    expect(typeof salaryEstimate.max).toBe('number')
    expect(salaryEstimate.max).toBeGreaterThan(salaryEstimate.min)
  })

  it('returns INR as the currency', async () => {
    const res = await handler(makeEvent())
    expect(JSON.parse(res.body).data.salaryEstimate.currency).toBe('INR')
  })

  it('returns the correct band for IT / Software Engineer / 5 years of experience', async () => {
    // SALARY_LOOKUP: IT > "Software Engineer" > "5-8": { min: 1300000, max: 2000000 }
    const res = await handler(makeEvent())
    const { salaryEstimate } = JSON.parse(res.body).data
    expect(salaryEstimate.min).toBe(1300000)
    expect(salaryEstimate.max).toBe(2000000)
  })
})
