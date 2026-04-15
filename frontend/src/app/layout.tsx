import './globals.css'
import { Toaster } from '@/components/ui/toaster'
import { AmplifyProvider } from '@/components/AmplifyProvider'

export const metadata = {
  title: 'Suraksha AI - Insurance Intelligence Platform',
  description: 'AI-powered insurance policy analyzer for Indian families',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <AmplifyProvider>
          {children}
        </AmplifyProvider>
        <Toaster />
      </body>
    </html>
  )
}