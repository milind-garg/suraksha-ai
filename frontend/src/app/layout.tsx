'use client'

import { useEffect } from 'react'
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
      <body className={inter.className}>
        {children}
        <Toaster />
      </body>
    </html>
  )
}