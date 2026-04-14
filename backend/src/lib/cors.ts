/**
 * CORS helpers for Lambda handlers.
 *
 * ALLOWED_ORIGIN must be set to your frontend's exact origin in the Lambda
 * environment (e.g. "https://app.example.com").  Falling back to "*" is only
 * acceptable during local development and is blocked in production by the
 * explicit origin check below.
 *
 * The environment variable is read inside each helper (not at module-load time)
 * so that unit tests and hot-reloaded Lambda containers see current values.
 */

/**
 * Return CORS headers for a given request origin.
 * If the request origin matches the configured ALLOWED_ORIGIN it is reflected;
 * otherwise the header is omitted so the browser blocks the request.
 */
export function getCorsHeaders(
  requestOrigin?: string,
): Record<string, string> {
  // Read dynamically so tests can change process.env.ALLOWED_ORIGIN between calls.
  const allowedOrigin = process.env.ALLOWED_ORIGIN || "";

  const origin =
    allowedOrigin && requestOrigin === allowedOrigin ? allowedOrigin : "";

  // When ALLOWED_ORIGIN is not configured (local dev) we allow all origins so
  // the service remains usable without a full environment setup.
  const allowOrigin = origin || (allowedOrigin ? "" : "*");

  const headers: Record<string, string> = {
    "Access-Control-Allow-Headers": "Content-Type,Authorization",
    "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
  };

  if (allowOrigin) {
    headers["Access-Control-Allow-Origin"] = allowOrigin;
  }

  return headers;
}

/**
 * Return a 403 Forbidden response for OPTIONS preflight requests whose origin
 * does not match ALLOWED_ORIGIN.  This gives the browser a clear signal
 * instead of a 200 with no CORS header (which causes a confusing network error).
 */
export function makePreflightResponse(requestOrigin?: string): {
  statusCode: number;
  headers: Record<string, string>;
  body: string;
} {
  const corsHeaders = getCorsHeaders(requestOrigin);
  const originAllowed = "Access-Control-Allow-Origin" in corsHeaders;

  return {
    statusCode: originAllowed ? 200 : 403,
    headers: corsHeaders,
    body: originAllowed ? "" : JSON.stringify({ error: "Origin not allowed" }),
  };
}
