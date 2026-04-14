import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { UpdateCommand, GetCommand } from "@aws-sdk/lib-dynamodb";
import { docClient } from "../../lib/dynamodb";
import { UserRecommendationProfile } from "../../types";
import { getCorsHeaders, makePreflightResponse } from "../../lib/cors";

const USERS_TABLE = `suraksha-ai-users-${process.env.ENVIRONMENT || "dev"}`;

// ─── Handle Preflight ──────────────────────────────────
export const handler = async (
  event: APIGatewayProxyEvent
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
    console.log("Profile handler invoked for userId:", userId);

    if (event.httpMethod === "POST") {
      return await updateUserProfile(userId, event.body, corsHeaders);
    } else if (event.httpMethod === "GET") {
      return await getUserProfile(userId, corsHeaders);
    }

    return {
      statusCode: 400,
      headers: corsHeaders,
      body: JSON.stringify({ error: "Invalid HTTP method" }),
    };
  } catch (error: unknown) {
    console.error("Error:", error);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ error: "Internal server error" }),
    };
  }
};

// ─── Update User Profile ───────────────────────────────
async function updateUserProfile(
  userId: string,
  body: string | null,
  corsHeaders: Record<string, string>
): Promise<APIGatewayProxyResult> {
  if (!body) {
    return {
      statusCode: 400,
      headers: corsHeaders,
      body: JSON.stringify({ error: "Request body is required" }),
    };
  }

  try {
    const rawBody = JSON.parse(body);

    // Accept only known, explicitly typed fields to prevent arbitrary data
    // from being stored in the DynamoDB user record.
    const ALLOWED_MARITAL = new Set(['single', 'married', 'divorced', 'widowed'])
    const ALLOWED_OCC_RISK = new Set(['low', 'medium', 'high'])
    const ALLOWED_TRAVEL = new Set(['low', 'medium', 'high'])
    const ALLOWED_HEALTH = new Set(['excellent', 'good', 'fair', 'poor'])
    const ALLOWED_EXERCISE = new Set(['daily', 'weekly', 'monthly', 'rarely'])

    const profile: UserRecommendationProfile = {
      age: Number(rawBody.age),
      familySize: Number(rawBody.familySize),
      dependents: Number(rawBody.dependents) || 0,
      maritalStatus: ALLOWED_MARITAL.has(rawBody.maritalStatus) ? rawBody.maritalStatus : 'single',
      annualIncome: Number(rawBody.annualIncome),
      monthlyExpenses: Number(rawBody.monthlyExpenses) || 0,
      savingsAmount: Number(rawBody.savingsAmount) || 0,
      assets: String(rawBody.assets || '').substring(0, 500),
      jobTitle: String(rawBody.jobTitle || '').substring(0, 200),
      industry: String(rawBody.industry || '').substring(0, 200),
      occupationalRisk: ALLOWED_OCC_RISK.has(rawBody.occupationalRisk) ? rawBody.occupationalRisk : 'low',
      travelFrequency: ALLOWED_TRAVEL.has(rawBody.travelFrequency) ? rawBody.travelFrequency : 'low',
      linkedinUrl: rawBody.linkedinUrl
        ? String(rawBody.linkedinUrl).substring(0, 300)
        : undefined,
      healthStatus: ALLOWED_HEALTH.has(rawBody.healthStatus) ? rawBody.healthStatus : 'good',
      smokingStatus: Boolean(rawBody.smokingStatus),
      exerciseFrequency: ALLOWED_EXERCISE.has(rawBody.exerciseFrequency) ? rawBody.exerciseFrequency : 'weekly',
      goals: String(rawBody.goals || '').substring(0, 1000),
      retirementAge: Number(rawBody.retirementAge) || 60,
    }

    // Validate required fields
    if (
      !profile.age ||
      !profile.familySize ||
      !profile.annualIncome ||
      !profile.jobTitle ||
      !profile.industry
    ) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ error: "Missing required profile fields" }),
      };
    }

    const updateParams = {
      TableName: USERS_TABLE,
      Key: { userId },
      UpdateExpression:
        "SET recommendationProfile = :profile, #ts = :timestamp",
      ExpressionAttributeNames: {
        "#ts": "updatedAt",
      },
      ExpressionAttributeValues: {
        ":profile": profile,
        ":timestamp": new Date().toISOString(),
      },
      ReturnValues: "ALL_NEW" as const,
    };

    const response = await docClient.send(new UpdateCommand(updateParams));
    const user = response.Attributes!;

    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({
        success: true,
        data: {
          userId: user.userId,
          profile: user.recommendationProfile,
        },
      }),
    };
  } catch (error: unknown) {
    console.error("Error updating profile:", error);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ error: "Failed to update profile" }),
    };
  }
}

// ─── Get User Profile ──────────────────────────────────
async function getUserProfile(
  userId: string,
  corsHeaders: Record<string, string>
): Promise<APIGatewayProxyResult> {
  try {
    const getParams = {
      TableName: USERS_TABLE,
      Key: { userId },
    };

    const response = await docClient.send(new GetCommand(getParams));

    if (!response.Item) {
      return {
        statusCode: 404,
        headers: corsHeaders,
        body: JSON.stringify({ error: "User not found" }),
      };
    }

    const user = response.Item;

    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({
        success: true,
        data: {
          userId: user.userId,
          profile: user.recommendationProfile || null,
          linkedinData: user.linkedinData || null,
        },
      }),
    };
  } catch (error: unknown) {
    console.error("Error getting profile:", error);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ error: "Failed to get profile" }),
    };
  }
}
