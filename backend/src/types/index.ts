// Suraksha AI - Shared Types

export interface Policy {
  policyId: string;
  userId: string;
  policyName: string;
  policyType: PolicyType;
  insurerName: string;
  policyNumber: string;
  premiumAmount: number;
  sumInsured: number;
  startDate: string;
  endDate: string;
  status: PolicyStatus;
  s3Key: string;
  extractedText?: string;
  analysisResult?: PolicyAnalysis;
  createdAt: string;
  updatedAt: string;
}

export type PolicyType =
  | 'health'
  | 'life'
  | 'vehicle'
  | 'home'
  | 'travel'
  | 'other';

export type PolicyStatus =
  | 'uploaded'
  | 'processing'
  | 'analyzed'
  | 'error';

export interface PolicyAnalysis {
  summary: string;
  summaryHindi: string;
  coverageDetails: CoverageItem[];
  exclusions: string[];
  claimProcess: string[];
  claimSuccessProbability: number;
  coverageGaps: CoverageGap[];
  recommendations: string[];
  keyDates: KeyDate[];
}

export interface CoverageItem {
  name: string;
  covered: boolean;
  limit?: string;
  details: string;
}

export interface CoverageGap {
  gap: string;
  severity: 'high' | 'medium' | 'low';
  recommendation: string;
}

export interface KeyDate {
  label: string;
  date: string;
  importance: string;
}

export interface User {
  userId: string;
  email: string;
  name: string;
  phone?: string;
  createdAt: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface UploadUrlRequest {
  fileName: string;
  fileType: string;
  policyName: string;
  policyType: PolicyType;
}

export interface UploadUrlResponse {
  uploadUrl: string;
  policyId: string;
  s3Key: string;
}

// Recommendation Profile Types
export interface UserRecommendationProfile {
  age: number;
  familySize: number;
  dependents: number;
  maritalStatus: 'single' | 'married' | 'divorced' | 'widowed';
  annualIncome: number;
  monthlyExpenses: number;
  savingsAmount: number;
  assets: string;
  jobTitle: string;
  industry: string;
  occupationalRisk: 'low' | 'medium' | 'high';
  travelFrequency: 'low' | 'medium' | 'high';
  linkedinUrl?: string;
  healthStatus: 'excellent' | 'good' | 'fair' | 'poor';
  smokingStatus: boolean;
  exerciseFrequency: 'daily' | 'weekly' | 'monthly' | 'rarely';
  goals: string;
  retirementAge: number;
}

export interface LinkedinProfileData {
  linkedinId: string;
  profileUrl: string;
  jobTitle: string;
  company: string;
  industry: string;
  experienceYears: number;
  extractedAt: string;
}

export interface Recommendation {
  type: 'New Policy' | 'Coverage Enhancement' | 'Risk Mitigation' | 'Peer Comparison';
  priority: 'High' | 'Medium' | 'Low';
  category: PolicyType;
  title: string;
  description: string;
  suggestedCoverage: string;
  estimatedPremium: string;
  relevanceForIndians: string;
}

export interface RecommendationResult {
  recommendations: Recommendation[];
  overallRiskScore: number;
  riskAssessment: string;
  actionNextSteps: string;
  generatedAt: string;
}

export interface PeerMetrics {
  avgHealthCoverage: number;
  avgLifeInsurance: number;
  avgVehicleInsurance: number;
  avgHomeInsurance: number;
  percentile: number;
  sampleSize: number;
}

export interface PeerComparisonData {
  yourCoverage: {
    health: number;
    life: number;
    vehicle: number;
    home: number;
    total: number;
  };
  averageForSimilarUsers: PeerMetrics;
  insights: string[];
}