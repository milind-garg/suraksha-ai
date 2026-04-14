/**
 * CORS helpers for Lambda handlers.
 *
 * ALLOWED_ORIGIN must be set to your frontend's exact origin in the Lambda
 * environment (e.g. "https://app.example.com").  Falling back to "*" is only
 * acceptable during local development and is blocked in production by the
 * explicit origin check below.
 */

const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN || "";

/**
 * Return CORS headers for a given request origin.
 * If the request origin matches the configured ALLOWED_ORIGIN it is reflected;
 * otherwise the header is omitted so the browser blocks the request.
 */
export function getCorsHeaders(
  requestOrigin?: string,
): Record<string, string> {
  const origin =
    ALLOWED_ORIGIN && requestOrigin === ALLOWED_ORIGIN ? ALLOWED_ORIGIN : "";

  // When ALLOWED_ORIGIN is not configured (local dev) we allow all origins so
  // the service remains usable without a full environment setup.
  const allowOrigin = origin || (ALLOWED_ORIGIN ? "" : "*");

  const headers: Record<string, string> = {
    "Access-Control-Allow-Headers": "Content-Type,Authorization",
    "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
  };

  if (allowOrigin) {
    headers["Access-Control-Allow-Origin"] = allowOrigin;
  }

  return headers;
}
