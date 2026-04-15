/**
 * Unit tests for the profile handler.
 * Covers POST (update) and GET (retrieve) paths, including:
 * – Auth enforcement
 * – Input validation
 * – Enum sanitisation (invalid values default to allowed ones)
 * – String truncation
 * – DynamoDB interaction
 */
import { handler } from '../functions/profile/handler'
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
    body: null,
    pathParameters: null,
    queryStringParameters: null,
    requestContext: {
      authorizer: { claims: { sub: 'user-123' } },
    } as any,
    ...overrides,
  } as APIGatewayProxyEvent
}

const validProfile = {
  age: 30,
  familySize: 3,
  dependents: 1,
  maritalStatus: 'married',
  annualIncome: 1200000,
  monthlyExpenses: 50000,
  savingsAmount: 200000,
  assets: 'Home',
  jobTitle: 'Software Engineer',
  industry: 'IT',
  occupationalRisk: 'low',
  travelFrequency: 'medium',
  healthStatus: 'good',
  smokingStatus: false,
  exerciseFrequency: 'weekly',
  goals: 'Secure family future',
  retirementAge: 60,
}

describe('profile handler', () => {
  beforeEach(() => jest.clearAllMocks())

  // ─── Auth & routing ────────────────────────────────────────────────

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

  it('returns 400 for unsupported HTTP methods', async () => {
    const res = await handler(makeEvent({ httpMethod: 'DELETE' }))
    expect(res.statusCode).toBe(400)
    expect(JSON.parse(res.body).error).toMatch(/Invalid HTTP method/)
  })

  // ─── POST – update profile ─────────────────────────────────────────

  describe('POST – update profile', () => {
    it('returns 400 when body is null', async () => {
      const res = await handler(makeEvent({ body: null }))
      expect(res.statusCode).toBe(400)
      expect(JSON.parse(res.body).error).toMatch(/required/)
    })

    it('returns 400 when required fields are missing', async () => {
      const res = await handler(makeEvent({ body: JSON.stringify({ age: 25 }) }))
      expect(res.statusCode).toBe(400)
      expect(JSON.parse(res.body).error).toBe('Missing required profile fields')
    })

    it('returns 400 when age is zero / falsy', async () => {
      const res = await handler(
        makeEvent({ body: JSON.stringify({ ...validProfile, age: 0 }) })
      )
      expect(res.statusCode).toBe(400)
    })

    it('sanitises invalid maritalStatus to "single"', async () => {
      mockSend.mockResolvedValue({
        Attributes: { userId: 'user-123', recommendationProfile: validProfile },
      })
      await handler(makeEvent({ body: JSON.stringify({ ...validProfile, maritalStatus: 'unknown' }) }))
      const cmd = mockSend.mock.calls[0][0]
      expect(cmd.input.ExpressionAttributeValues[':profile'].maritalStatus).toBe('single')
    })

    it('sanitises invalid occupationalRisk to "low"', async () => {
      mockSend.mockResolvedValue({
        Attributes: { userId: 'user-123', recommendationProfile: validProfile },
      })
      await handler(makeEvent({ body: JSON.stringify({ ...validProfile, occupationalRisk: 'extreme' }) }))
      const cmd = mockSend.mock.calls[0][0]
      expect(cmd.input.ExpressionAttributeValues[':profile'].occupationalRisk).toBe('low')
    })

    it('sanitises invalid travelFrequency to "low"', async () => {
      mockSend.mockResolvedValue({
        Attributes: { userId: 'user-123', recommendationProfile: validProfile },
      })
      await handler(makeEvent({ body: JSON.stringify({ ...validProfile, travelFrequency: 'always' }) }))
      const cmd = mockSend.mock.calls[0][0]
      expect(cmd.input.ExpressionAttributeValues[':profile'].travelFrequency).toBe('low')
    })

    it('sanitises invalid healthStatus to "good"', async () => {
      mockSend.mockResolvedValue({
        Attributes: { userId: 'user-123', recommendationProfile: validProfile },
      })
      await handler(makeEvent({ body: JSON.stringify({ ...validProfile, healthStatus: 'perfect' }) }))
      const cmd = mockSend.mock.calls[0][0]
      expect(cmd.input.ExpressionAttributeValues[':profile'].healthStatus).toBe('good')
    })

    it('sanitises invalid exerciseFrequency to "weekly"', async () => {
      mockSend.mockResolvedValue({
        Attributes: { userId: 'user-123', recommendationProfile: validProfile },
      })
      await handler(makeEvent({ body: JSON.stringify({ ...validProfile, exerciseFrequency: 'never' }) }))
      const cmd = mockSend.mock.calls[0][0]
      expect(cmd.input.ExpressionAttributeValues[':profile'].exerciseFrequency).toBe('weekly')
    })

    it('preserves valid enum values unchanged', async () => {
      mockSend.mockResolvedValue({
        Attributes: { userId: 'user-123', recommendationProfile: validProfile },
      })
      await handler(makeEvent({ body: JSON.stringify(validProfile) }))
      const cmd = mockSend.mock.calls[0][0]
      const stored = cmd.input.ExpressionAttributeValues[':profile']
      expect(stored.maritalStatus).toBe('married')
      expect(stored.occupationalRisk).toBe('low')
      expect(stored.travelFrequency).toBe('medium')
      expect(stored.healthStatus).toBe('good')
      expect(stored.exerciseFrequency).toBe('weekly')
    })

    it('truncates goals to 1 000 characters', async () => {
      mockSend.mockResolvedValue({
        Attributes: { userId: 'user-123', recommendationProfile: validProfile },
      })
      const longGoals = 'A'.repeat(2000)
      await handler(makeEvent({ body: JSON.stringify({ ...validProfile, goals: longGoals }) }))
      const cmd = mockSend.mock.calls[0][0]
      expect(cmd.input.ExpressionAttributeValues[':profile'].goals.length).toBeLessThanOrEqual(1000)
    })

    it('truncates jobTitle to 200 characters', async () => {
      mockSend.mockResolvedValue({
        Attributes: { userId: 'user-123', recommendationProfile: validProfile },
      })
      const longTitle = 'B'.repeat(300)
      await handler(makeEvent({ body: JSON.stringify({ ...validProfile, jobTitle: longTitle }) }))
      const cmd = mockSend.mock.calls[0][0]
      expect(cmd.input.ExpressionAttributeValues[':profile'].jobTitle.length).toBeLessThanOrEqual(200)
    })

    it('returns 200 with the stored profile on success', async () => {
      mockSend.mockResolvedValue({
        Attributes: { userId: 'user-123', recommendationProfile: validProfile },
      })
      const res = await handler(makeEvent({ body: JSON.stringify(validProfile) }))
      expect(res.statusCode).toBe(200)
      const body = JSON.parse(res.body)
      expect(body.success).toBe(true)
      expect(body.data.userId).toBe('user-123')
    })

    it('returns 500 on DynamoDB error', async () => {
      mockSend.mockRejectedValue(new Error('DynamoDB error'))
      const res = await handler(makeEvent({ body: JSON.stringify(validProfile) }))
      expect(res.statusCode).toBe(500)
    })
  })

  // ─── GET – retrieve profile ────────────────────────────────────────

  describe('GET – retrieve profile', () => {
    it('returns 404 when user record does not exist', async () => {
      mockSend.mockResolvedValue({ Item: undefined })
      const res = await handler(makeEvent({ httpMethod: 'GET' }))
      expect(res.statusCode).toBe(404)
      expect(JSON.parse(res.body).error).toBe('User not found')
    })

    it('returns 200 with the stored profile', async () => {
      mockSend.mockResolvedValue({
        Item: { userId: 'user-123', recommendationProfile: validProfile },
      })
      const res = await handler(makeEvent({ httpMethod: 'GET' }))
      expect(res.statusCode).toBe(200)
      const body = JSON.parse(res.body)
      expect(body.success).toBe(true)
      expect(body.data.userId).toBe('user-123')
      expect(body.data.profile).toEqual(validProfile)
    })

    it('returns null profile when the user exists but has not completed the questionnaire', async () => {
      mockSend.mockResolvedValue({ Item: { userId: 'user-123' } })
      const res = await handler(makeEvent({ httpMethod: 'GET' }))
      expect(res.statusCode).toBe(200)
      expect(JSON.parse(res.body).data.profile).toBeNull()
    })

    it('returns null linkedinData when no LinkedIn profile has been linked', async () => {
      mockSend.mockResolvedValue({ Item: { userId: 'user-123', recommendationProfile: validProfile } })
      const res = await handler(makeEvent({ httpMethod: 'GET' }))
      expect(JSON.parse(res.body).data.linkedinData).toBeNull()
    })

    it('returns 500 on DynamoDB error', async () => {
      mockSend.mockRejectedValue(new Error('DB error'))
      const res = await handler(makeEvent({ httpMethod: 'GET' }))
      expect(res.statusCode).toBe(500)
    })
  })
})
