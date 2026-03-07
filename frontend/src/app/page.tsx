'use client'

import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Shield, FileText, Brain, TrendingUp,
  CheckCircle, ArrowRight, Star, Users
} from 'lucide-react'

export default function LandingPage() {
  const router = useRouter()

  const features = [
    {
      icon: <FileText className="h-6 w-6 text-blue-600" />,
      title: "Policy Upload",
      titleHindi: "पॉलिसी अपलोड",
      description: "Upload any insurance document — PDF or image"
    },
    {
      icon: <Brain className="h-6 w-6 text-purple-600" />,
      title: "AI Analysis",
      titleHindi: "AI विश्लेषण",
      description: "Claude AI reads and understands your policy instantly"
    },
    {
      icon: <Shield className="h-6 w-6 text-green-600" />,
      title: "Coverage Gaps",
      titleHindi: "कवरेज गैप",
      description: "Identify what's NOT covered before it's too late"
    },
    {
      icon: <TrendingUp className="h-6 w-6 text-orange-600" />,
      title: "Claim Prediction",
      titleHindi: "क्लेम भविष्यवाणी",
      description: "Know your claim success probability in advance"
    }
  ]

  const stats = [
    { value: "10L+", label: "Families Protected" },
    { value: "95%", label: "Accuracy Rate" },
    { value: "2 Min", label: "Analysis Time" },
    { value: "Hindi+", label: "Language Support" }
  ]

  return (
    <div className="min-h-screen bg-white">

      {/* Navigation */}
      <nav className="border-b border-gray-100 sticky top-0 bg-white/95 backdrop-blur z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <Shield className="h-8 w-8 text-blue-600" />
              <div>
                <span className="text-xl font-bold text-gray-900">Suraksha</span>
                <span className="text-xl font-bold text-blue-600"> AI</span>
                <p className="text-xs text-gray-500 leading-none">सुरक्षा AI</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                onClick={() => router.push('/login')}
              >
                Login
              </Button>
              <Button
                onClick={() => router.push('/signup')}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Get Started Free
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="gradient-primary text-white py-20 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <Badge className="mb-4 bg-white/20 text-white border-white/30 hover:bg-white/30">
            AWS AI for Bharat Hackathon 2024
          </Badge>
          <h1 className="text-4xl md:text-6xl font-bold mb-4 animate-fade-in">
            Apni Insurance Ko
            <br />
            <span className="text-yellow-300">Samjho AI Se</span>
          </h1>
          <p className="text-xl md:text-2xl text-blue-100 mb-2">
            अपनी बीमा पॉलिसी को समझो AI से
          </p>
          <p className="text-lg text-blue-200 mb-8 max-w-2xl mx-auto">
            Upload your insurance policy. Our AI explains it in simple Hindi & English,
            finds coverage gaps, and predicts claim success.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              onClick={() => router.push('/signup')}
              className="bg-white text-blue-700 hover:bg-blue-50 text-lg px-8 py-6"
            >
              Start Free Analysis
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button
  size="lg"
  variant="outline"
  onClick={() => router.push('/login')}
  className="border-white text-blue-700 bg-white hover:bg-blue-50 text-lg px-8 py-6"
>
  Login to Dashboard
</Button>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="bg-gray-50 py-12 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {stats.map((stat, i) => (
              <div key={i} className="text-center">
                <div className="text-3xl font-bold text-blue-600">{stat.value}</div>
                <div className="text-gray-600 mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              How Suraksha AI Works
            </h2>
            <p className="text-gray-600 text-lg">
              सुरक्षा AI कैसे काम करता है
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, i) => (
              <Card key={i} className="border-0 shadow-md hover:shadow-lg transition-shadow">
                <CardContent className="p-6 text-center">
                  <div className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center mx-auto mb-4">
                    {feature.icon}
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-1">{feature.title}</h3>
                  <p className="text-sm text-blue-600 mb-2 hindi-text">{feature.titleHindi}</p>
                  <p className="text-gray-600 text-sm">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How it works steps */}
      <section className="bg-blue-50 py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            3 Simple Steps / 3 आसान कदम
          </h2>
          <div className="space-y-6">
            {[
              { step: "1", title: "Upload Your Policy", hindi: "अपनी पॉलिसी अपलोड करें", desc: "Upload PDF or photo of your insurance document" },
              { step: "2", title: "AI Analyzes It", hindi: "AI विश्लेषण करेगा", desc: "Our AI reads every clause and understands your coverage" },
              { step: "3", title: "Get Clear Insights", hindi: "स्पष्ट जानकारी पाएं", desc: "See coverage details, gaps, and claim tips in Hindi & English" }
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-4 bg-white rounded-xl p-6 shadow-sm">
                <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-lg flex-shrink-0">
                  {item.step}
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{item.title}</h3>
                  <p className="text-blue-600 text-sm hindi-text">{item.hindi}</p>
                  <p className="text-gray-600 text-sm mt-1">{item.desc}</p>
                </div>
                <CheckCircle className="h-6 w-6 text-green-500 ml-auto flex-shrink-0 mt-1" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 text-center">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Ready to Understand Your Insurance?
          </h2>
          <p className="text-gray-600 mb-8">
            Join thousands of Indian families who use Suraksha AI to protect themselves better.
          </p>
          <Button
            size="lg"
            onClick={() => router.push('/signup')}
            className="bg-blue-600 hover:bg-blue-700 text-lg px-10 py-6"
          >
            Get Started Free — It's Easy!
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-100 py-8 px-4">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-blue-600" />
            <span className="font-semibold text-gray-700">Suraksha AI</span>
          </div>
          <p className="text-gray-500 text-sm">
            Built for AWS AI for Bharat Hackathon • Powered by Amazon Bedrock
          </p>
          <div className="flex items-center gap-1 text-yellow-500">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="h-4 w-4 fill-current" />
            ))}
            <span className="text-gray-600 text-sm ml-1">4.9/5</span>
          </div>
        </div>
      </footer>

    </div>
  )
}