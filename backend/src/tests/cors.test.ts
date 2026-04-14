/**
 * Unit tests for CORS helpers
 */
import { getCorsHeaders, makePreflightResponse } from '../lib/cors';

describe('getCorsHeaders', () => {
  const original = process.env.ALLOWED_ORIGIN;

  afterEach(() => {
    process.env.ALLOWED_ORIGIN = original;
  });

  it('returns wildcard origin when ALLOWED_ORIGIN is not configured', () => {
    delete process.env.ALLOWED_ORIGIN;
    const headers = getCorsHeaders('https://example.com');
    expect(headers['Access-Control-Allow-Origin']).toBe('*');
  });

  it('reflects the matched origin when it equals ALLOWED_ORIGIN', () => {
    process.env.ALLOWED_ORIGIN = 'https://app.example.com';
    const headers = getCorsHeaders('https://app.example.com');
    expect(headers['Access-Control-Allow-Origin']).toBe('https://app.example.com');
  });

  it('omits origin header when request origin does not match ALLOWED_ORIGIN', () => {
    process.env.ALLOWED_ORIGIN = 'https://app.example.com';
    const headers = getCorsHeaders('https://evil.example.com');
    expect(headers['Access-Control-Allow-Origin']).toBeUndefined();
  });
});

describe('makePreflightResponse', () => {
  const original = process.env.ALLOWED_ORIGIN;

  afterEach(() => {
    process.env.ALLOWED_ORIGIN = original;
  });

  it('returns 200 when origin is allowed', () => {
    process.env.ALLOWED_ORIGIN = 'https://app.example.com';
    const response = makePreflightResponse('https://app.example.com');
    expect(response.statusCode).toBe(200);
  });

  it('returns 403 when origin is not allowed', () => {
    process.env.ALLOWED_ORIGIN = 'https://app.example.com';
    const response = makePreflightResponse('https://evil.example.com');
    expect(response.statusCode).toBe(403);
  });

  it('returns 200 with wildcard when no ALLOWED_ORIGIN configured', () => {
    delete process.env.ALLOWED_ORIGIN;
    const response = makePreflightResponse('https://any.example.com');
    expect(response.statusCode).toBe(200);
  });
});
