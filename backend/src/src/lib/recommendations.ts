import {
  DynamoDBClient,
  QueryCommand,
  ScanCommand,
} from "@aws-sdk/client-dynamodb";
import { unmarshall } from "@aws-sdk/util-dynamodb";

const client = new DynamoDBClient({
  region: process.env.AWS_REGION || "ap-south-1",
});

const USERS_TABLE = `suraksha-ai-users-${process.env.ENVIRONMENT || "dev"}`;
const POLICIES_TABLE = `suraksha-ai-policies-${process.env.ENVIRONMENT || "dev"}`;

// ─── Peer Comparison Data ──────────────────────────────
export async function getPeerComparison(userProfile: {
  age: number;
  annualIncome: number;
  industry: string;
  occupationalRisk: string;
}): Promise<{
  avgHealthCoverage: number;
  avgLifeInsurance: number;
  avgVehicleInsurance: number;
  avgHomeInsurance: number;
  percentile: number;
  sampleSize: number;
}> {
  try {
    // Query for similar users (age ±5, income ±20%, similar industry)
    const minAge = userProfile.age - 5;
    const maxAge = userProfile.age + 5;
    const minIncome = userProfile.annualIncome * 0.8;
    const maxIncome = userProfile.annualIncome * 1.2;

    // Since DynamoDB doesn't have range queries across multiple attributes easily,
    // we'll do a scan and filter in-memory for peer data
    const scanParams = {
      TableName: USERS_TABLE,
      FilterExpression:
        "attribute_exists(recommendationProfile) AND industry = :industry",
      ExpressionAttributeValues: {
        ":industry": { S: userProfile.industry },
      },
    };

    const scanResponse = await client.send(new ScanCommand(scanParams));
    const peers: any[] = [];

    if (scanResponse.Items) {
      for (const item of scanResponse.Items) {
        const user = unmarshall(item);
        if (
          user.recommendationProfile &&
          user.recommendationProfile.age >= minAge &&
          user.recommendationProfile.age <= maxAge &&
          user.recommendationProfile.annualIncome >= minIncome &&
          user.recommendationProfile.annualIncome <= maxIncome
        ) {
          peers.push(user);
        }
      }
    }

    if (peers.length === 0) {
      // Return defaults if no peers found
      return {
        avgHealthCoverage: 500000, // Default: ₹5L
        avgLifeInsurance: 5000000, // Default: ₹50L
        avgVehicleInsurance: 300000, // Default: ₹3L
        avgHomeInsurance: 1000000, // Default: ₹10L
        percentile: 50,
        sampleSize: 0,
      };
    }

    // Calculate aggregate coverage for peers
    let totalHealthCoverage = 0;
    let totalLifeInsurance = 0;
    let totalVehicleInsurance = 0;
    let totalHomeInsurance = 0;

    for (const peer of peers) {
      const userId = peer.userId;

      // Get policies for this peer
      const policiesParams = {
        TableName: POLICIES_TABLE,
        IndexName: "userId-createdAt-index",
        KeyConditionExpression: "userId = :userId",
        ExpressionAttributeValues: {
          ":userId": { S: userId },
        },
      };

      const policiesResponse = await client.send(
        new QueryCommand(policiesParams)
      );

      if (policiesResponse.Items) {
        for (const policyItem of policiesResponse.Items) {
          const policy = unmarshall(policyItem);
          const sumInsured = policy.sumInsured || 0;

          switch (policy.policyType?.toLowerCase()) {
            case "health":
              totalHealthCoverage += sumInsured;
              break;
            case "life":
              totalLifeInsurance += sumInsured;
              break;
            case "vehicle":
              totalVehicleInsurance += sumInsured;
              break;
            case "home":
              totalHomeInsurance += sumInsured;
              break;
          }
        }
      }
    }

    const avgHealthCoverage = Math.round(totalHealthCoverage / peers.length);
    const avgLifeInsurance = Math.round(totalLifeInsurance / peers.length);
    const avgVehicleInsurance = Math.round(totalVehicleInsurance / peers.length);
    const avgHomeInsurance = Math.round(totalHomeInsurance / peers.length);

    // Calculate percentile rank (placeholder: 50 if no data)
    const percentile = 50;

    return {
      avgHealthCoverage,
      avgLifeInsurance,
      avgVehicleInsurance,
      avgHomeInsurance,
      percentile,
      sampleSize: peers.length,
    };
  } catch (error) {
    console.error("Error calculating peer comparison:", error);
    // Return defaults on error
    return {
      avgHealthCoverage: 500000,
      avgLifeInsurance: 5000000,
      avgVehicleInsurance: 300000,
      avgHomeInsurance: 1000000,
      percentile: 50,
      sampleSize: 0,
    };
  }
}

// ─── Calculate User's Total Coverage ───────────────────
export async function getUserCoverageMetrics(userId: string): Promise<{
  health: number;
  life: number;
  vehicle: number;
  home: number;
  travel: number;
  total: number;
}> {
  try {
    const params = {
      TableName: POLICIES_TABLE,
      IndexName: "userId-createdAt-index",
      KeyConditionExpression: "userId = :userId",
      ExpressionAttributeValues: {
        ":userId": { S: userId },
      },
    };

    const response = await client.send(new QueryCommand(params));
    const metrics = {
      health: 0,
      life: 0,
      vehicle: 0,
      home: 0,
      travel: 0,
      total: 0,
    };

    if (response.Items) {
      for (const item of response.Items) {
        const policy = unmarshall(item);
        const sumInsured = policy.sumInsured || 0;

        switch (policy.policyType?.toLowerCase()) {
          case "health":
            metrics.health += sumInsured;
            break;
          case "life":
            metrics.life += sumInsured;
            break;
          case "vehicle":
            metrics.vehicle += sumInsured;
            break;
          case "home":
            metrics.home += sumInsured;
            break;
          case "travel":
            metrics.travel += sumInsured;
            break;
        }
        metrics.total += sumInsured;
      }
    }

    return metrics;
  } catch (error) {
    console.error("Error getting user coverage metrics:", error);
    return {
      health: 0,
      life: 0,
      vehicle: 0,
      home: 0,
      travel: 0,
      total: 0,
    };
  }
}
