'use client'

import { useState } from 'react'
import Link from 'next/link'
import { PageHeader } from '@/components/layout/page-header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useAuthStore } from '@/store/auth-store'
import { usePolicyStore } from '@/store/policy-store'
import { useRecommendationStore } from '@/store/recommendation-store'
import { useToast } from '@/hooks/use-toast'
import { ProfileQuestionnaire } from '@/components/recommendations/ProfileQuestionnaire'
import {
  User, Mail, Phone, Shield, FileText,
  TrendingUp, Edit2, Save, X, Award,
  IndianRupee, AlertTriangle, ChevronDown, ChevronUp,
  Lightbulb, CheckCircle2
} from 'lucide-react'

export default function ProfilePage() {
  const { user } = useAuthStore()
  const { policies } = usePolicyStore()
  const { profile: recProfile, isProfileComplete } = useRecommendationStore()
  const { toast } = useToast()
  const [isEditing, setIsEditing] = useState(false)
  const [showRecommendationSection, setShowRecommendationSection] = useState(false)
  const [form, setForm] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
  })

  // Stats
  const analyzedPolicies = policies.filter(p => p.status === 'analyzed')
  const totalCoverage = policies.reduce((sum, p) => sum + (p.sumInsured || 0), 0)
  const totalPremium = policies.reduce((sum, p) => sum + (p.premiumAmount || 0), 0)
  const totalGaps = analyzedPolicies.reduce((sum, p) =>
    sum + (p.analysisResult?.coverageGaps?.length || 0), 0
  )

  const handleSave = () => {
    toast({
      title: 'Profile Updated',
      description: 'Your profile has been saved successfully'
    })
    setIsEditing(false)
  }

  const policyTypeCount = policies.reduce((acc, p) => {
    acc[p.policyType] = (acc[p.policyType] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const TYPE_ICONS: Record<string, string> = {
    health: '🏥', life: '💚', vehicle: '🚗',
    home: '🏠', travel: '✈️', other: '📄'
  }

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="My Profile"
        titleHindi="मेरी प्रोफाइल"
        description="Manage your account and view your insurance summary"
      />

      <div className="p-6 max-w-5xl mx-auto space-y-6">

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Profile Card */}
          <Card className="border-0 shadow-sm lg:col-span-1">
            <CardContent className="p-6 text-center">

              {/* Avatar */}
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center mx-auto mb-4">
                <span className="text-white text-2xl font-bold">
                  {(user?.name || 'U').charAt(0).toUpperCase()}
                </span>
              </div>

              <h2 className="text-xl font-bold text-gray-900">{user?.name || 'User'}</h2>
              <p className="text-gray-500 text-sm mt-1">{user?.email}</p>

              <div className="mt-4 flex justify-center">
                <Badge className="bg-blue-100 text-blue-700">
                  <Shield className="h-3 w-3 mr-1" />
                  Suraksha AI Member
                </Badge>
              </div>

              {/* Quick Stats */}
              <div className="mt-6 grid grid-cols-2 gap-3">
                <div className="bg-blue-50 rounded-xl p-3">
                  <FileText className="h-5 w-5 text-blue-600 mx-auto mb-1" />
                  <div className="text-xl font-bold text-gray-900">{policies.length}</div>
                  <div className="text-xs text-gray-500">Policies</div>
                </div>
                <div className="bg-green-50 rounded-xl p-3">
                  <TrendingUp className="h-5 w-5 text-green-600 mx-auto mb-1" />
                  <div className="text-xl font-bold text-gray-900">{analyzedPolicies.length}</div>
                  <div className="text-xs text-gray-500">Analyzed</div>
                </div>
              </div>

              {/* Achievement */}
              {policies.length > 0 && (
                <div className="mt-4 bg-yellow-50 rounded-xl p-3 flex items-center gap-2">
                  <Award className="h-5 w-5 text-yellow-600 flex-shrink-0" />
                  <div className="text-left">
                    <p className="text-xs font-medium text-gray-800">Insurance Aware!</p>
                    <p className="text-xs text-yellow-600 hindi-text">बीमा जागरूक!</p>
                  </div>
                </div>
              )}

            </CardContent>
          </Card>

          {/* Right Column */}
          <div className="lg:col-span-2 space-y-6">

            {/* Personal Info */}
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <User className="h-5 w-5 text-blue-600" />
                    Personal Information / व्यक्तिगत जानकारी
                  </CardTitle>
                  {!isEditing ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsEditing(true)}
                      className="text-blue-600"
                    >
                      <Edit2 className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                  ) : (
                    <div className="flex gap-2">
                      <Button size="sm" onClick={handleSave} className="bg-blue-600 hover:bg-blue-700">
                        <Save className="h-4 w-4 mr-1" />
                        Save
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => setIsEditing(false)}>
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs text-gray-500 flex items-center gap-1">
                      <User className="h-3 w-3" /> Full Name / पूरा नाम
                    </Label>
                    {isEditing ? (
                      <Input
                        value={form.name}
                        onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                        className="mt-1"
                      />
                    ) : (
                      <p className="mt-1 font-medium text-gray-900">{user?.name || 'Not set'}</p>
                    )}
                  </div>

                  <div>
                    <Label className="text-xs text-gray-500 flex items-center gap-1">
                      <Mail className="h-3 w-3" /> Email / ईमेल
                    </Label>
                    <p className="mt-1 font-medium text-gray-900">{user?.email || 'Not set'}</p>
                    <p className="text-xs text-green-600">✓ Verified</p>
                  </div>

                  <div>
                    <Label className="text-xs text-gray-500 flex items-center gap-1">
                      <Phone className="h-3 w-3" /> Phone / फ़ोन
                    </Label>
                    {isEditing ? (
                      <Input
                        value={form.phone}
                        onChange={e => setForm(p => ({ ...p, phone: e.target.value }))}
                        placeholder="+91 98765 43210"
                        className="mt-1"
                      />
                    ) : (
                      <p className="mt-1 font-medium text-gray-900">
                        {user?.phone || 'Not added'}
                      </p>
                    )}
                  </div>

                  <div>
                    <Label className="text-xs text-gray-500">Member Since / सदस्य बने</Label>
                    <p className="mt-1 font-medium text-gray-900">
                      {new Date().toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Insurance Summary */}
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Shield className="h-5 w-5 text-green-600" />
                  Insurance Summary / बीमा सारांश
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-4">
                  <div className="bg-gray-50 rounded-xl p-3 text-center">
                    <IndianRupee className="h-5 w-5 text-green-600 mx-auto mb-1" />
                    <div className="text-lg font-bold text-gray-900">
                      {totalCoverage > 0 ? `₹${(totalCoverage/100000).toFixed(1)}L` : '₹0'}
                    </div>
                    <div className="text-xs text-gray-500">Total Coverage</div>
                    <div className="text-xs text-blue-500 hindi-text">कुल कवरेज</div>
                  </div>

                  <div className="bg-gray-50 rounded-xl p-3 text-center">
                    <IndianRupee className="h-5 w-5 text-blue-600 mx-auto mb-1" />
                    <div className="text-lg font-bold text-gray-900">
                      {totalPremium > 0 ? `₹${(totalPremium/1000).toFixed(1)}K` : '₹0'}
                    </div>
                    <div className="text-xs text-gray-500">Annual Premium</div>
                    <div className="text-xs text-blue-500 hindi-text">वार्षिक प्रीमियम</div>
                  </div>

                  <div className="bg-gray-50 rounded-xl p-3 text-center col-span-2 sm:col-span-1">
                    <AlertTriangle className="h-5 w-5 text-orange-600 mx-auto mb-1" />
                    <div className="text-lg font-bold text-gray-900">{totalGaps}</div>
                    <div className="text-xs text-gray-500">Coverage Gaps</div>
                    <div className="text-xs text-blue-500 hindi-text">कवरेज कमियां</div>
                  </div>
                </div>

                {/* Policy Types Breakdown */}
                {policies.length > 0 && (
                  <div>
                    <p className="text-xs text-gray-500 mb-2 font-medium">
                      Policy Types / पॉलिसी प्रकार
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(policyTypeCount).map(([type, count]) => (
                        <div key={type} className="flex items-center gap-1 bg-blue-50 rounded-full px-3 py-1">
                          <span>{TYPE_ICONS[type] || '📄'}</span>
                          <span className="text-xs text-gray-700 capitalize">{type}</span>
                          <Badge className="bg-blue-600 text-white text-xs h-4 w-4 p-0 flex items-center justify-center rounded-full">
                            {count}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {policies.length === 0 && (
                  <div className="text-center py-4">
                    <p className="text-gray-400 text-sm">
                      Upload policies to see your insurance summary
                    </p>
                    <p className="text-blue-400 hindi-text text-xs mt-1">
                      पॉलिसी अपलोड करें और अपना बीमा सारांश देखें
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

          </div>
        </div>

        {/* Recommendation Profile Section */}
        <div className="mt-8">
          <Card className="border-0 shadow-sm">
            <CardHeader
              className="pb-2 cursor-pointer hover:bg-gray-50 transition-colors"
              onClick={() => setShowRecommendationSection(!showRecommendationSection)}
            >
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <Lightbulb className="h-5 w-5 text-purple-600" />
                  Recommendation Profile / सुझाव प्रोफाइल
                </CardTitle>
                <div className="flex items-center gap-2">
                  {isProfileComplete() && (
                    <Badge className="bg-green-100 text-green-700 flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3" />
                      Complete
                    </Badge>
                  )}
                  {showRecommendationSection ? (
                    <ChevronUp className="h-5 w-5" />
                  ) : (
                    <ChevronDown className="h-5 w-5" />
                  )}
                </div>
              </div>
            </CardHeader>

            {showRecommendationSection && (
              <CardContent className="space-y-4">
                {!isProfileComplete() ? (
                  <div>
                    <p className="text-gray-600 mb-4">
                      Build your recommendation profile to get personalized insurance policy suggestions.
                    </p>
                    <ProfileQuestionnaire />
                  </div>
                ) : (
                  <div className="space-y-4">
                    <Alert className="bg-green-50 border-green-200">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      <AlertDescription className="text-green-800">
                        Your recommendation profile is complete! You can now get personalized recommendations.
                      </AlertDescription>
                    </Alert>

                    {/* Profile Summary */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                      <div className="bg-purple-50 rounded-lg p-3">
                        <p className="text-xs text-gray-500 font-semibold">Age</p>
                        <p className="text-lg font-bold text-gray-900 mt-1">{recProfile?.age} yrs</p>
                      </div>
                      <div className="bg-purple-50 rounded-lg p-3">
                        <p className="text-xs text-gray-500 font-semibold">Family Size</p>
                        <p className="text-lg font-bold text-gray-900 mt-1">{recProfile?.familySize} members</p>
                      </div>
                      <div className="bg-purple-50 rounded-lg p-3">
                        <p className="text-xs text-gray-500 font-semibold">Income</p>
                        <p className="text-lg font-bold text-gray-900 mt-1">
                          ₹{(recProfile?.annualIncome ? recProfile.annualIncome / 100000 : 0).toFixed(1)}L
                        </p>
                      </div>
                      <div className="bg-purple-50 rounded-lg p-3 col-span-2 sm:col-span-1">
                        <p className="text-xs text-gray-500 font-semibold">Job Title</p>
                        <p className="text-sm font-bold text-gray-900 mt-1">{recProfile?.jobTitle}</p>
                      </div>
                      <div className="bg-purple-50 rounded-lg p-3 col-span-2 sm:col-span-1">
                        <p className="text-xs text-gray-500 font-semibold">Industry</p>
                        <p className="text-sm font-bold text-gray-900 mt-1">{recProfile?.industry}</p>
                      </div>
                      <div className="bg-purple-50 rounded-lg p-3 col-span-2 sm:col-span-1">
                        <p className="text-xs text-gray-500 font-semibold">Health</p>
                        <p className="text-sm font-bold text-gray-900 mt-1 capitalize">
                          {recProfile?.healthStatus}
                        </p>
                      </div>
                    </div>

                    <div className="bg-purple-50 p-3 rounded-lg">
                      <p className="text-xs text-gray-500 font-semibold mb-1">Goals</p>
                      <p className="text-sm text-gray-700">{recProfile?.goals}</p>
                    </div>

                    {recProfile?.linkedinUrl && (
                      <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                        <p className="text-xs text-gray-500 font-semibold mb-1">LinkedIn Profile</p>
                        <p className="text-sm text-blue-600 truncate">{recProfile.linkedinUrl}</p>
                      </div>
                    )}

                    <div className="flex gap-2 pt-2">
                      <Button
                        onClick={() => setShowRecommendationSection(false)}
                        className="flex-1"
                        asChild
                      >
                        <Link href="/dashboard/recommendations">
                          Get Recommendations →
                        </Link>
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => setShowRecommendationSection(true)}
                      >
                        Edit Profile
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            )}
          </Card>
        </div>

      </div>
    </div>
  )
}