'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Shield, Eye, EyeOff, ArrowRight, CheckCircle, Mail } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { forgotPassword, confirmForgotPassword } from '@/lib/auth'

type Step = 'request' | 'reset'

export default function ForgotPasswordPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [step, setStep] = useState<Step>('request')
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  // ─── Step 1: Request reset code ─────────────────────────
  const handleRequestCode = async () => {
    if (!email) {
      toast({ title: 'Error', description: 'Please enter your email address', variant: 'destructive' })
      return
    }

    setIsLoading(true)
    try {
      await forgotPassword(email)
      setStep('reset')
      toast({
        title: 'Code Sent!',
        description: `A reset code has been sent to ${email}`
      })
    } catch (error: unknown) {
      let message = 'Failed to send reset code. Please try again.'
      if (error instanceof Error) {
        const name = (error as any).name as string | undefined
        if (name === 'UserNotFoundException') {
          message = 'No account found with this email address'
        } else if (name === 'LimitExceededException') {
          message = 'Too many attempts. Please try again later.'
        } else if (error.message) {
          message = error.message
        }
      }
      toast({ title: 'Error', description: message, variant: 'destructive' })
    } finally {
      setIsLoading(false)
    }
  }

  // ─── Step 2: Confirm reset ──────────────────────────────
  const handleResetPassword = async () => {
    if (!code || code.length !== 6) {
      toast({ title: 'Error', description: 'Enter the 6-digit code', variant: 'destructive' })
      return
    }
    if (!newPassword) {
      toast({ title: 'Error', description: 'Please enter a new password', variant: 'destructive' })
      return
    }
    if (newPassword.length < 8) {
      toast({ title: 'Error', description: 'Password must be at least 8 characters', variant: 'destructive' })
      return
    }
    if (newPassword !== confirmPassword) {
      toast({ title: 'Error', description: 'Passwords do not match', variant: 'destructive' })
      return
    }

    setIsLoading(true)
    try {
      await confirmForgotPassword(email, code, newPassword)
      toast({
        title: 'Password Reset!',
        description: 'Your password has been updated. Please login with your new password.'
      })
      router.push('/login')
    } catch (error: unknown) {
      let message = 'Failed to reset password. Please try again.'
      if (error instanceof Error) {
        const name = (error as any).name as string | undefined
        if (name === 'CodeMismatchException') {
          message = 'Invalid reset code. Please check and try again.'
        } else if (name === 'ExpiredCodeException') {
          message = 'Reset code has expired. Please request a new one.'
        } else if (name === 'InvalidPasswordException') {
          message = error.message
        } else if (error.message) {
          message = error.message
        }
      }
      toast({ title: 'Error', description: message, variant: 'destructive' })
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      if (step === 'request') handleRequestCode()
      else handleResetPassword()
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
            {step === 'request' ? 'Forgot Password' : 'Reset Password'}
          </h2>
          <p className="text-blue-600 text-sm hindi-text">
            {step === 'request' ? 'पासवर्ड भूल गए' : 'नया पासवर्ड सेट करें'}
          </p>
        </div>

        <div className="p-8">

          {/* ── STEP 1: Request reset code ── */}
          {step === 'request' && (
            <div className="space-y-5">
              <div className="bg-blue-50 rounded-xl p-4 text-sm text-gray-600 flex gap-3">
                <Mail className="h-5 w-5 text-blue-500 shrink-0 mt-0.5" />
                <p>Enter your registered email address and we'll send you a code to reset your password.</p>
              </div>

              <div>
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="rahul@example.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="mt-1"
                />
              </div>

              <Button
                onClick={handleRequestCode}
                disabled={isLoading}
                className="w-full bg-blue-600 hover:bg-blue-700 py-5"
              >
                {isLoading ? 'Sending Code...' : 'Send Reset Code'}
                {!isLoading && <ArrowRight className="ml-2 h-4 w-4" />}
              </Button>

              <p className="text-center text-sm text-gray-600">
                Remember your password?{' '}
                <button
                  onClick={() => router.push('/login')}
                  className="text-blue-600 font-medium hover:underline"
                >
                  Back to login
                </button>
              </p>
            </div>
          )}

          {/* ── STEP 2: Enter code + new password ── */}
          {step === 'reset' && (
            <div className="space-y-5">
              <div className="bg-blue-50 rounded-xl p-4 text-sm text-center">
                <p className="text-gray-700">We sent a 6-digit code to</p>
                <p className="font-semibold text-blue-600 mt-1">{email}</p>
              </div>

              <div>
                <Label htmlFor="code">Reset Code</Label>
                <Input
                  id="code"
                  placeholder="123456"
                  value={code}
                  onChange={e => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  onKeyDown={handleKeyDown}
                  className="mt-1 text-center text-2xl font-bold tracking-widest"
                  maxLength={6}
                />
              </div>

              <div>
                <Label htmlFor="newPassword">New Password</Label>
                <div className="relative mt-1">
                  <Input
                    id="newPassword"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Min 8 characters"
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    onKeyDown={handleKeyDown}
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
                <Label htmlFor="confirmPassword">Confirm New Password</Label>
                <div className="relative mt-1">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="Repeat your new password"
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    onKeyDown={handleKeyDown}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* Password requirements */}
              <div className="bg-blue-50 rounded-lg p-3 text-xs text-gray-600 space-y-1">
                {[
                  { ok: newPassword.length >= 8, text: 'At least 8 characters' },
                  { ok: /[A-Z]/.test(newPassword), text: 'One uppercase letter' },
                  { ok: /[a-z]/.test(newPassword), text: 'One lowercase letter' },
                  { ok: /[0-9]/.test(newPassword), text: 'One number' },
                ].map((req, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <CheckCircle className={`h-3 w-3 ${req.ok ? 'text-green-500' : 'text-gray-300'}`} />
                    <span className={req.ok ? 'text-green-700' : ''}>{req.text}</span>
                  </div>
                ))}
              </div>

              <Button
                onClick={handleResetPassword}
                disabled={isLoading}
                className="w-full bg-blue-600 hover:bg-blue-700 py-5"
              >
                {isLoading ? 'Resetting Password...' : 'Reset Password'}
                {!isLoading && <CheckCircle className="ml-2 h-4 w-4" />}
              </Button>

              <div className="flex flex-col items-center gap-2">
                <p className="text-sm text-gray-500">Didn't receive the code?</p>
                <button
                  onClick={async () => {
                    try {
                      await forgotPassword(email)
                      toast({ title: 'Code Resent', description: 'Check your email again' })
                    } catch {
                      toast({ title: 'Error', description: 'Failed to resend code', variant: 'destructive' })
                    }
                  }}
                  className="text-blue-600 text-sm font-medium hover:underline"
                >
                  Resend Code
                </button>
              </div>

              <button
                onClick={() => setStep('request')}
                className="w-full text-gray-400 text-sm hover:text-gray-600"
              >
                ← Back
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}
