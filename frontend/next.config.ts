import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // No 'output: export' — Vercel and AWS Amplify Compute both support
  // Next.js SSR natively so static export is not needed.
  images: { unoptimized: true },
}

export default nextConfig
