import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { getPolicy, getUserPolicies, deletePolicy } from "../../lib/dynamodb";
import { deleteS3Object, generateDownloadUrl } from "../../lib/s3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type,Authorization",
  "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
};

// ─── GET /policies ────────────────────────────────────
export const listPolicies = async (
  event: APIGatewayProxyEvent,
): Promise<APIGatewayProxyResult> => {
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers: corsHeaders, body: "" };
  }

  try {
    const userId = event.requestContext?.authorizer?.claims?.sub || "demo-user";
    const policies = await getUserPolicies(userId);

    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({ success: true, data: policies }),
    };
  } catch (error: any) {
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ error: error.message }),
    };
  }
};

// ─── GET /policies/:policyId ──────────────────────────
export const getPolicyById = async (
  event: APIGatewayProxyEvent,
): Promise<APIGatewayProxyResult> => {
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers: corsHeaders, body: "" };
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

    // Generate download URL if S3 key exists
    if (policy.s3Key) {
      policy.documentUrl = await generateDownloadUrl(policy.s3Key);
    }

    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({ success: true, data: policy }),
    };
  } catch (error: any) {
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ error: error.message }),
    };
  }
};

// ─── DELETE /policies/:policyId ───────────────────────
export const deletePolicyById = async (
  event: APIGatewayProxyEvent,
): Promise<APIGatewayProxyResult> => {
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers: corsHeaders, body: "" };
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
    if (policy?.s3Key) {
      await deleteS3Object(policy.s3Key).catch(() => {});
    }

    await deletePolicy(policyId);

    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({ success: true, message: "Policy deleted" }),
    };
  } catch (error: any) {
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ error: error.message }),
    };
  }
};
