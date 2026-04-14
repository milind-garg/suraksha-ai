import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { UpdateCommand, GetCommand } from "@aws-sdk/lib-dynamodb";
import { docClient } from "../../lib/dynamodb";
import { UserRecommendationProfile } from "../../../types";

const USERS_TABLE = `suraksha-ai-users-${process.env.ENVIRONMENT || "dev"}`;

// ─── CORS Headers ──────────────────────────────────────
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

// ─── Handle Preflight ──────────────────────────────────
export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({ message: "OK" }),
    };
  }

  try {
    const userId =
      event.requestContext?.authorizer?.claims?.sub || "demo-user";

    console.log("Profile handler invoked for userId:", userId);

    if (event.httpMethod === "POST") {
      return await updateUserProfile(userId, event.body);
    } else if (event.httpMethod === "GET") {
      return await getUserProfile(userId);
    }

    return {
      statusCode: 400,
      headers: corsHeaders,
      body: JSON.stringify({ error: "Invalid HTTP method" }),
    };
  } catch (error: any) {
    console.error("Error:", error);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({
        error: "Internal server error",
        message: error.message,
      }),
    };
  }
};

// ─── Update User Profile ───────────────────────────────
async function updateUserProfile(
  userId: string,
  body: string | null
): Promise<APIGatewayProxyResult> {
  if (!body) {
    return {
      statusCode: 400,
      headers: corsHeaders,
      body: JSON.stringify({ error: "Request body is required" }),
    };
  }

  try {
    const profile: UserRecommendationProfile = JSON.parse(body);

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
  } catch (error: any) {
    console.error("Error updating profile:", error);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({
        error: "Failed to update profile",
        message: error.message,
      }),
    };
  }
}

// ─── Get User Profile ──────────────────────────────────
async function getUserProfile(
  userId: string
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
  } catch (error: any) {
    console.error("Error getting profile:", error);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({
        error: "Failed to get profile",
        message: error.message,
      }),
    };
  }
}
