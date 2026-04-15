import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // Static export so AWS Amplify static hosting (WEB mode) can serve
  // the pre-rendered HTML files directly from the `out/` directory.
  output: 'export',
  // Required for static export — asset URLs use relative paths so they
  // work regardless of the CDN sub-path Amplify assigns.
  images: { unoptimized: true },
}

export default nextConfig
