'use client'

import { useRouter } from 'next/navigation'
import { PageHeader } from '@/components/layout/page-header'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { usePolicyStore } from '@/store/policy-store'
import {
  FileText, Upload, Brain, ChevronRight,
  Shield, Calendar, IndianRupee, AlertTriangle
} from 'lucide-react'

const STATUS_CONFIG = {
  uploaded: { label: 'Uploaded', color: 'bg-blue-100 text-blue-700', hindi: 'अपलोड हुआ' },
  processing: { label: 'Processing', color: 'bg-yellow-100 text-yellow-700', hindi: 'प्रोसेस हो रहा है' },
  analyzed: { label: 'Analyzed', color: 'bg-green-100 text-green-700', hindi: 'विश्लेषित' },
  error: { label: 'Error', color: 'bg-red-100 text-red-700', hindi: 'त्रुटि' },
}

const TYPE_ICONS: Record<string, string> = {
  health: '🏥', life: '💚', vehicle: '🚗',
  home: '🏠', travel: '✈️', other: '📄'
}

export default function PoliciesPage() {
  const router = useRouter()
  const { policies } = usePolicyStore()

  if (policies.length === 0) {
    return (
      <div className="animate-fade-in">
        <PageHeader
          title="My Policies"
          titleHindi="मेरी पॉलिसी"
          description="All your insurance policies in one place"
        />
        <div className="p-6 max-w-7xl mx-auto">
          <div className="text-center py-20">
            <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
              <FileText className="h-10 w-10 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">
              No Policies Yet
            </h3>
            <p className="text-blue-600 hindi-text mb-2">अभी कोई पॉलिसी नहीं है</p>
            <p className="text-gray-500 mb-6">
              Upload your first insurance policy to get AI-powered insights
            </p>
            <Button
              onClick={() => router.push('/dashboard/upload')}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Upload className="mr-2 h-4 w-4" />
              Upload First Policy
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="My Policies"
        titleHindi="मेरी पॉलिसी"
        description={`${policies.length} policy${policies.length > 1 ? 'ies' : ''} found`}
      >
        <Button
          onClick={() => router.push('/dashboard/upload')}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Upload className="mr-2 h-4 w-4" />
          Add Policy
        </Button>
      </PageHeader>

      <div className="p-6 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {policies.map((policy) => {
            const statusConfig = STATUS_CONFIG[policy.status]
            return (
              <Card
                key={policy.policyId}
                className="border-0 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => router.push(`/dashboard/policies/${policy.policyId}`)}
              >
                <CardContent className="p-5">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{TYPE_ICONS[policy.policyType] || '📄'}</span>
                      <div>
                        <h3 className="font-semibold text-gray-900 text-sm leading-tight">
                          {policy.policyName}
                        </h3>
                        <p className="text-xs text-gray-500">{policy.insurerName}</p>
                      </div>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${statusConfig.color}`}>
                      {statusConfig.label}
                    </span>
                  </div>

                  {/* Details */}
                  <div className="space-y-2 mb-4">
                    {policy.sumInsured > 0 && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <IndianRupee className="h-3.5 w-3.5 text-green-600" />
                        <span>Sum Insured: ₹{policy.sumInsured.toLocaleString('en-IN')}</span>
                      </div>
                    )}
                    {policy.premiumAmount > 0 && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Shield className="h-3.5 w-3.5 text-blue-600" />
                        <span>Premium: ₹{policy.premiumAmount.toLocaleString('en-IN')}/yr</span>
                      </div>
                    )}
                    {policy.endDate && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Calendar className="h-3.5 w-3.5 text-orange-600" />
                        <span>Expires: {new Date(policy.endDate).toLocaleDateString('en-IN')}</span>
                      </div>
                    )}
                  </div>

                  {/* Action */}
                  <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                    {policy.status === 'analyzed' ? (
                      <span className="text-xs text-green-600 font-medium flex items-center gap-1">
                        <Shield className="h-3 w-3" />
                        Analysis Ready
                      </span>
                    ) : (
                      <span className="text-xs text-blue-600 font-medium flex items-center gap-1">
                        <Brain className="h-3 w-3" />
                        Ready to Analyze
                      </span>
                    )}
                    <ChevronRight className="h-4 w-4 text-gray-400" />
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>
    </div>
  )
}