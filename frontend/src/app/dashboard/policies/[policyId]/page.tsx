import PolicyDetailClient from './PolicyDetailClient'

// `output: 'export'` requires at least one entry from generateStaticParams.
// Policy IDs are only known at runtime (after login), so we provide a
// placeholder that will never match a real policy — the client component
// handles the "not found" case by redirecting to /dashboard/policies.
export function generateStaticParams() {
  return [{ policyId: '__placeholder__' }]
}

export default function PolicyDetailPage() {
  return <PolicyDetailClient />
}
