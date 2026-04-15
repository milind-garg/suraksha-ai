'use client'

import { configureAmplify } from '@/lib/amplify-config'

// Configure Amplify at module load time so it is ready before any React
// effects run. configureAmplify() is a no-op during SSR because it guards
// against typeof window === 'undefined' internally.
configureAmplify()

export function AmplifyProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
