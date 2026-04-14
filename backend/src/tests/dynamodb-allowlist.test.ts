/**
 * Unit tests for DynamoDB helpers — specifically the field allowlist in updatePolicy
 */

// We only test the allowlist logic without actually calling DynamoDB.
// The test re-implements the allowlist check so it can be exercised in isolation.

const ALLOWED_POLICY_FIELDS = new Set([
  'status', 'extractedText', 'analysisResult',
  'policyName', 'policyType', 'insurerName', 'policyNumber',
  'premiumAmount', 'sumInsured', 'startDate', 'endDate', 's3Key',
]);

function filterAllowedKeys(updates: Record<string, unknown>): string[] {
  return Object.keys(updates).filter(k => ALLOWED_POLICY_FIELDS.has(k));
}

describe('updatePolicy allowlist', () => {
  it('passes all valid fields through', () => {
    const updates = { status: 'analyzed', analysisResult: {}, extractedText: 'text' };
    expect(filterAllowedKeys(updates)).toEqual(['status', 'analysisResult', 'extractedText']);
  });

  it('strips unknown keys', () => {
    const updates = { status: 'analyzed', userId: 'INJECTED', isAdmin: true } as any;
    expect(filterAllowedKeys(updates)).toEqual(['status']);
  });

  it('returns empty array when all keys are disallowed', () => {
    const updates = { userId: 'x', __proto__: 'x' } as any;
    expect(filterAllowedKeys(updates)).toHaveLength(0);
  });

  it('allows every field in the allowlist', () => {
    const updates: Record<string, unknown> = {};
    ALLOWED_POLICY_FIELDS.forEach(f => { updates[f] = 'v'; });
    expect(filterAllowedKeys(updates)).toHaveLength(ALLOWED_POLICY_FIELDS.size);
  });
});
