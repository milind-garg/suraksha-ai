'use client'

import { useParams, useRouter } from 'next/navigation'
import { usePolicyStore } from '@/store/policy-store'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/hooks/use-toast'
import {
  ArrowLeft, FileText, Shield, Calendar,
  IndianRupee, Trash2, Brain, CheckCircle, AlertTriangle
} from 'lucide-react'

export default function PolicyDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { policies, removePolicy } = usePolicyStore()
  const { toast } = useToast()

  const policyId = params.policyId as string
  const policy = policies.find(p => p.policyId === policyId)

  const handleDelete = () => {
    if (confirm('Are you sure you want to delete this policy?')) {
      removePolicy(policyId)
      toast({ title: 'Policy Deleted', description: 'Policy removed successfully' })
      router.push('/dashboard/policies')
    }
  }

  const TYPE_ICONS: Record<string, string> = {
    health: '🏥', life: '💚', vehicle: '🚗',
    home: '🏠', travel: '✈️', other: '📄'
  }

  if (!policy) {
    return (
      <div className="p-8 text-center">
        <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
        <p className="text-gray-500 mb-4">Policy not found</p>
        <Button onClick={() => router.push('/dashboard/policies')}>
          Back to Policies
        </Button>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <Button variant="ghost" onClick={() => router.push('/dashboard/policies')}>
          <ArrowLeft className="w-4 h-4 mr-2" /> Back
        </Button>
        <Button variant="outline" onClick={handleDelete} className="border-red-200 text-red-600 hover:bg-red-50">
          <Trash2 className="w-4 h-4 mr-2" /> Delete
        </Button>
      </div>

      <Card className="border-0 shadow-sm mb-6">
        <CardContent className="p-6">
          <div className="flex items-center gap-4 mb-6">
            <span className="text-4xl">{TYPE_ICONS[policy.policyType] || '📄'}</span>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{policy.policyName}</h1>
              <p className="text-gray-500">{policy.insurerName}</p>
              <Badge className={`mt-1 ${
                policy.status === 'analyzed' ? 'bg-green-100 text-green-700' :
                policy.status === 'processing' ? 'bg-yellow-100 text-yellow-700' :
                'bg-blue-100 text-blue-700'
              }`}>{policy.status}</Badge>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="flex items-center gap-1 text-gray-500 text-xs mb-1">
                <Shield className="w-3 h-3" /> Sum Insured
              </div>
              <p className="font-semibold">₹{(policy.sumInsured || 0).toLocaleString('en-IN')}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="flex items-center gap-1 text-gray-500 text-xs mb-1">
                <IndianRupee className="w-3 h-3" /> Premium
              </div>
              <p className="font-semibold">₹{(policy.premiumAmount || 0).toLocaleString('en-IN')}/yr</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="flex items-center gap-1 text-gray-500 text-xs mb-1">
                <Calendar className="w-3 h-3" /> Start Date
              </div>
              <p className="font-semibold">{policy.startDate || 'N/A'}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="flex items-center gap-1 text-gray-500 text-xs mb-1">
                <Calendar className="w-3 h-3" /> End Date
              </div>
              <p className="font-semibold">{policy.endDate || 'N/A'}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {policy.analysisResult ? (
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Brain className="h-5 w-5 text-purple-600" /> AI Analysis Results
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-blue-50 rounded-lg p-4">
              <p className="text-sm text-gray-800">{policy.analysisResult.summary}</p>
              <p className="text-xs text-blue-600 hindi-text mt-2">{policy.analysisResult.summaryHindi}</p>
            </div>
            <div className="flex items-center gap-4 bg-purple-50 rounded-lg p-4">
              <div className="text-center">
                <p className="text-3xl font-bold text-purple-600">{policy.analysisResult.claimSuccessProbability}%</p>
                <p className="text-xs text-gray-500">Claim Success</p>
              </div>
              <p className="text-sm text-gray-600">Based on policy terms and conditions analysis</p>
            </div>
            {policy.analysisResult.coverageGaps?.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-1">
                  <AlertTriangle className="h-4 w-4 text-orange-500" /> Coverage Gaps
                </h4>
                <div className="space-y-2">
                  {policy.analysisResult.coverageGaps.map((gap, i) => (
                    <div key={i} className={`rounded-lg p-3 text-sm ${
                      gap.severity === 'high' ? 'bg-red-50 text-red-800' :
                      gap.severity === 'medium' ? 'bg-yellow-50 text-yellow-800' :
                      'bg-gray-50 text-gray-800'
                    }`}>
                      <p className="font-medium">{gap.gap}</p>
                      <p className="text-xs mt-1 opacity-80">{gap.recommendation}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {policy.analysisResult.recommendations?.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-2">Recommendations</h4>
                <ul className="space-y-1">
                  {policy.analysisResult.recommendations.map((rec, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                      <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" /> {rec}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card className="border-0 shadow-sm text-center p-8">
          <Brain className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No AI analysis yet</p>
        </Card>
      )}
    </div>
  )
}