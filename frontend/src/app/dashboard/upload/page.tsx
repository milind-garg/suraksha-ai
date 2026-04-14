'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useDropzone } from 'react-dropzone'
import { PageHeader } from '@/components/layout/page-header'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import { usePolicyStore } from '@/store/policy-store'
import { useAuthStore } from '@/store/auth-store'
import { useLanguage } from '@/hooks/use-language'
import { getUploadUrl, uploadFileToS3 } from '@/lib/api'
import {
  Upload, FileText, X, CheckCircle,
  AlertCircle, Shield, Brain, ArrowRight
} from 'lucide-react'
import { v4 as uuidv4 } from 'uuid'

type PolicyType = 'health' | 'life' | 'vehicle' | 'home' | 'travel' | 'other'
type UploadStep = 'select' | 'details' | 'uploading' | 'success'

const POLICY_TYPES: { value: PolicyType; label: string; labelHindi: string; icon: string }[] = [
  { value: 'health', label: 'Health Insurance', labelHindi: 'स्वास्थ्य बीमा', icon: '🏥' },
  { value: 'life', label: 'Life Insurance', labelHindi: 'जीवन बीमा', icon: '💚' },
  { value: 'vehicle', label: 'Vehicle Insurance', labelHindi: 'वाहन बीमा', icon: '🚗' },
  { value: 'home', label: 'Home Insurance', labelHindi: 'गृह बीमा', icon: '🏠' },
  { value: 'travel', label: 'Travel Insurance', labelHindi: 'यात्रा बीमा', icon: '✈️' },
  { value: 'other', label: 'Other', labelHindi: 'अन्य', icon: '📄' },
]

export default function UploadPage() {
  const router = useRouter()
  const { toast } = useToast()
  const { addPolicy } = usePolicyStore()
  const { user } = useAuthStore()
  const { isHindi } = useLanguage()

  const [step, setStep] = useState<UploadStep>('select')
  const [file, setFile] = useState<File | null>(null)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadedPolicyId, setUploadedPolicyId] = useState('')

  const [form, setForm] = useState({
    policyName: '',
    policyType: '' as PolicyType,
    insurerName: '',
    policyNumber: '',
    premiumAmount: '',
    sumInsured: '',
    startDate: '',
    endDate: '',
  })

  // ─── Dropzone ──────────────────────────────────────────
  const onDrop = useCallback((acceptedFiles: File[]) => {
    const f = acceptedFiles[0]
    if (!f) return

    if (f.size > 10 * 1024 * 1024) {
      toast({
        title: 'File too large',
        description: 'Maximum file size is 10MB',
        variant: 'destructive'
      })
      return
    }
    setFile(f)
    setStep('details')

    // Auto-fill policy name from filename
    const nameWithoutExt = f.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ')
    setForm(p => ({ ...p, policyName: nameWithoutExt }))
  }, [toast])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
    },
    maxFiles: 1,
  })

  // ─── Handle Upload ─────────────────────────────────────
  const handleUpload = async () => {
  if (!form.policyName || !form.policyType || !file) {
    toast({
      title: 'Missing Details',
      description: 'Please fill in policy name and type',
      variant: 'destructive'
    })
    return
  }

  // Validate date range
  if (form.startDate && form.endDate && form.endDate <= form.startDate) {
    toast({
      title: 'Invalid Dates',
      description: 'End date must be after start date',
      variant: 'destructive'
    })
    return
  }

  setStep('uploading')
  setUploadProgress(0)

  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL
    const isDemoMode = !apiUrl || apiUrl === 'PLACEHOLDER'

    if (!isDemoMode) {
      // ── REAL API FLOW ──────────────────────────────
      // Use the configured axios client (handles auth token automatically).
      setUploadProgress(10)

      const { uploadUrl, policyId: realPolicyId, s3Key } = await getUploadUrl({
        fileName: file.name,
        fileType: file.type,
        policyName: form.policyName,
        policyType: form.policyType,
      })
      setUploadProgress(30)

      // Upload directly to S3 via presigned URL (no auth header needed for S3)
      await uploadFileToS3(uploadUrl, file, (percent) => {
        setUploadProgress(30 + Math.round(percent * 0.7))
      })

      setUploadProgress(100)
      const newPolicy = {
        policyId: realPolicyId,
        userId: user?.userId || 'demo-user',
        policyName: form.policyName,
        policyType: form.policyType,
        insurerName: form.insurerName || '',
        policyNumber: form.policyNumber || '',
        premiumAmount: parseFloat(form.premiumAmount) || 0,
        sumInsured: parseFloat(form.sumInsured) || 0,
        startDate: form.startDate,
        endDate: form.endDate,
        status: 'uploaded' as const,
        s3Key,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
      addPolicy(newPolicy)
      setUploadedPolicyId(realPolicyId)

    } else {
      // ── DEMO FLOW ──────────────────────────────────
      const demoPolicyId = uuidv4()
      for (let i = 0; i <= 100; i += 10) {
        await new Promise(r => setTimeout(r, 150))
        setUploadProgress(i)
      }
      const newPolicy = {
        policyId: demoPolicyId,
        userId: user?.userId || 'demo-user',
        policyName: form.policyName,
        policyType: form.policyType,
        insurerName: form.insurerName || 'Demo Insurer',
        policyNumber: form.policyNumber || 'DEMO-001',
        premiumAmount: parseFloat(form.premiumAmount) || 0,
        sumInsured: parseFloat(form.sumInsured) || 0,
        startDate: form.startDate,
        endDate: form.endDate,
        status: 'uploaded' as const,
        s3Key: `demo/${demoPolicyId}/${file.name}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
      addPolicy(newPolicy)
      setUploadedPolicyId(demoPolicyId)
    }

    setStep('success')

  } catch (error: unknown) {
    toast({
      title: 'Upload Failed',
      description: error instanceof Error ? error.message : 'Something went wrong',
      variant: 'destructive'
    })
    setStep('details')
  }
}

  const resetUpload = () => {
    setFile(null)
    setStep('select')
    setUploadProgress(0)
    setForm({
      policyName: '', policyType: '' as PolicyType,
      insurerName: '', policyNumber: '',
      premiumAmount: '', sumInsured: '',
      startDate: '', endDate: ''
    })
  }

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Upload Policy"
        titleHindi="पॉलिसी अपलोड करें"
        description={isHindi ? 'AI विश्लेषण के लिए अपना बीमा दस्तावेज़ अपलोड करें' : 'Upload your insurance document for AI analysis'}
      />

      <div className="p-6 max-w-3xl mx-auto">

        {/* Progress Steps */}
        <div className="flex items-center gap-2 mb-8">
          {[
            { key: 'select', label: 'Select File', hindi: 'फ़ाइल चुनें' },
            { key: 'details', label: 'Add Details', hindi: 'विवरण भरें' },
            { key: 'uploading', label: 'Uploading', hindi: 'अपलोड हो रहा है' },
            { key: 'success', label: 'Done!', hindi: 'हो गया!' },
          ].map((s, i) => {
            const steps = ['select', 'details', 'uploading', 'success']
            const currentIndex = steps.indexOf(step)
            const stepIndex = steps.indexOf(s.key)
            const isDone = stepIndex < currentIndex
            const isCurrent = stepIndex === currentIndex

            return (
              <div key={s.key} className="flex items-center gap-2">
                <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                  isCurrent ? 'bg-blue-600 text-white' :
                  isDone ? 'bg-green-100 text-green-700' :
                  'bg-gray-100 text-gray-400'
                }`}>
                  {isDone ? <CheckCircle className="h-3 w-3" /> : <span>{i + 1}</span>}
                  <span className={isHindi ? 'hindi-text' : ''}>{isHindi ? s.hindi : s.label}</span>
                </div>
                {i < 3 && <div className="h-px w-4 bg-gray-200" />}
              </div>
            )
          })}
        </div>

        {/* ── STEP 1: File Drop Zone ── */}
        {step === 'select' && (
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all ${
              isDragActive
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'
            }`}
          >
            <input {...getInputProps()} />
            <div className="flex flex-col items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center">
                <Upload className="h-8 w-8 text-blue-600" />
              </div>
              <div>
                <h3 className={`text-lg font-semibold text-gray-800 ${isHindi ? 'hindi-text' : ''}`}>
                  {isDragActive
                    ? (isHindi ? 'यहाँ छोड़ें!' : 'Drop your file here!')
                    : (isHindi ? 'बीमा दस्तावेज़ अपलोड करें' : 'Upload Insurance Document')}
                </h3>
                <p className="text-gray-500 text-sm mt-2">
                  {isHindi ? 'खींचें और छोड़ें या क्लिक करें' : 'Drag & drop or click to select'}
                </p>
              </div>
              <div className="flex gap-2 mt-2">
                {['PDF', 'JPG', 'PNG'].map(fmt => (
                  <Badge key={fmt} variant="secondary">{fmt}</Badge>
                ))}
                <Badge variant="secondary">Max 10MB</Badge>
              </div>
              <Button className="bg-blue-600 hover:bg-blue-700 mt-2">
                {isHindi ? 'फ़ाइल चुनें' : 'Choose File'}
              </Button>
            </div>
          </div>
        )}

        {/* ── STEP 2: Policy Details Form ── */}
        {step === 'details' && file && (
          <div className="space-y-6">
            {/* File Preview */}
            <div className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-xl p-4">
              <FileText className="h-8 w-8 text-green-600" />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 truncate">{file.name}</p>
                <p className="text-sm text-gray-500">
                  {(file.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
              <button
                onClick={resetUpload}
                className="text-gray-400 hover:text-red-500 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Policy Type Selection */}
            <div>
              <Label className={`text-base font-semibold ${isHindi ? 'hindi-text' : ''}`}>
                {isHindi ? 'पॉलिसी प्रकार *' : 'Policy Type *'}
              </Label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-2">
                {POLICY_TYPES.map((type) => (
                  <button
                    key={type.value}
                    onClick={() => setForm(p => ({ ...p, policyType: type.value }))}
                    className={`p-3 rounded-xl border-2 text-left transition-all ${
                      form.policyType === type.value
                        ? 'border-blue-600 bg-blue-50'
                        : 'border-gray-200 hover:border-blue-300'
                    }`}
                  >
                    <div className="text-2xl mb-1">{type.icon}</div>
                    <div className={`text-sm font-medium text-gray-900 ${isHindi ? 'hindi-text' : ''}`}>
                      {isHindi ? type.labelHindi : type.label}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Form Fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <Label htmlFor="policyName" className={isHindi ? 'hindi-text' : ''}>
                  {isHindi ? 'पॉलिसी नाम *' : 'Policy Name *'}
                </Label>
                <Input
                  id="policyName"
                  placeholder="e.g. Star Health Family Floater"
                  value={form.policyName}
                  onChange={e => setForm(p => ({ ...p, policyName: e.target.value }))}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="insurerName" className={isHindi ? 'hindi-text' : ''}>
                  {isHindi ? 'बीमा कंपनी' : 'Insurance Company'}
                </Label>
                <Input
                  id="insurerName"
                  placeholder="e.g. Star Health, LIC, HDFC"
                  value={form.insurerName}
                  onChange={e => setForm(p => ({ ...p, insurerName: e.target.value }))}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="policyNumber" className={isHindi ? 'hindi-text' : ''}>
                  {isHindi ? 'पॉलिसी नंबर' : 'Policy Number'}
                </Label>
                <Input
                  id="policyNumber"
                  placeholder="e.g. P/191113/01/2024/000123"
                  value={form.policyNumber}
                  onChange={e => setForm(p => ({ ...p, policyNumber: e.target.value }))}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="premiumAmount" className={isHindi ? 'hindi-text' : ''}>
                  {isHindi ? 'सालाना प्रीमियम (₹)' : 'Annual Premium (₹)'}
                </Label>
                <Input
                  id="premiumAmount"
                  type="number"
                  placeholder="e.g. 15000"
                  value={form.premiumAmount}
                  onChange={e => setForm(p => ({ ...p, premiumAmount: e.target.value }))}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="sumInsured" className={isHindi ? 'hindi-text' : ''}>
                  {isHindi ? 'बीमा राशि (₹)' : 'Sum Insured (₹)'}
                </Label>
                <Input
                  id="sumInsured"
                  type="number"
                  placeholder="e.g. 500000"
                  value={form.sumInsured}
                  onChange={e => setForm(p => ({ ...p, sumInsured: e.target.value }))}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="startDate" className={isHindi ? 'hindi-text' : ''}>
                  {isHindi ? 'शुरुआत तारीख' : 'Start Date'}
                </Label>
                <Input
                  id="startDate"
                  type="date"
                  value={form.startDate}
                  onChange={e => setForm(p => ({ ...p, startDate: e.target.value }))}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="endDate" className={isHindi ? 'hindi-text' : ''}>
                  {isHindi ? 'समाप्ति तारीख' : 'End Date'}
                </Label>
                <Input
                  id="endDate"
                  type="date"
                  value={form.endDate}
                  onChange={e => setForm(p => ({ ...p, endDate: e.target.value }))}
                  className="mt-1"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <Button
                variant="outline"
                onClick={resetUpload}
                className="flex-1"
              >
                {isHindi ? 'वापस' : 'Back'}
              </Button>
              <Button
                onClick={handleUpload}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
              >
                {isHindi ? 'अपलोड और विश्लेषण करें' : 'Upload & Analyze'}
                <Brain className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* ── STEP 3: Uploading Progress ── */}
        {step === 'uploading' && (
          <div className="text-center space-y-6 py-8">
            <div className="w-20 h-20 rounded-full bg-blue-100 flex items-center justify-center mx-auto animate-pulse">
              <Upload className="h-10 w-10 text-blue-600" />
            </div>
            <div>
              <h3 className={`text-xl font-semibold text-gray-900 ${isHindi ? 'hindi-text' : ''}`}>
                {isHindi ? 'आपकी पॉलिसी अपलोड हो रही है...' : 'Uploading your policy...'}
              </h3>
            </div>
            <div className="max-w-sm mx-auto space-y-2">
              <Progress value={uploadProgress} className="h-3" />
              <p className="text-sm text-gray-500">
                {isHindi ? `${uploadProgress}% पूर्ण` : `${uploadProgress}% complete`}
              </p>
            </div>
            <div className="bg-blue-50 rounded-xl p-4 max-w-sm mx-auto text-left space-y-2">
              {[
                {
                  done: uploadProgress >= 30,
                  text: 'Connecting to upload service',
                  hindi: 'अपलोड सेवा से जुड़ रहे हैं'
                },
                {
                  done: uploadProgress >= 60,
                  text: 'Uploading document to secure storage',
                  hindi: 'दस्तावेज़ सुरक्षित स्टोरेज में अपलोड हो रहा है'
                },
                {
                  done: uploadProgress >= 90,
                  text: 'Finalising upload',
                  hindi: 'अपलोड अंतिम हो रहा है'
                },
                {
                  done: uploadProgress >= 100,
                  text: 'Upload complete! Ready for AI analysis.',
                  hindi: 'अपलोड पूर्ण! AI विश्लेषण के लिए तैयार।'
                },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-2 text-sm">
                  {item.done
                    ? <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                    : <div className="h-4 w-4 rounded-full border-2 border-gray-300 flex-shrink-0" />
                  }
                  <span className={`${item.done ? 'text-gray-700' : 'text-gray-400'} ${isHindi ? 'hindi-text' : ''}`}>
                    {isHindi ? item.hindi : item.text}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── STEP 4: Success ── */}
        {step === 'success' && (
          <div className="text-center space-y-6 py-8">
            <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto">
              <CheckCircle className="h-10 w-10 text-green-600" />
            </div>
            <div>
              <h3 className={`text-2xl font-bold text-gray-900 ${isHindi ? 'hindi-text' : ''}`}>
                {isHindi ? 'अपलोड सफल रहा!' : 'Upload Successful!'}
              </h3>
              <p className="text-gray-500 mt-2">
                {isHindi
                  ? 'आपकी पॉलिसी अपलोड हो गई है और AI विश्लेषण के लिए तैयार है'
                  : 'Your policy has been uploaded and is ready for AI analysis'}
              </p>
            </div>

            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 max-w-sm mx-auto text-left">
              <div className="flex items-center gap-2 mb-3">
                <Shield className="h-5 w-5 text-blue-600" />
                <span className="font-semibold text-gray-900">{form.policyName}</span>
              </div>
              <div className="space-y-1 text-sm text-gray-600">
                <p>
                  {isHindi ? 'प्रकार: ' : 'Type: '}
                  {isHindi
                    ? POLICY_TYPES.find(t => t.value === form.policyType)?.labelHindi
                    : POLICY_TYPES.find(t => t.value === form.policyType)?.label}
                </p>
                {form.insurerName && (
                  <p>{isHindi ? 'बीमाकर्ता: ' : 'Insurer: '}{form.insurerName}</p>
                )}
                {form.sumInsured && (
                  <p>{isHindi ? 'बीमा राशि: ' : 'Sum Insured: '}₹{parseInt(form.sumInsured).toLocaleString('en-IN')}</p>
                )}
              </div>
            </div>

            <div className="flex gap-3 max-w-sm mx-auto">
              <Button
                variant="outline"
                onClick={resetUpload}
                className="flex-1"
              >
                {isHindi ? 'और अपलोड करें' : 'Upload Another'}
              </Button>
              <Button
                onClick={() => router.push('/dashboard/policies')}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
              >
                {isHindi ? 'पॉलिसी देखें' : 'View Policies'}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}