/**
 * Unit tests for the recommendations library:
 *   getUserCoverageMetrics, getPeerComparison
 *
 * The DynamoDBClient is mocked so no real AWS calls are made.
 * `unmarshall` is stubbed as a passthrough so test items can be
 * plain JS objects instead of DynamoDB AttributeValue maps.
 */

const mockSend = jest.fn()

jest.mock('@aws-sdk/client-dynamodb', () => ({
  DynamoDBClient: jest.fn(() => ({ send: mockSend })),
  QueryCommand: jest.fn((input: unknown) => ({ input })),
  ScanCommand: jest.fn((input: unknown) => ({ input })),
}))

jest.mock('@aws-sdk/util-dynamodb', () => ({
  unmarshall: jest.fn((item: Record<string, unknown>) => item),
}))

import { getUserCoverageMetrics, getPeerComparison } from '../lib/recommendations'

// ─── getUserCoverageMetrics ────────────────────────────────────────────────

describe('getUserCoverageMetrics', () => {
  beforeEach(() => jest.clearAllMocks())

  it('returns all-zero metrics when the user has no policies', async () => {
    mockSend.mockResolvedValue({ Items: [] })
    const result = await getUserCoverageMetrics('user-123')
    expect(result).toEqual({ health: 0, life: 0, vehicle: 0, home: 0, travel: 0, total: 0 })
  })

  it('correctly aggregates coverage amounts by policy type', async () => {
    mockSend.mockResolvedValue({
      Items: [
        { policyType: 'health', sumInsured: 500000 },
        { policyType: 'life', sumInsured: 5000000 },
        { policyType: 'vehicle', sumInsured: 300000 },
        { policyType: 'home', sumInsured: 1000000 },
        { policyType: 'travel', sumInsured: 100000 },
      ],
    })
    const result = await getUserCoverageMetrics('user-123')
    expect(result.health).toBe(500000)
    expect(result.life).toBe(5000000)
    expect(result.vehicle).toBe(300000)
    expect(result.home).toBe(1000000)
    expect(result.travel).toBe(100000)
    expect(result.total).toBe(6900000)
  })

  it('accumulates multiple policies of the same type', async () => {
    mockSend.mockResolvedValue({
      Items: [
        { policyType: 'health', sumInsured: 300000 },
        { policyType: 'health', sumInsured: 200000 },
      ],
    })
    const result = await getUserCoverageMetrics('user-123')
    expect(result.health).toBe(500000)
    expect(result.total).toBe(500000)
  })

  it('handles policyType case-insensitively', async () => {
    mockSend.mockResolvedValue({
      Items: [
        { policyType: 'Health', sumInsured: 300000 },
        { policyType: 'LIFE', sumInsured: 2000000 },
        { policyType: 'Vehicle', sumInsured: 150000 },
      ],
    })
    const result = await getUserCoverageMetrics('user-123')
    expect(result.health).toBe(300000)
    expect(result.life).toBe(2000000)
    expect(result.vehicle).toBe(150000)
  })

  it('treats a missing sumInsured as 0', async () => {
    mockSend.mockResolvedValue({
      Items: [{ policyType: 'health' }],
    })
    const result = await getUserCoverageMetrics('user-123')
    expect(result.health).toBe(0)
    expect(result.total).toBe(0)
  })

  it('returns all-zero metrics on a DynamoDB error (graceful fallback)', async () => {
    mockSend.mockRejectedValue(new Error('DynamoDB error'))
    const result = await getUserCoverageMetrics('user-123')
    expect(result).toEqual({ health: 0, life: 0, vehicle: 0, home: 0, travel: 0, total: 0 })
  })

  it('ignores unrecognised policy types in the totals but includes them in total', async () => {
    mockSend.mockResolvedValue({
      Items: [{ policyType: 'other', sumInsured: 50000 }],
    })
    const result = await getUserCoverageMetrics('user-123')
    // 'other' does not increment any named bucket, but does add to total
    expect(result.health).toBe(0)
    expect(result.life).toBe(0)
    expect(result.total).toBe(50000)
  })
})

// ─── getPeerComparison ─────────────────────────────────────────────────────

describe('getPeerComparison', () => {
  beforeEach(() => jest.clearAllMocks())

  const baseProfile = {
    age: 30,
    annualIncome: 1000000,
    industry: 'IT',
    occupationalRisk: 'low' as const,
  }

  it('returns default estimates (isEstimate=true) when no peers are found', async () => {
    mockSend.mockResolvedValue({ Items: [] })
    const result = await getPeerComparison(baseProfile)
    expect(result.isEstimate).toBe(true)
    expect(result.sampleSize).toBe(0)
    expect(result.avgHealthCoverage).toBe(500000)
    expect(result.avgLifeInsurance).toBe(5000000)
    expect(result.avgVehicleInsurance).toBe(300000)
    expect(result.avgHomeInsurance).toBe(1000000)
  })

  it('returns default estimates on a network / DynamoDB error', async () => {
    mockSend.mockRejectedValue(new Error('Network error'))
    const result = await getPeerComparison(baseProfile)
    expect(result.isEstimate).toBe(true)
    expect(result.sampleSize).toBe(0)
  })

  it('filters out peers whose age falls outside the ±5-year window', async () => {
    mockSend
      // scan returns two users; only the in-range one should survive filtering
      .mockResolvedValueOnce({
        Items: [
          { userId: 'peer-in', recommendationProfile: { age: 30, annualIncome: 1000000 } },
          { userId: 'peer-out', recommendationProfile: { age: 50, annualIncome: 1000000 } },
        ],
      })
      // policy query for the surviving peer (empty)
      .mockResolvedValueOnce({ Items: [] })

    const result = await getPeerComparison(baseProfile)
    expect(result.sampleSize).toBe(1)
    expect(result.isEstimate).toBe(false)
  })

  it('filters out peers whose income falls outside the ±20% window', async () => {
    mockSend
      .mockResolvedValueOnce({
        Items: [
          // income within ±20% of 1_000_000 (800_000–1_200_000)
          { userId: 'peer-in', recommendationProfile: { age: 30, annualIncome: 900000 } },
          // income outside the window
          { userId: 'peer-out', recommendationProfile: { age: 30, annualIncome: 500000 } },
        ],
      })
      .mockResolvedValueOnce({ Items: [] })

    const result = await getPeerComparison(baseProfile)
    expect(result.sampleSize).toBe(1)
  })

  it('ignores users who have no recommendationProfile', async () => {
    mockSend.mockResolvedValueOnce({
      Items: [
        { userId: 'peer-no-profile' }, // no recommendationProfile
      ],
    })

    const result = await getPeerComparison(baseProfile)
    expect(result.sampleSize).toBe(0)
    expect(result.isEstimate).toBe(true)
  })

  it('correctly aggregates health coverage across multiple peers', async () => {
    mockSend
      // scan – two in-range peers
      .mockResolvedValueOnce({
        Items: [
          { userId: 'peer-1', recommendationProfile: { age: 30, annualIncome: 1000000 } },
          { userId: 'peer-2', recommendationProfile: { age: 28, annualIncome: 950000 } },
        ],
      })
      // policies for peer-1
      .mockResolvedValueOnce({ Items: [{ policyType: 'health', sumInsured: 600000 }] })
      // policies for peer-2
      .mockResolvedValueOnce({ Items: [{ policyType: 'health', sumInsured: 400000 }] })

    const result = await getPeerComparison(baseProfile)
    expect(result.sampleSize).toBe(2)
    expect(result.avgHealthCoverage).toBe(500000) // (600000 + 400000) / 2
    expect(result.isEstimate).toBe(false)
  })
})
