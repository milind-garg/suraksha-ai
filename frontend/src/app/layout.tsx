'use client'

import { Inter } from 'next/font/google'
import './globals.css'
import { Toaster } from '@/components/ui/toaster'
import { configureAmplify } from '@/lib/amplify-config'

const inter = Inter({ subsets: ['latin'] })

configureAmplify()

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <title>Suraksha AI - Insurance Intelligence Platform</title>
        <meta name="description" content="AI-powered insurance policy analyzer for Indian families" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body className={inter.className}>
        {children}
        <Toaster />
      </body>
    </html>
  )
}