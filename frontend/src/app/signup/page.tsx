'use client'
import { useRouter } from 'next/navigation'
import { Shield } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function SignupPage() {
  const router = useRouter()
  return (
    <div className="min-h-screen gradient-primary flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md text-center">
        <Shield className="h-12 w-12 text-blue-600 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Create Account</h1>
        <p className="text-blue-600 hindi-text mb-6">अकाउंट बनाएं</p>
        <p className="text-gray-500 mb-6">Signup page coming in Phase 5!</p>
        <Button onClick={() => router.push('/dashboard')} className="w-full bg-blue-600 hover:bg-blue-700">
          Go to Dashboard (Demo)
        </Button>
        <Button variant="ghost" onClick={() => router.push('/')} className="w-full mt-2">
          Back to Home
        </Button>
      </div>
    </div>
  )
}