import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

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

export interface Recommendation {
  type: 'New Policy' | 'Coverage Enhancement' | 'Risk Mitigation' | 'Peer Comparison';
  priority: 'High' | 'Medium' | 'Low';
  category: 'health' | 'life' | 'vehicle' | 'home' | 'travel' | 'other';
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
  yourCoverage: {
    health: number;
    life: number;
    vehicle: number;
    home: number;
    total: number;
  };
  peerBenchmark: {
    avgHealthCoverage: number;
    avgLifeInsurance: number;
    avgVehicleInsurance: number;
    avgHomeInsurance: number;
    percentile: number;
    sampleSize: number;
    isEstimate?: boolean;
  };
  insights: string[];
}

export interface LinkedinData {
  profileUrl: string;
  jobTitle: string;
  company: string;
  industry: string;
  experienceYears: number;
  extractedAt: string;
}

export interface RecommendationStore {
  // State
  profile: Partial<UserRecommendationProfile> | null;
  recommendations: RecommendationResult | null;
  peerMetrics: PeerMetrics | null;
  linkedinData: LinkedinData | null;
  isLoading: boolean;
  error: string | null;
  lastGenerated: Date | null;

  // Actions
  updateProfile: (profile: Partial<UserRecommendationProfile>) => void;
  setProfile: (profile: UserRecommendationProfile | null) => void;
  setRecommendations: (recommendations: RecommendationResult | null) => void;
  setPeerMetrics: (metrics: PeerMetrics | null) => void;
  setLinkedinData: (data: LinkedinData | null) => void;
  setIsLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearAll: () => void;
  isProfileComplete: () => boolean;
}

export const useRecommendationStore = create<RecommendationStore>()(
  persist(
    (set, get) => ({
      // Initial state
      profile: null,
      recommendations: null,
      peerMetrics: null,
      linkedinData: null,
      isLoading: false,
      error: null,
      lastGenerated: null,

      // Actions
      updateProfile: (newProfile) => {
        const currentProfile = get().profile || {};
        set({
          profile: { ...currentProfile, ...newProfile },
          error: null,
        });
      },

      setProfile: (profile) => {
        set({ profile, error: null });
      },

      setRecommendations: (recommendations) => {
        set({
          recommendations,
          lastGenerated: recommendations ? new Date() : null,
        });
      },

      setPeerMetrics: (metrics) => {
        set({ peerMetrics: metrics });
      },

      setLinkedinData: (data) => {
        if (data) {
          set((state) => ({
            linkedinData: data,
            profile: state.profile
              ? {
                  ...state.profile,
                  jobTitle: data.jobTitle,
                  industry: data.industry,
                  linkedinUrl: data.profileUrl,
                }
              : null,
          }));
        } else {
          set({ linkedinData: null });
        }
      },

      setIsLoading: (loading) => {
        set({ isLoading: loading });
      },

      setError: (error) => {
        set({ error });
      },

      clearAll: () => {
        set({
          profile: null,
          recommendations: null,
          peerMetrics: null,
          linkedinData: null,
          isLoading: false,
          error: null,
          lastGenerated: null,
        });
      },

      isProfileComplete: () => {
        const profile = get().profile;
        return !!(
          profile &&
          profile.age &&
          profile.familySize &&
          profile.annualIncome &&
          profile.jobTitle &&
          profile.industry &&
          profile.goals &&
          profile.retirementAge
        );
      },
    }),
    {
      name: 'suraksha-recommendations',
      // Use sessionStorage so sensitive profile data (income, health status,
      // smoking status, etc.) does not persist across browser sessions.
      storage: createJSONStorage(() =>
        typeof window !== 'undefined' ? sessionStorage : localStorage
      ),
      partialize: (state) => ({
        profile: state.profile,
        linkedinData: state.linkedinData,
        recommendations: state.recommendations,
        lastGenerated: state.lastGenerated,
      }),
    }
  )
);
