import { Shield } from 'lucide-react'

export default function Loading() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4">
      <Shield className="h-12 w-12 text-blue-600 animate-pulse" />
      <div className="flex gap-1">
        {[0, 1, 2].map(i => (
          <div
            key={i}
            className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"
            style={{ animationDelay: `${i * 0.15}s` }}
          />
        ))}
      </div>
      <p className="text-gray-500 text-sm">Loading Suraksha AI...</p>
      <p className="text-blue-500 hindi-text text-xs">सुरक्षा AI लोड हो रहा है...</p>
    </div>
  )
}