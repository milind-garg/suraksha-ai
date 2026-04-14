import { Inter } from 'next/font/google'
import './globals.css'
import { Toaster } from '@/components/ui/toaster'
import { AmplifyProvider } from '@/components/AmplifyProvider'

const inter = Inter({ subsets: ['latin'] })

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
      <body className={inter.className}>
        <AmplifyProvider>
          {children}
        </AmplifyProvider>
        <Toaster />
      </body>
    </html>
  )
}