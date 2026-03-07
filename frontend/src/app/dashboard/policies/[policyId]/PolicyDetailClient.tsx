'use client'

import { useParams, useRouter } from 'next/navigation'
import { usePolicyStore } from '@/store/policy-store'
import { Button } from '@/components/ui/button'
import { ArrowLeft, FileText, Shield, Calendar, DollarSign, Trash2 } from 'lucide-react'

export default function PolicyDetailClient() {
  const params = useParams()
  const router = useRouter()
  const { policies, removePolicy } = usePolicyStore()
  const policy = policies.find(p => p.id === params.policyId)

  const handleDelete = () => {
    if (policy && confirm('Delete this policy?')) {
      removePolicy(policy.id)
      router.push('/dashboard/policies')
    }
  }

  if (!policy) {
    return (
      <div className="p-8 text-center">
        <p className="text-gray-500">Policy not found</p>
        <Button onClick={() => router.push('/dashboard/policies')} className="mt-4">
          Back to Policies
        </Button>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <Button variant="ghost" onClick={() => router.back()} className="mb-6">
        <ArrowLeft className="w-4 h-4 mr-2" /> Back
      </Button>
      <div className="bg-white rounded-xl shadow p-6">
        <div className="flex justify-between items-start mb-6">
          <div className="flex items-center gap-3">
            <div className="bg-blue-100 p-3 rounded-lg">
              <FileText className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{policy.name}</h1>
              <p className="text-gray-500 capitalize">{policy.type} Insurance</p>
            </div>
          </div>
          <Button variant="destructive" size="sm" onClick={handleDelete}>
            <Trash2 className="w-4 h-4 mr-2" /> Delete
          </Button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center gap-2 text-gray-500 mb-1">
              <Shield className="w-4 h-4" /> Coverage
            </div>
            <p className="text-xl font-semibold">₹{policy.coverage?.toLocaleString() || 'N/A'}</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center gap-2 text-gray-500 mb-1">
              <DollarSign className="w-4 h-4" /> Premium
            </div>
            <p className="text-xl font-semibold">₹{policy.premium?.toLocaleString() || 'N/A'}/yr</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center gap-2 text-gray-500 mb-1">
              <Calendar className="w-4 h-4" /> Expiry
            </div>
            <p className="text-xl font-semibold">{policy.expiryDate || 'N/A'}</p>
          </div>
        </div>
        {policy.analysis && (
          <div className="bg-blue-50 rounded-lg p-4">
            <h3 className="font-semibold text-blue-900 mb-2">AI Analysis</h3>
            <p className="text-blue-800 text-sm whitespace-pre-wrap">{policy.analysis}</p>
          </div>
        )}
      </div>
    </div>
  )
}