import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { docClient } from "../../lib/dynamodb";
import { getCorsHeaders, makePreflightResponse } from "../../lib/cors";

const USERS_TABLE = `suraksha-ai-users-${process.env.ENVIRONMENT || "dev"}`;

// ─── Salary Bands Lookup ───────────────────────────────
const SALARY_LOOKUP: {
  [industry: string]: {
    [jobTitle: string]: {
      [exp: string]: { min: number; max: number };
    };
  };
} = {
  IT: {
    "Software Engineer": {
      "0-3": { min: 400000, max: 800000 },
      "3-5": { min: 800000, max: 1300000 },
      "5-8": { min: 1300000, max: 2000000 },
      "8+": { min: 1800000, max: 3500000 },
    },
    Manager: {
      "0-3": { min: 600000, max: 1000000 },
      "3-5": { min: 1000000, max: 1500000 },
      "5-8": { min: 1500000, max: 2500000 },
      "8+": { min: 2200000, max: 4500000 },
    },
    "Senior Engineer": {
      "5-8": { min: 1500000, max: 2500000 },
      "8+": { min: 2200000, max: 4000000 },
    },
  },
  Finance: {
    Manager: {
      "0-3": { min: 600000, max: 1000000 },
      "3-5": { min: 1000000, max: 1500000 },
      "5-8": { min: 1200000, max: 2000000 },
      "8+": { min: 1800000, max: 3500000 },
    },
    Analyst: {
      "0-3": { min: 350000, max: 700000 },
      "3-5": { min: 700000, max: 1200000 },
      "5-8": { min: 1000000, max: 1800000 },
      "8+": { min: 1500000, max: 3000000 },
    },
  },
  Healthcare: {
    Doctor: {
      "0-3": { min: 800000, max: 1500000 },
      "3-5": { min: 1200000, max: 2500000 },
      "5-8": { min: 1800000, max: 3500000 },
      "8+": { min: 2500000, max: 5000000 },
    },
    Nurse: {
      "0-3": { min: 300000, max: 600000 },
      "3-5": { min: 500000, max: 1000000 },
      "5-8": { min: 800000, max: 1500000 },
      "8+": { min: 1200000, max: 2200000 },
    },
  },
  Manufacturing: {
    "Production Manager": {
      "0-3": { min: 400000, max: 700000 },
      "3-5": { min: 700000, max: 1200000 },
      "5-8": { min: 1000000, max: 1800000 },
      "8+": { min: 1500000, max: 2800000 },
    },
  },
  Education: {
    Teacher: {
      "0-3": { min: 250000, max: 450000 },
      "3-5": { min: 400000, max: 700000 },
      "5-8": { min: 600000, max: 1000000 },
      "8+": { min: 900000, max: 1600000 },
    },
    Professor: {
      "5-8": { min: 800000, max: 1400000 },
      "8+": { min: 1200000, max: 2200000 },
    },
  },
};

// ─── CORS Headers ──────────────────────────────────────

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
    console.log("LinkedIn handler invoked for userId:", userId);

    if (event.httpMethod === "POST" && event.body) {
      return await analyzeLinkedIn(userId, event.body, corsHeaders);
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

// ─── Analyze LinkedIn Profile ──────────────────────────
async function analyzeLinkedIn(
  userId: string,
  body: string,
  corsHeaders: Record<string, string>
): Promise<APIGatewayProxyResult> {
  try {
    const { linkedinUrl } = JSON.parse(body);

    if (!linkedinUrl) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ error: "LinkedIn URL is required" }),
      };
    }

    // Parse LinkedIn URL to extract profile info
    // In production, you'd use a LinkedIn scraper like linkedin-profile-scraper
    // For MVP, we'll simulate extraction from the URL pattern

    const profileData = extractLinkedInData(linkedinUrl);

    if (!profileData) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ error: "Invalid LinkedIn URL or profile" }),
      };
    }

    // Infer salary band based on job title, industry, and experience
    const salaryBand = inferSalaryBand(
      profileData.jobTitle,
      profileData.industry,
      profileData.experienceYears
    );

    // Store in DynamoDB
    const updateParams = {
      TableName: USERS_TABLE,
      Key: { userId },
      UpdateExpression:
        "SET linkedinData = :linkedin, #ts = :timestamp, linkedinSalaryEstimate = :salary",
      ExpressionAttributeNames: {
        "#ts": "updatedAt",
      },
      ExpressionAttributeValues: {
        ":linkedin": {
          profileUrl: linkedinUrl,
          jobTitle: profileData.jobTitle,
          company: profileData.company,
          industry: profileData.industry,
          experienceYears: profileData.experienceYears,
          extractedAt: new Date().toISOString(),
          isSimulated: true,
        },
        ":salary": salaryBand,
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
          linkedinData: { ...profileData, isSimulated: true },
          salaryEstimate: salaryBand,
          message: "LinkedIn profile analyzed successfully (simulated data — real scraping not yet implemented)",
        },
      }),
    };
  } catch (error: unknown) {
    console.error("Error analyzing LinkedIn:", error);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ error: "Failed to analyze LinkedIn profile" }),
    };
  }
}

// ─── Extract LinkedIn Data from URL ─────────────────
interface LinkedInData {
  jobTitle: string;
  company: string;
  industry: string;
  experienceYears: number;
}

function extractLinkedInData(linkedinUrl: string): LinkedInData | null {
  // This is a simplified mock implementation
  // In a real application, you'd use a scraper or LinkedIn API
  // For now, return sample data structure

  if (!linkedinUrl.includes("linkedin.com")) {
    return null;
  }

  // Mock data - in production, scrape the actual profile
  return {
    jobTitle: "Software Engineer",
    company: "Tech Company",
    industry: "IT",
    experienceYears: 5,
  };
}

// ─── Infer Salary Band from Profile ────────────────
interface SalaryBand {
  min: number;
  max: number;
  currency: string;
}

function getExpBracket(experienceYears: number): string {
  if (experienceYears >= 8) return "8+";
  if (experienceYears >= 5) return "5-8";
  if (experienceYears >= 3) return "3-5";
  return "0-3";
}

function inferSalaryBand(
  jobTitle: string,
  industry: string,
  experienceYears: number
): SalaryBand {
  const industryData = SALARY_LOOKUP[industry];

  if (!industryData) {
    return { min: 500000, max: 1500000, currency: "INR" };
  }

  const jobData = industryData[jobTitle];

  if (!jobData) {
    // Try partial match
    for (const [key, value] of Object.entries(industryData)) {
      if (jobTitle.includes(key) || key.includes(jobTitle)) {
        const bracket = getExpBracket(experienceYears);
        const band = value[bracket] ?? value["8+"] ?? value["0-3"];
        return { min: band.min, max: band.max, currency: "INR" };
      }
    }
    return { min: 500000, max: 1500000, currency: "INR" };
  }

  // Determine experience bracket
  const expBracket = getExpBracket(experienceYears);

  const salary = jobData[expBracket] || jobData["8+"] || jobData["0-3"];

  return {
    min: salary.min,
    max: salary.max,
    currency: "INR",
  };
}
