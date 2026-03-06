import { create } from 'zustand'

export type PolicyType = 'health' | 'life' | 'vehicle' | 'home' | 'travel' | 'other'
export type PolicyStatus = 'uploaded' | 'processing' | 'analyzed' | 'error'

export interface CoverageItem {
  name: string
  covered: boolean
  limit?: string
  details: string
}

export interface CoverageGap {
  gap: string
  severity: 'high' | 'medium' | 'low'
  recommendation: string
}

export interface PolicyAnalysis {
  summary: string
  summaryHindi: string
  coverageDetails: CoverageItem[]
  exclusions: string[]
  claimProcess: string[]
  claimSuccessProbability: number
  coverageGaps: CoverageGap[]
  recommendations: string[]
}

export interface Policy {
  policyId: string
  userId: string
  policyName: string
  policyType: PolicyType
  insurerName: string
  policyNumber: string
  premiumAmount: number
  sumInsured: number
  startDate: string
  endDate: string
  status: PolicyStatus
  s3Key: string
  analysisResult?: PolicyAnalysis
  createdAt: string
  updatedAt: string
}

interface PolicyState {
  policies: Policy[]
  currentPolicy: Policy | null
  isLoading: boolean
  setPolicies: (policies: Policy[]) => void
  addPolicy: (policy: Policy) => void
  updatePolicy: (policyId: string, updates: Partial<Policy>) => void
  setCurrentPolicy: (policy: Policy | null) => void
  setLoading: (loading: boolean) => void
}

export const usePolicyStore = create<PolicyState>((set) => ({
  policies: [],
  currentPolicy: null,
  isLoading: false,

  setPolicies: (policies) => set({ policies }),

  addPolicy: (policy) =>
    set((state) => ({ policies: [policy, ...state.policies] })),

  updatePolicy: (policyId, updates) =>
    set((state) => ({
      policies: state.policies.map((p) =>
        p.policyId === policyId ? { ...p, ...updates } : p
      ),
      currentPolicy:
        state.currentPolicy?.policyId === policyId
          ? { ...state.currentPolicy, ...updates }
          : state.currentPolicy
    })),

  setCurrentPolicy: (policy) => set({ currentPolicy: policy }),
  setLoading: (loading) => set({ isLoading: loading })
}))