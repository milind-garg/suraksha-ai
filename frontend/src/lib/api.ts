import axios from 'axios'
import { getAuthToken } from './auth'

const API_BASE = process.env.NEXT_PUBLIC_API_URL || ''

// Create axios instance
const api = axios.create({
  baseURL: API_BASE,
  timeout: 30000,
})

// Add auth token to every request
api.interceptors.request.use(async (config) => {
  const token = await getAuthToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// ─── Upload Policy (direct to S3 via presigned URL) ───
export async function getUploadUrl(data: {
  fileName: string
  fileType: string
  policyName: string
  policyType: string
}): Promise<{ uploadUrl: string; policyId: string; s3Key: string }> {
  const response = await api.post('/upload/presigned-url', data)
  return response.data
}

export async function uploadFileToS3(
  uploadUrl: string,
  file: File,
  onProgress?: (percent: number) => void
): Promise<void> {
  await axios.put(uploadUrl, file, {
    headers: { 'Content-Type': file.type },
    onUploadProgress: (event) => {
      if (event.total && onProgress) {
        const percent = Math.round((event.loaded * 100) / event.total)
        onProgress(percent)
      }
    }
  })
}

// ─── Policy API ───────────────────────────────────────
export async function getPolicies() {
  const response = await api.get('/policies')
  return response.data
}

export async function getPolicy(policyId: string) {
  const response = await api.get(`/policies/${policyId}`)
  return response.data
}

export async function analyzePolicy(policyId: string) {
  const response = await api.post(`/policies/${policyId}/analyze`)
  return response.data
}

export async function deletePolicy(policyId: string) {
  const response = await api.delete(`/policies/${policyId}`)
  return response.data
}

// ─── Profile API ──────────────────────────────────────
export async function getProfile() {
  const response = await api.get('/profile')
  return response.data
}

export async function updateProfile(profile: Record<string, unknown>) {
  const response = await api.post('/profile', profile)
  return response.data
}

// ─── Recommendations API ──────────────────────────────
export async function generateRecommendations() {
  const response = await api.post('/recommendations/generate')
  return response.data
}

export async function getPeerComparison() {
  const response = await api.get('/recommendations/peer-comparison')
  return response.data
}

// ─── LinkedIn API ─────────────────────────────────────
export async function analyzeLinkedIn(linkedinUrl: string) {
  const response = await api.post('/linkedin', { linkedinUrl })
  return response.data
}

export default api