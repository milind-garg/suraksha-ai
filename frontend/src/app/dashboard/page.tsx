'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { PageHeader } from '@/components/layout/page-header'
import { usePolicyStore } from '@/store/policy-store'
import { useAuthStore } from '@/store/auth-store'
import { useLanguage } from '@/hooks/use-language'
import {
  Shield, FileText, TrendingUp, AlertTriangle,
  Upload, ArrowRight, CheckCircle, Clock,
  IndianRupee, Brain, Star, ChevronRight
} from 'lucide-react'

export default function DashboardPage() {
  const router = useRouter()
  const { policies } = usePolicyStore()
  const { user } = useAuthStore()
  const { isHindi } = useLanguage()
  const [greeting, setGreeting] = useState({ en: 'Namaste', hi: 'नमस्ते' })

  useEffect(() => {
    const hour = new Date().getHours()
    if (hour < 12) setGreeting({ en: 'Good Morning', hi: 'सुप्रभात' })
    else if (hour < 17) setGreeting({ en: 'Good Afternoon', hi: 'नमस्ते' })
    else setGreeting({ en: 'Good Evening', hi: 'शुभ संध्या' })
  }, [])

  const totalPolicies = policies.length
  const analyzedPolicies = policies.filter(p => p.status === 'analyzed')
  const totalCoverage = policies.reduce((sum, p) => sum + (p.sumInsured || 0), 0)
  const totalPremium = policies.reduce((sum, p) => sum + (p.premiumAmount || 0), 0)
  const analyzedWithProbability = analyzedPolicies.filter(
    p => (p.analysisResult?.claimSuccessProbability ?? 0) > 0
  )
  const avgClaimProbability = analyzedWithProbability.length > 0
    ? Math.round(analyzedWithProbability.reduce((sum, p) =>
        sum + (p.analysisResult?.claimSuccessProbability || 0), 0
      ) / analyzedWithProbability.length)
    : 0
  const totalGaps = analyzedPolicies.reduce((sum, p) =>
    sum + (p.analysisResult?.coverageGaps?.length || 0), 0
  )

  const stats = [
    {
      title: 'Total Policies',
      titleHindi: 'कुल पॉलिसी',
      value: totalPolicies.toString(),
      icon: <FileText className="h-6 w-6 text-blue-600" />,
      color: 'bg-blue-50',
      sub: `${analyzedPolicies.length} analyzed`
    },
    {
      title: 'Total Coverage',
      titleHindi: 'कुल कवरेज',
      value: totalCoverage > 0 ? `₹${(totalCoverage / 100000).toFixed(1)}L` : 'N/A',
      icon: <Shield className="h-6 w-6 text-green-600" />,
      color: 'bg-green-50',
      sub: totalPremium > 0
        ? `₹${totalPremium.toLocaleString('en-IN')}/yr premium`
        : 'No policies yet'
    },
    {
      title: 'Coverage Gaps',
      titleHindi: 'कवरेज की कमी',
      value: totalGaps.toString(),
      icon: <AlertTriangle className="h-6 w-6 text-orange-600" />,
      color: 'bg-orange-50',
      sub: totalGaps > 0 ? 'Action needed' : 'Looking good!'
    },
    {
      title: 'Claim Success',
      titleHindi: 'क्लेम सफलता',
      value: avgClaimProbability > 0 ? `${avgClaimProbability}%` : 'N/A',
      icon: <TrendingUp className="h-6 w-6 text-purple-600" />,
      color: 'bg-purple-50',
      sub: avgClaimProbability >= 70
        ? 'Good chances'
        : avgClaimProbability > 0
        ? 'Needs attention'
        : 'Analyze a policy'
    }
  ]

  const quickActions = [
    {
      title: 'Upload New Policy',
      titleHindi: 'नई पॉलिसी अपलोड करें',
      description: 'Add an insurance document for AI analysis',
      icon: <Upload className="h-8 w-8 text-white" />,
      action: () => router.push('/dashboard/upload'),
      primary: true
    },
    {
      title: 'Gap Analysis',
      titleHindi: 'कवरेज गैप विश्लेषण',
      description: 'See what coverage you are missing',
      icon: <AlertTriangle className="h-8 w-8 text-orange-600" />,
      action: () => router.push('/dashboard/gap-analysis'),
      primary: false
    },
    {
      title: 'View My Policies',
      titleHindi: 'मेरी पॉलिसी देखें',
      description: 'See all your analyzed insurance policies',
      icon: <FileText className="h-8 w-8 text-gray-600" />,
      action: () => router.push('/dashboard/policies'),
      primary: false
    }
  ]

  const recentPolicies = policies.slice(0, 3)

  const TYPE_ICONS: Record<string, string> = {
    health: '🏥', life: '💚', vehicle: '🚗',
    home: '🏠', travel: '✈️', other: '📄'
  }

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={`${greeting.en}, ${user?.name?.split(' ')[0] || 'User'}!`}
        titleHindi={`${greeting.hi}, ${user?.name?.split(' ')[0] || 'User'}!`}
        description={isHindi ? 'सुरक्षा AI में आपका स्वागत है' : 'Your insurance intelligence overview'}
      />

      <div className="p-6 max-w-7xl mx-auto space-y-6">

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat, i) => (
            <Card key={i} className="border-0 shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-lg ${stat.color} flex-shrink-0`}>
                    {stat.icon}
                  </div>
                  <div className="min-w-0">
                    <p className={`text-xs text-gray-500 truncate ${isHindi ? 'hindi-text' : ''}`}>
                      {isHindi ? stat.titleHindi : stat.title}
                    </p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{stat.sub}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Quick Actions */}
        <div>
          <h2 className="text-sm font-semibold text-gray-700 mb-3">
            {isHindi ? 'त्वरित कार्य' : 'Quick Actions'}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {quickActions.map((action, i) => (
              <Card
                key={i}
                className={`border-0 shadow-sm cursor-pointer hover:shadow-md transition-shadow ${
                  action.primary ? 'bg-blue-600 text-white' : 'bg-white'
                }`}
                onClick={action.action}
              >
                <CardContent className="p-5">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-lg ${
                        action.primary ? 'bg-white/20' : 'bg-gray-50'
                      }`}>
                        {action.icon}
                      </div>
                      <div>
                        <h3 className={`font-semibold text-sm ${isHindi ? 'hindi-text' : ''} ${
                          action.primary ? 'text-white' : 'text-gray-900'
                        }`}>
                          {isHindi ? action.titleHindi : action.title}
                        </h3>
                        <p className={`text-xs mt-1 ${
                          action.primary ? 'text-blue-100' : 'text-gray-500'
                        }`}>
                          {action.description}
                        </p>
                      </div>
                    </div>
                    <ArrowRight className={`h-4 w-4 flex-shrink-0 ${
                      action.primary ? 'text-white' : 'text-gray-400'
                    }`} />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Left Column */}
          <div className="lg:col-span-2 space-y-6">

            {/* Coverage Health Score */}
            {totalPolicies > 0 && (
              <Card className="border-0 shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Star className="h-5 w-5 text-yellow-500" />
                    {isHindi ? 'कवरेज स्वास्थ्य स्कोर' : 'Coverage Health Score'}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {(() => {
                    const score = Math.min(100, Math.max(0,
                      (analyzedPolicies.length / Math.max(totalPolicies, 1)) * 40 +
                      (avgClaimProbability * 0.4) +
                      (totalGaps === 0 ? 20 : Math.max(0, 20 - totalGaps * 5))
                    ))
                    const scoreInt = Math.round(score)
                    const label = scoreInt >= 80 ? 'Excellent' :
                      scoreInt >= 60 ? 'Good' :
                      scoreInt >= 40 ? 'Fair' : 'Needs Work'
                    const labelHindi = scoreInt >= 80 ? 'उत्कृष्ट' :
                      scoreInt >= 60 ? 'अच्छा' :
                      scoreInt >= 40 ? 'ठीक है' : 'सुधार जरूरी'
                    const color = scoreInt >= 80 ? 'text-green-600' :
                      scoreInt >= 60 ? 'text-blue-600' :
                      scoreInt >= 40 ? 'text-yellow-600' : 'text-red-600'

                    return (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <span className={`text-3xl font-bold ${color}`}>{scoreInt}</span>
                            <span className="text-gray-400 text-lg">/100</span>
                            <span className={`ml-2 font-medium ${isHindi ? 'hindi-text' : ''} ${color}`}>
                              {isHindi ? labelHindi : label}
                            </span>
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => router.push('/dashboard/gap-analysis')}
                            className="text-blue-600 border-blue-200"
                          >
                            {isHindi ? 'पूर्ण विश्लेषण' : 'Full Analysis'}
                            <ChevronRight className="h-3 w-3 ml-1" />
                          </Button>
                        </div>
                        <Progress value={scoreInt} className="h-3" />
                        <p className="text-xs text-gray-500">
                          {isHindi
                            ? `${totalPolicies} पॉलिसी, ${analyzedPolicies.length} विश्लेषित, ${totalGaps} कमी`
                            : `Based on ${totalPolicies} ${totalPolicies === 1 ? 'policy' : 'policies'}, ${analyzedPolicies.length} analyzed, ${totalGaps} gap${totalGaps !== 1 ? 's' : ''} found`
                          }
                        </p>
                      </div>
                    )
                  })()}
                </CardContent>
              </Card>
            )}

            {/* Recent Policies */}
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">
                    {isHindi ? 'हाल की पॉलिसी' : 'Recent Policies'}
                  </CardTitle>
                  {policies.length > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => router.push('/dashboard/policies')}
                      className="text-blue-600 text-xs"
                    >
                      {isHindi ? 'सभी देखें' : 'View All'} <ChevronRight className="h-3 w-3 ml-1" />
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {recentPolicies.length === 0 ? (
                  <div className="text-center py-8">
                    <FileText className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500 text-sm">
                      {isHindi ? 'अभी कोई पॉलिसी नहीं' : 'No policies yet'}
                    </p>
                    <Button
                      size="sm"
                      onClick={() => router.push('/dashboard/upload')}
                      className="mt-3 bg-blue-600 hover:bg-blue-700"
                    >
                      {isHindi ? 'पहली पॉलिसी अपलोड करें' : 'Upload First Policy'}
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {recentPolicies.map((policy) => (
                      <div
                        key={policy.policyId}
                        onClick={() => router.push(`/dashboard/policies/${policy.policyId}`)}
                        className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                      >
                        <span className="text-xl">
                          {TYPE_ICONS[policy.policyType] || '📄'}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 text-sm truncate">
                            {policy.policyName}
                          </p>
                          <p className="text-xs text-gray-500">{policy.insurerName}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className={`text-xs ${
                            policy.status === 'analyzed'
                              ? 'bg-green-100 text-green-700'
                              : policy.status === 'processing'
                              ? 'bg-yellow-100 text-yellow-700'
                              : 'bg-blue-100 text-blue-700'
                          }`}>
                            {policy.status}
                          </Badge>
                          <ChevronRight className="h-4 w-4 text-gray-300" />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

          </div>

          {/* Right Column */}
          <div className="space-y-4">

            {/* Quick Upload */}
            <Card
              className="border-0 shadow-sm bg-gradient-to-br from-blue-600 to-indigo-700 text-white cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => router.push('/dashboard/upload')}
            >
              <CardContent className="p-5 text-center">
                <Upload className="h-10 w-10 mx-auto mb-3 opacity-90" />
                <h3 className={`font-bold text-lg ${isHindi ? 'hindi-text' : ''}`}>
                  {isHindi ? 'पॉलिसी अपलोड करें' : 'Upload Policy'}
                </h3>
                <p className="text-blue-200 text-xs mt-2">
                  {isHindi ? 'तुरंत AI विश्लेषण पाएं' : 'Get instant AI analysis'}
                </p>
                <div className="mt-3 bg-white/20 rounded-lg px-3 py-1.5 text-sm font-medium">
                  {isHindi ? 'अभी शुरू करें →' : 'Start Now →'}
                </div>
              </CardContent>
            </Card>

            {/* AI Tips */}
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Brain className="h-4 w-4 text-purple-600" />
                  {isHindi ? 'AI सलाह' : 'AI Tips'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    {
                      tip: 'Health insurance should cover at least ₹5 lakh per family member',
                      hindi: 'प्रति परिवार ₹5 लाख का स्वास्थ्य बीमा जरूरी है'
                    },
                    {
                      tip: 'Always check the waiting period for pre-existing conditions',
                      hindi: 'पहले से मौजूद बीमारियों की प्रतीक्षा अवधि जांचें'
                    },
                    {
                      tip: 'Renew policies 30 days before expiry to avoid gaps',
                      hindi: 'समाप्ति से 30 दिन पहले पॉलिसी नवीनीकृत करें'
                    },
                  ].map((item, i) => (
                    <div key={i} className="flex gap-2">
                      <div className="w-5 h-5 rounded-full bg-purple-100 text-purple-600 text-xs flex items-center justify-center flex-shrink-0 mt-0.5 font-bold">
                        {i + 1}
                      </div>
                      <p className={`text-xs text-gray-700 ${isHindi ? 'hindi-text' : ''}`}>
                        {isHindi ? item.hindi : item.tip}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Getting Started */}
            <Card className="border-0 shadow-sm bg-gradient-to-br from-green-50 to-emerald-50">
              <CardHeader className="pb-2">
                <CardTitle className={`text-sm ${isHindi ? 'hindi-text' : ''}`}>
                  {isHindi ? 'शुरुआत करें' : 'Getting Started'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {[
                    { done: true, text: 'Create account', hindi: 'अकाउंट बनाएं' },
                    { done: totalPolicies > 0, text: 'Upload a policy', hindi: 'पॉलिसी अपलोड करें' },
                    { done: analyzedPolicies.length > 0, text: 'Run AI analysis', hindi: 'AI विश्लेषण करें' },
                    {
                      done: totalGaps === 0 && analyzedPolicies.length > 0,
                      text: 'Fix coverage gaps',
                      hindi: 'कवरेज गैप ठीक करें'
                    },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-2">
                      {item.done
                        ? <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                        : <Clock className="h-4 w-4 text-gray-300 flex-shrink-0" />
                      }
                      <span className={`text-xs ${isHindi ? 'hindi-text' : ''} ${
                        item.done ? 'text-gray-400 line-through' : 'text-gray-700'
                      }`}>
                        {isHindi ? item.hindi : item.text}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

          </div>
        </div>
      </div>
    </div>
  )
}