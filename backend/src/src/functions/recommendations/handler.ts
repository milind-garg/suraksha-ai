import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { GetCommand, QueryCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { docClient } from "../../lib/dynamodb";
import {
  generateUserRecommendations,
} from "../../lib/bedrock";
import {
  getPeerComparison,
  getUserCoverageMetrics,
} from "../../lib/recommendations";
import { getCorsHeaders } from "../../lib/cors";

const USERS_TABLE = `suraksha-ai-users-${process.env.ENVIRONMENT || "dev"}`;
const POLICIES_TABLE = `suraksha-ai-policies-${process.env.ENVIRONMENT || "dev"}`;

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  const corsHeaders = getCorsHeaders(event.headers?.origin ?? event.headers?.Origin);

  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({ message: "OK" }),
    };
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
    const path = event.requestContext?.resourcePath || "";

    console.log("Recommendations handler invoked for userId:", userId);

    if (path.includes("peer-comparison")) {
      return await getPeerComparisonHandler(userId, corsHeaders);
    } else if (event.httpMethod === "POST") {
      return await generateRecommendationsHandler(userId, corsHeaders);
    } else if (event.httpMethod === "GET") {
      return await getRecommendationsHandler(userId, corsHeaders);
    }

    return {
      statusCode: 400,
      headers: corsHeaders,
      body: JSON.stringify({ error: "Invalid request" }),
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

// ─── Generate Recommendations ──────────────────────
async function generateRecommendationsHandler(
  userId: string,
  corsHeaders: Record<string, string>
): Promise<APIGatewayProxyResult> {
  try {
    // Get user profile
    const userParams = {
      TableName: USERS_TABLE,
      Key: { userId },
    };

    const userResponse = await docClient.send(new GetCommand(userParams));

    if (!userResponse.Item) {
      return {
        statusCode: 404,
        headers: corsHeaders,
        body: JSON.stringify({ error: "User not found" }),
      };
    }

    const user = userResponse.Item;
    const profile = user.recommendationProfile;

    if (!profile) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({
          error: "User profile not complete. Please fill the questionnaire first.",
        }),
      };
    }

    // Get user's existing policies
    const policiesParams = {
      TableName: POLICIES_TABLE,
      IndexName: "userId-createdAt-index",
      KeyConditionExpression: "userId = :userId",
      ExpressionAttributeValues: {
        ":userId": userId,
      },
    };

    const policiesResponse = await docClient.send(
      new QueryCommand(policiesParams)
    );
    const policies = policiesResponse.Items || [];

    // Get peer comparison metrics
    const peerMetrics = await getPeerComparison({
      age: profile.age,
      annualIncome: profile.annualIncome,
      industry: profile.industry,
      occupationalRisk: profile.occupationalRisk,
    });

    // Generate recommendations using Claude
    const recommendationsJson = await generateUserRecommendations(
      {
        age: profile.age,
        familySize: profile.familySize,
        dependents: profile.dependents,
        maritalStatus: profile.maritalStatus,
        annualIncome: profile.annualIncome,
        jobTitle: profile.jobTitle,
        industry: profile.industry,
        occupationalRisk: profile.occupationalRisk,
        healthStatus: profile.healthStatus,
        goals: profile.goals,
      },
      policies.map((p) => ({
        policyType: p.policyType,
        sumInsured: p.sumInsured,
        policyName: p.policyName,
        endDate: p.endDate,
      })),
      peerMetrics
    );

    // Parse Claude response
    let recommendations: any = {};
    try {
      const cleanJson = recommendationsJson
        .replace(/```json\n?/g, "")
        .replace(/```\n?/g, "")
        .trim();
      recommendations = JSON.parse(cleanJson);
    } catch (parseError) {
      console.error("Error parsing Claude response:", parseError);
      recommendations = {
        recommendations: [],
        overallRiskScore: 0,
        riskAssessment: "Unable to generate recommendations",
        actionNextSteps: "Please try again later",
      };
    }

    // Store only the latest recommendation to avoid exceeding DynamoDB's 400 KB item limit
    const updateParams = {
      TableName: USERS_TABLE,
      Key: { userId },
      UpdateExpression:
        "SET latestRecommendation = :new_rec, #ts = :timestamp",
      ExpressionAttributeNames: {
        "#ts": "updatedAt",
      },
      ExpressionAttributeValues: {
        ":new_rec": {
          generatedAt: new Date().toISOString(),
          ...recommendations,
        },
        ":timestamp": new Date().toISOString(),
      },
    };

    await docClient.send(new UpdateCommand(updateParams));

    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({
        success: true,
        data: {
          recommendations: recommendations.recommendations,
          overallRiskScore: recommendations.overallRiskScore,
          riskAssessment: recommendations.riskAssessment,
          actionNextSteps: recommendations.actionNextSteps,
          generatedAt: new Date().toISOString(),
        },
      }),
    };
  } catch (error: unknown) {
    console.error("Error generating recommendations:", error);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({
        error: "Failed to generate recommendations",
      }),
    };
  }
}

// ─── Get Cached Recommendations ────────────────────
async function getRecommendationsHandler(
  userId: string,
  corsHeaders: Record<string, string>
): Promise<APIGatewayProxyResult> {
  try {
    const userParams = {
      TableName: USERS_TABLE,
      Key: { userId },
    };

    const userResponse = await docClient.send(new GetCommand(userParams));

    if (!userResponse.Item) {
      return {
        statusCode: 404,
        headers: corsHeaders,
        body: JSON.stringify({ error: "User not found" }),
      };
    }

    const user = userResponse.Item;
    const latest = user.latestRecommendation || null;

    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({
        success: true,
        data: latest,
      }),
    };
  } catch (error: unknown) {
    console.error("Error getting recommendations:", error);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({
        error: "Failed to get recommendations",
      }),
    };
  }
}

// ─── Get Peer Comparison ───────────────────────────
async function getPeerComparisonHandler(
  userId: string,
  corsHeaders: Record<string, string>
): Promise<APIGatewayProxyResult> {
  try {
    // Get user profile
    const userParams = {
      TableName: USERS_TABLE,
      Key: { userId },
    };

    const userResponse = await docClient.send(new GetCommand(userParams));

    if (!userResponse.Item) {
      return {
        statusCode: 404,
        headers: corsHeaders,
        body: JSON.stringify({ error: "User not found" }),
      };
    }

    const user = userResponse.Item;
    const profile = user.recommendationProfile;

    if (!profile) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({
          error: "User profile not complete",
        }),
      };
    }

    // Get user's coverage metrics
    const userCoverage = await getUserCoverageMetrics(userId);

    // Get peer metrics
    const peerMetrics = await getPeerComparison({
      age: profile.age,
      annualIncome: profile.annualIncome,
      industry: profile.industry,
      occupationalRisk: profile.occupationalRisk,
    });

    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({
        success: true,
        data: {
          yourCoverage: userCoverage,
          peerBenchmark: peerMetrics,
          insights: generateInsights(userCoverage, peerMetrics),
        },
      }),
    };
  } catch (error: unknown) {
    console.error("Error getting peer comparison:", error);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({
        error: "Failed to get peer comparison",
      }),
    };
  }
}

// ─── Generate Insights from Comparison ────────────
function generateInsights(
  yourCoverage: any,
  peerMetrics: any
): string[] {
  const insights: string[] = [];

  if (yourCoverage.health < peerMetrics.avgHealthCoverage) {
    insights.push(
      `Your health insurance (₹${yourCoverage.health}) is below average (₹${peerMetrics.avgHealthCoverage}). Consider increasing coverage.`
    );
  }

  if (yourCoverage.life < peerMetrics.avgLifeInsurance) {
    insights.push(
      `Your life insurance (₹${yourCoverage.life}) is below average (₹${peerMetrics.avgLifeInsurance}). Family protection should be a priority.`
    );
  }

  if (yourCoverage.total === 0) {
    insights.push(
      "You have no active policies. Starting with health insurance is recommended."
    );
  }

  if (insights.length === 0) {
    insights.push("Your coverage is healthy compared to similar individuals.");
  }

  return insights;
}
