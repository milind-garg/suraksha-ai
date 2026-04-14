'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { usePolicyStore } from '@/store/policy-store'
import { PageHeader } from '@/components/layout/page-header'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { useToast } from '@/hooks/use-toast'
import {
  Brain, Shield, AlertTriangle, CheckCircle,
  XCircle, ArrowLeft, IndianRupee, Calendar,
  TrendingUp, FileText, ChevronRight, Trash2
} from 'lucide-react'
import {
  Dialog, DialogContent, DialogDescription,
  DialogFooter, DialogHeader, DialogTitle
} from '@/components/ui/dialog'

import { deletePolicy, analyzePolicy as analyzePolicyApi } from '@/lib/api'

export default function PolicyDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const { policies, currentPolicy, setCurrentPolicy, updatePolicy, removePolicy } = usePolicyStore()
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  const policyId = params.policyId as string

  useEffect(() => {
    const policy = policies.find(p => p.policyId === policyId)
    if (policy) {
      setCurrentPolicy(policy)
    } else {
      router.push('/dashboard/policies')
    }
  }, [policyId, policies, setCurrentPolicy, router])

  // ─── Mock AI Analysis ──────────────────────────────────
  const handleAnalyze = async () => {
  // Capture a snapshot of currentPolicy to avoid stale-state race condition
  const policy = currentPolicy
  if (!policy) return

  setIsAnalyzing(true)
  updatePolicy(policyId, { status: 'processing' })

  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL

    if (apiUrl && apiUrl !== 'PLACEHOLDER') {
      // ── REAL API: Call Lambda + Textract + Claude ──
      // Uses the api.ts axios instance which injects a fresh token via interceptor
      const data = await analyzePolicyApi(policyId)
      updatePolicy(policyId, {
        status: 'analyzed',
        analysisResult: data.analysisResult
      })

    } else {
      // ── DEMO: Mock analysis ────────────────────────
      await new Promise(r => setTimeout(r, 3000))

      const mockAnalysis = {
        summary: `This ${policy.policyType} insurance policy from ${policy.insurerName || 'your insurer'} provides coverage of ₹${policy.sumInsured?.toLocaleString('en-IN') || 'N/A'}. The policy covers major risks with standard exclusions. Review coverage details for complete understanding of your protection.`,
        summaryHindi: `यह ${policy.insurerName || 'आपकी बीमा कंपनी'} की ${policy.policyType} बीमा पॉलिसी ₹${policy.sumInsured?.toLocaleString('en-IN') || 'N/A'} का कवरेज प्रदान करती है। पॉलिसी प्रमुख जोखिमों को कवर करती है। अपनी सुरक्षा को पूरी तरह समझने के लिए कवरेज विवरण की समीक्षा करें।`,
        coverageDetails: [
          { name: 'Hospitalization', covered: true, limit: '₹5,00,000', details: 'Covers in-patient hospitalization expenses' },
          { name: 'Pre-existing Diseases', covered: true, limit: 'After 2 years', details: 'Covered after 24-month waiting period' },
          { name: 'Day Care Procedures', covered: true, limit: '540 procedures', details: 'All listed day care treatments included' },
          { name: 'Ambulance Charges', covered: true, limit: '₹2,000/incident', details: 'Emergency ambulance services' },
          { name: 'Dental Treatment', covered: false, limit: 'Not covered', details: 'Routine dental not included' },
          { name: 'Maternity Benefits', covered: false, limit: 'Not covered', details: 'Add-on rider required for coverage' },
        ],
        exclusions: [
          'Self-inflicted injuries or suicide attempts',
          'War, nuclear risks, or civil unrest related injuries',
          'Cosmetic or aesthetic treatments',
          'Dental treatment unless caused by accident',
          'Experimental or unproven treatments',
        ],
        claimProcess: [
          'Inform insurer within 24 hours of hospitalization',
          'Submit filled claim form with all hospital bills',
          'Attach discharge summary and medical reports',
          'Include all prescription and pharmacy receipts',
          'Claim settlement within 30 days of complete documents',
        ],
        claimSuccessProbability: 78,
        coverageGaps: [
          { gap: 'No maternity coverage', severity: 'high' as const, recommendation: 'Add maternity rider for ₹2,000-3,000 extra premium' },
          { gap: 'Critical illness not covered', severity: 'high' as const, recommendation: 'Add critical illness rider for cancer, heart attack coverage' },
          { gap: 'No dental coverage', severity: 'medium' as const, recommendation: 'Consider separate affordable dental plan' },
        ],
        recommendations: [
          'Increase sum insured to ₹10 lakhs for better family protection',
          'Add critical illness rider — covers cancer, heart attack, stroke',
          'Consider top-up plan to extend coverage economically',
          'Review and compare at next renewal for better terms',
        ]
      }
      updatePolicy(policyId, {
        status: 'analyzed',
        analysisResult: mockAnalysis
      })
    }

    toast({ title: 'Analysis Complete!', description: 'AI has analyzed your policy' })

  } catch (error: any) {
    updatePolicy(policyId, { status: 'error' })
    toast({
      title: 'Analysis Failed',
      description: error.message || 'Please try again',
      variant: 'destructive'
    })
  } finally {
    setIsAnalyzing(false)
  }
}
const handleDelete = async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL
      if (apiUrl && apiUrl !== 'PLACEHOLDER') {
        await deletePolicy(policyId)
      }
    } catch {
      // Ignore API errors — still remove locally so the UI stays consistent
    }
    removePolicy(policyId)
    setShowDeleteDialog(false)
    toast({ title: 'Policy Deleted', description: 'Policy removed successfully' })
    router.push('/dashboard/policies')
  }
  if (!currentPolicy) {
    return <LoadingSpinner size="lg" className="min-h-screen" text="Loading policy..." />
  }

  const analysis = currentPolicy.analysisResult

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={currentPolicy.policyName}
        titleHindi={currentPolicy.insurerName}
        description={`${currentPolicy.policyType.charAt(0).toUpperCase() + currentPolicy.policyType.slice(1)} Insurance Policy`}
      >
        <div className="flex gap-2">
  <Button
    variant="outline"
    onClick={() => setShowDeleteDialog(true)}
    className="border-red-200 text-red-600 hover:bg-red-50"
  >
    <Trash2 className="mr-2 h-4 w-4" />
    Delete
  </Button>
  <Button variant="outline" onClick={() => router.push('/dashboard/policies')}>
    <ArrowLeft className="mr-2 h-4 w-4" />
    Back
  </Button>
</div>
      </PageHeader>

      <div className="p-6 max-w-5xl mx-auto space-y-6">

        {/* Policy Overview Card */}
        <Card className="border-0 shadow-sm">
          <CardContent className="p-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: 'Policy Type', hindi: 'पॉलिसी प्रकार', value: currentPolicy.policyType, icon: '📋' },
                { label: 'Sum Insured', hindi: 'बीमा राशि', value: `₹${currentPolicy.sumInsured.toLocaleString('en-IN')}`, icon: '💰' },
                { label: 'Premium/Year', hindi: 'प्रीमियम/वर्ष', value: `₹${currentPolicy.premiumAmount.toLocaleString('en-IN')}`, icon: '💳' },
                { label: 'Status', hindi: 'स्थिति', value: currentPolicy.status, icon: '📊' },
              ].map((item, i) => (
                <div key={i} className="text-center p-3 bg-gray-50 rounded-xl">
                  <div className="text-2xl mb-1">{item.icon}</div>
                  <div className="text-xs text-gray-500">{item.label}</div>
                  <div className="text-xs text-blue-500 hindi-text">{item.hindi}</div>
                  <div className="font-semibold text-gray-900 mt-1 capitalize">{item.value || 'N/A'}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Analyze Button */}
        {currentPolicy.status !== 'analyzed' && (
          <Card className="border-0 shadow-sm bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
            <CardContent className="p-6 text-center">
              <Brain className="h-12 w-12 mx-auto mb-3 opacity-90" />
              <h3 className="text-xl font-bold mb-1">Analyze with AI</h3>
              <p className="text-blue-100 hindi-text text-sm mb-4">AI से विश्लेषण करें</p>
              <p className="text-blue-100 text-sm mb-6">
                Get coverage details, identify gaps, and predict claim success
              </p>
              <Button
                onClick={handleAnalyze}
                disabled={isAnalyzing}
                className="bg-white text-blue-700 hover:bg-blue-50 px-8 py-5 text-base"
              >
                {isAnalyzing ? (
                  <><LoadingSpinner size="sm" className="mr-2" /> Analyzing...</>
                ) : (
                  <><Brain className="mr-2 h-5 w-5" /> Start AI Analysis</>
                )}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Analysis Results */}
        {analysis && (
          <div className="space-y-6 animate-fade-in">

            {/* Summary */}
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-blue-600" />
                  Policy Summary / पॉलिसी सारांश
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-blue-50 rounded-xl p-4">
                  <p className="text-sm font-medium text-blue-800 mb-1">English</p>
                  <p className="text-gray-700">{analysis.summary}</p>
                </div>
                <div className="bg-orange-50 rounded-xl p-4">
                  <p className="text-sm font-medium text-orange-800 mb-1 hindi-text">हिंदी</p>
                  <p className="text-gray-700 hindi-text">{analysis.summaryHindi}</p>
                </div>
              </CardContent>
            </Card>

            {/* Claim Success Probability */}
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-green-600" />
                  Claim Success Probability / क्लेम सफलता संभावना
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-6">
                  <div className={`w-24 h-24 rounded-full flex items-center justify-center text-2xl font-bold border-4 ${
                    analysis.claimSuccessProbability >= 70
                      ? 'border-green-500 text-green-600 bg-green-50'
                      : analysis.claimSuccessProbability >= 50
                      ? 'border-yellow-500 text-yellow-600 bg-yellow-50'
                      : 'border-red-500 text-red-600 bg-red-50'
                  }`}>
                    {analysis.claimSuccessProbability}%
                  </div>
                  <div>
                    <p className="text-lg font-semibold text-gray-900">
                      {analysis.claimSuccessProbability >= 70 ? 'Good Chances' :
                       analysis.claimSuccessProbability >= 50 ? 'Moderate Chances' : 'Low Chances'}
                    </p>
                    <p className="text-blue-600 hindi-text text-sm">
                      {analysis.claimSuccessProbability >= 70 ? 'अच्छी संभावना' :
                       analysis.claimSuccessProbability >= 50 ? 'मध्यम संभावना' : 'कम संभावना'}
                    </p>
                    <p className="text-gray-500 text-sm mt-1">
                      Based on policy terms and coverage analysis
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Coverage Details */}
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-blue-600" />
                  Coverage Details / कवरेज विवरण
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {analysis.coverageDetails.map((item, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-gray-50">
                      {item.covered
                        ? <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                        : <XCircle className="h-5 w-5 text-red-400 flex-shrink-0" />
                      }
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-900 text-sm">{item.name}</span>
                          <Badge variant={item.covered ? 'default' : 'secondary'} className="text-xs">
                            {item.limit}
                          </Badge>
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5">{item.details}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Coverage Gaps */}
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-orange-600">
                  <AlertTriangle className="h-5 w-5" />
                  Coverage Gaps / कवरेज की कमियां
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analysis.coverageGaps.map((gap, i) => (
                    <div key={i} className={`p-4 rounded-xl border-l-4 ${
                      gap.severity === 'high' ? 'border-red-500 bg-red-50' :
                      gap.severity === 'medium' ? 'border-yellow-500 bg-yellow-50' :
                      'border-blue-500 bg-blue-50'
                    }`}>
                      <div className="flex items-center gap-2 mb-1">
                        <Badge className={
                          gap.severity === 'high' ? 'bg-red-100 text-red-700' :
                          gap.severity === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-blue-100 text-blue-700'
                        }>
                          {gap.severity.toUpperCase()}
                        </Badge>
                        <span className="font-medium text-gray-900 text-sm">{gap.gap}</span>
                      </div>
                      <p className="text-sm text-gray-600 flex items-start gap-1">
                        <ChevronRight className="h-4 w-4 flex-shrink-0 mt-0.5" />
                        {gap.recommendation}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Recommendations */}
            <Card className="border-0 shadow-sm bg-gradient-to-r from-green-50 to-emerald-50">
              <CardHeader>
                <CardTitle className="text-green-700">
                  AI Recommendations / AI की सलाह
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {analysis.recommendations.map((rec, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <div className="w-5 h-5 rounded-full bg-green-600 text-white text-xs flex items-center justify-center flex-shrink-0 mt-0.5">
                        {i + 1}
                      </div>
                      <p className="text-gray-700 text-sm">{rec}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

          </div>
        )}

      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Policy</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this policy? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancel
            </Button>
            <Button
              variant="outline"
              onClick={handleDelete}
              className="border-red-200 text-red-600 hover:bg-red-50"
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}