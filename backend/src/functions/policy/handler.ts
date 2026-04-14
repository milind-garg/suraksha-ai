import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { getPolicy, getUserPolicies, deletePolicy } from "../../lib/dynamodb";
import { deleteS3Object, generateDownloadUrl } from "../../lib/s3";
import { getCorsHeaders, makePreflightResponse } from "../../lib/cors";

// ─── GET /policies ────────────────────────────────────
export const listPolicies = async (
  event: APIGatewayProxyEvent,
): Promise<APIGatewayProxyResult> => {
  const requestOrigin = event.headers?.origin ?? event.headers?.Origin;
  const corsHeaders = getCorsHeaders(requestOrigin);

  if (event.httpMethod === "OPTIONS") {
    return makePreflightResponse(requestOrigin);
  }

  const userId = event.requestContext?.authorizer?.claims?.sub;
  if (!userId) {
    return {
      statusCode: 401,
      headers: corsHeaders,
      body: JSON.stringify({ error: "Unauthorized" }),
    };
  }

  try {
    const policies = await getUserPolicies(userId);

    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({ success: true, data: policies }),
    };
  } catch (error: unknown) {
    console.error("listPolicies error:", error);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ error: "Internal server error" }),
    };
  }
};

// ─── GET /policies/:policyId ──────────────────────────
export const getPolicyById = async (
  event: APIGatewayProxyEvent,
): Promise<APIGatewayProxyResult> => {
  const requestOrigin = event.headers?.origin ?? event.headers?.Origin;
  const corsHeaders = getCorsHeaders(requestOrigin);

  if (event.httpMethod === "OPTIONS") {
    return makePreflightResponse(requestOrigin);
  }

  const userId = event.requestContext?.authorizer?.claims?.sub;
  if (!userId) {
    return {
      statusCode: 401,
      headers: corsHeaders,
      body: JSON.stringify({ error: "Unauthorized" }),
    };
  }

  try {
    const policyId = event.pathParameters?.policyId;
    if (!policyId) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ error: "Policy ID required" }),
      };
    }

    const policy = await getPolicy(policyId);
    if (!policy) {
      return {
        statusCode: 404,
        headers: corsHeaders,
        body: JSON.stringify({ error: "Policy not found" }),
      };
    }

    // Ownership check – prevents IDOR
    if (policy.userId !== userId) {
      return {
        statusCode: 403,
        headers: corsHeaders,
        body: JSON.stringify({ error: "Forbidden" }),
      };
    }

    // Generate download URL if S3 key exists.
    // Spread into a new object so the DynamoDB Item reference is not mutated.
    const responseData = { ...policy }
    if (policy.s3Key) {
      responseData.documentUrl = await generateDownloadUrl(policy.s3Key);
    }

    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({ success: true, data: responseData }),
    };
  } catch (error: unknown) {
    console.error("getPolicyById error:", error);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ error: "Internal server error" }),
    };
  }
};

// ─── DELETE /policies/:policyId ───────────────────────
export const deletePolicyById = async (
  event: APIGatewayProxyEvent,
): Promise<APIGatewayProxyResult> => {
  const requestOrigin = event.headers?.origin ?? event.headers?.Origin;
  const corsHeaders = getCorsHeaders(requestOrigin);

  if (event.httpMethod === "OPTIONS") {
    return makePreflightResponse(requestOrigin);
  }

  const userId = event.requestContext?.authorizer?.claims?.sub;
  if (!userId) {
    return {
      statusCode: 401,
      headers: corsHeaders,
      body: JSON.stringify({ error: "Unauthorized" }),
    };
  }

  try {
    const policyId = event.pathParameters?.policyId;
    if (!policyId) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ error: "Policy ID required" }),
      };
    }

    const policy = await getPolicy(policyId);
    if (!policy) {
      return {
        statusCode: 404,
        headers: corsHeaders,
        body: JSON.stringify({ error: "Policy not found" }),
      };
    }

    if (policy.userId !== userId) {
      return {
        statusCode: 403,
        headers: corsHeaders,
        body: JSON.stringify({ error: "Forbidden" }),
      };
    }

    if (policy.s3Key) {
      await deleteS3Object(policy.s3Key).catch(() => {});
    }

    await deletePolicy(policyId);

    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({ success: true, message: "Policy deleted" }),
    };
  } catch (error: unknown) {
    console.error("deletePolicyById error:", error);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ error: "Internal server error" }),
    };
  }
};
