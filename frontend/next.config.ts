import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  output: 'export',      // emit static files into out/ for Amplify Hosting
  trailingSlash: true,   // /dashboard/ -> out/dashboard/index.html
  images: { unoptimized: true },
}

export default nextConfig