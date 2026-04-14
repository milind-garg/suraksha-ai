'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Shield, Eye, EyeOff, ArrowRight, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { registerUser, confirmOTP, resendOTP } from '@/lib/auth'

type Step = 'register' | 'verify'

export default function SignupPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [step, setStep] = useState<Step>('register')
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [email, setEmail] = useState('')

  // Form fields
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: ''
  })
  const [otp, setOtp] = useState('')

  const updateForm = (field: keyof typeof form, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  // ─── Handle Register ───────────────────────────────────
  const handleRegister = async () => {
    if (!form.name || !form.email || !form.password) {
      toast({ title: 'Error', description: 'Please fill all required fields', variant: 'destructive' })
      return
    }
    if (form.password !== form.confirmPassword) {
      toast({ title: 'Error', description: 'Passwords do not match', variant: 'destructive' })
      return
    }
    if (form.password.length < 8) {
      toast({ title: 'Error', description: 'Password must be at least 8 characters', variant: 'destructive' })
      return
    }

    setIsLoading(true)
    try {
      await registerUser(form.email, form.password, form.name, form.phone)
      setEmail(form.email)
      setStep('verify')
      toast({
        title: 'OTP Sent!',
        description: `Verification code sent to ${form.email}`
      })
    } catch (error: unknown) {
      toast({
        title: 'Registration Failed',
        description: error instanceof Error ? error.message : 'Something went wrong',
        variant: 'destructive'
      })
    } finally {
      setIsLoading(false)
    }
  }

  // ─── Handle OTP Verify ─────────────────────────────────
  const handleVerify = async () => {
    if (!otp || otp.length !== 6) {
      toast({ title: 'Error', description: 'Enter the 6-digit OTP', variant: 'destructive' })
      return
    }

    setIsLoading(true)
    try {
      await confirmOTP(email, otp)
      toast({
        title: 'Account Created!',
        description: 'Your account is verified. Please login.'
      })
      router.push('/login')
    } catch (error: unknown) {
      toast({
        title: 'Invalid OTP',
        description: error instanceof Error ? error.message : 'Wrong code, try again',
        variant: 'destructive'
      })
    } finally {
      setIsLoading(false)
    }
  }

  // ─── Handle Resend OTP ─────────────────────────────────
  const handleResend = async () => {
    try {
      await resendOTP(email)
      toast({ title: 'OTP Resent', description: 'Check your email again' })
    } catch (error: unknown) {
      toast({ title: 'Error', description: error instanceof Error ? error.message : 'Failed to resend', variant: 'destructive' })
    }
  }

  return (
    <div className="min-h-screen gradient-primary flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">

        {/* Header */}
        <div className="bg-gray-50 px-8 py-6 text-center border-b">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Shield className="h-8 w-8 text-blue-600" />
            <span className="text-xl font-bold text-gray-900">Suraksha AI</span>
          </div>
          <h2 className="text-lg font-semibold text-gray-800">
            {step === 'register' ? 'Create Account' : 'Verify Email'}
          </h2>
          <p className="text-blue-600 text-sm hindi-text">
            {step === 'register' ? 'अकाउंट बनाएं' : 'ईमेल सत्यापित करें'}
          </p>
        </div>

        <div className="p-8">

          {/* ── STEP 1: Register Form ── */}
          {step === 'register' && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Full Name *</Label>
                <Input
                  id="name"
                  placeholder="Rahul Sharma"
                  value={form.name}
                  onChange={e => updateForm('name', e.target.value)}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="email">Email Address *</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="rahul@example.com"
                  value={form.email}
                  onChange={e => updateForm('email', e.target.value)}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="phone">Phone Number (Optional)</Label>
                <Input
                  id="phone"
                  placeholder="+91 98765 43210"
                  value={form.phone}
                  onChange={e => updateForm('phone', e.target.value)}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="password">Password *</Label>
                <div className="relative mt-1">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Min 8 characters"
                    value={form.password}
                    onChange={e => updateForm('password', e.target.value)}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div>
                <Label htmlFor="confirmPassword">Confirm Password *</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="Repeat your password"
                  value={form.confirmPassword}
                  onChange={e => updateForm('confirmPassword', e.target.value)}
                  className="mt-1"
                />
              </div>

              {/* Password requirements */}
              <div className="bg-blue-50 rounded-lg p-3 text-xs text-gray-600 space-y-1">
                {[
                  { ok: form.password.length >= 8, text: 'At least 8 characters' },
                  { ok: /[A-Z]/.test(form.password), text: 'One uppercase letter' },
                  { ok: /[a-z]/.test(form.password), text: 'One lowercase letter' },
                  { ok: /[0-9]/.test(form.password), text: 'One number' },
                ].map((req, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <CheckCircle className={`h-3 w-3 ${req.ok ? 'text-green-500' : 'text-gray-300'}`} />
                    <span className={req.ok ? 'text-green-700' : ''}>{req.text}</span>
                  </div>
                ))}
              </div>

              <Button
                onClick={handleRegister}
                disabled={isLoading}
                className="w-full bg-blue-600 hover:bg-blue-700 py-5"
              >
                {isLoading ? 'Creating Account...' : 'Create Account'}
                {!isLoading && <ArrowRight className="ml-2 h-4 w-4" />}
              </Button>

              <p className="text-center text-sm text-gray-600">
                Already have an account?{' '}
                <button
                  onClick={() => router.push('/login')}
                  className="text-blue-600 font-medium hover:underline"
                >
                  Login here
                </button>
              </p>
            </div>
          )}

          {/* ── STEP 2: OTP Verification ── */}
          {step === 'verify' && (
            <div className="space-y-6 text-center">
              <div className="bg-blue-50 rounded-xl p-4">
                <p className="text-gray-700 text-sm">
                  We sent a 6-digit code to
                </p>
                <p className="font-semibold text-blue-600 mt-1">{email}</p>
              </div>

              <div className="text-left">
                <Label htmlFor="otp">Enter 6-Digit OTP</Label>
                <Input
                  id="otp"
                  placeholder="123456"
                  value={otp}
                  onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  className="mt-1 text-center text-2xl font-bold tracking-widest"
                  maxLength={6}
                />
              </div>

              <Button
                onClick={handleVerify}
                disabled={isLoading}
                className="w-full bg-blue-600 hover:bg-blue-700 py-5"
              >
                {isLoading ? 'Verifying...' : 'Verify & Continue'}
                {!isLoading && <CheckCircle className="ml-2 h-4 w-4" />}
              </Button>

              <div className="space-y-2">
                <p className="text-sm text-gray-500">Didn't receive the code?</p>
                <button
                  onClick={handleResend}
                  className="text-blue-600 text-sm font-medium hover:underline"
                >
                  Resend OTP
                </button>
              </div>

              <button
                onClick={() => setStep('register')}
                className="text-gray-400 text-sm hover:text-gray-600"
              >
                Back to registration
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}