'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { PageHeader } from '@/components/layout/page-header'
import {
  Shield, FileText, TrendingUp, AlertTriangle,
  Upload, ArrowRight, CheckCircle, Clock
} from 'lucide-react'

export default function DashboardPage() {
  const router = useRouter()
  const [userName, setUserName] = useState('User')

  useEffect(() => {
    const userStr = localStorage.getItem('auth_user')
    if (userStr) {
      const user = JSON.parse(userStr)
      setUserName(user.name || 'User')
    }
  }, [])

  const stats = [
    {
      title: 'Total Policies',
      titleHindi: 'कुल पॉलिसी',
      value: '0',
      icon: <FileText className="h-6 w-6 text-blue-600" />,
      color: 'bg-blue-50'
    },
    {
      title: 'Coverage Score',
      titleHindi: 'कवरेज स्कोर',
      value: 'N/A',
      icon: <Shield className="h-6 w-6 text-green-600" />,
      color: 'bg-green-50'
    },
    {
      title: 'Gaps Found',
      titleHindi: 'गैप मिले',
      value: '0',
      icon: <AlertTriangle className="h-6 w-6 text-orange-600" />,
      color: 'bg-orange-50'
    },
    {
      title: 'Claim Success',
      titleHindi: 'क्लेम सफलता',
      value: 'N/A',
      icon: <TrendingUp className="h-6 w-6 text-purple-600" />,
      color: 'bg-purple-50'
    }
  ]

  const quickActions = [
    {
      title: 'Upload New Policy',
      titleHindi: 'नई पॉलिसी अपलोड करें',
      description: 'Add an insurance document for AI analysis',
      icon: <Upload className="h-8 w-8 text-blue-600" />,
      action: () => router.push('/dashboard/upload'),
      primary: true
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

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={`Namaste, ${userName}!`}
        titleHindi={`नमस्ते, ${userName}!`}
        description="Here's your insurance intelligence overview"
      />

      <div className="p-6 max-w-7xl mx-auto space-y-6">

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat, i) => (
            <Card key={i} className="border-0 shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${stat.color}`}>
                    {stat.icon}
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">{stat.title}</p>
                    <p className="text-xs text-blue-500 hindi-text">{stat.titleHindi}</p>
                    <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Quick Actions */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Quick Actions / त्वरित कार्य
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {quickActions.map((action, i) => (
              <Card
                key={i}
                className={`border-0 shadow-sm cursor-pointer hover:shadow-md transition-shadow ${action.primary ? 'bg-blue-600 text-white' : 'bg-white'}`}
                onClick={action.action}
              >
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      <div className={`p-2 rounded-lg ${action.primary ? 'bg-white/20' : 'bg-gray-50'}`}>
                        {action.primary
                          ? <Upload className="h-8 w-8 text-white" />
                          : action.icon
                        }
                      </div>
                      <div>
                        <h3 className={`font-semibold ${action.primary ? 'text-white' : 'text-gray-900'}`}>
                          {action.title}
                        </h3>
                        <p className={`text-sm hindi-text ${action.primary ? 'text-blue-100' : 'text-blue-500'}`}>
                          {action.titleHindi}
                        </p>
                        <p className={`text-sm mt-1 ${action.primary ? 'text-blue-100' : 'text-gray-500'}`}>
                          {action.description}
                        </p>
                      </div>
                    </div>
                    <ArrowRight className={`h-5 w-5 ${action.primary ? 'text-white' : 'text-gray-400'}`} />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Getting Started */}
        <Card className="border-0 shadow-sm bg-gradient-to-r from-blue-50 to-indigo-50">
          <CardHeader>
            <CardTitle className="text-lg text-gray-900">
              Getting Started / शुरुआत करें
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { done: true, text: 'Create your account', hindi: 'अकाउंट बनाएं' },
                { done: false, text: 'Upload your first policy', hindi: 'पहली पॉलिसी अपलोड करें' },
                { done: false, text: 'Review AI analysis', hindi: 'AI विश्लेषण देखें' },
                { done: false, text: 'Check coverage gaps', hindi: 'कवरेज गैप जांचें' },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3">
                  {item.done
                    ? <CheckCircle className="h-5 w-5 text-green-500" />
                    : <Clock className="h-5 w-5 text-gray-400" />
                  }
                  <div>
                    <span className={`text-sm ${item.done ? 'text-gray-500 line-through' : 'text-gray-700'}`}>
                      {item.text}
                    </span>
                    <span className="text-xs text-blue-500 hindi-text ml-2">{item.hindi}</span>
                  </div>
                </div>
              ))}
            </div>
            <Button
              className="mt-4 bg-blue-600 hover:bg-blue-700"
              onClick={() => router.push('/dashboard/upload')}
            >
              Upload First Policy
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </CardContent>
        </Card>

      </div>
    </div>
  )
}