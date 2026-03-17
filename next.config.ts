import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '*.supabase.co' },
      { protocol: 'https', hostname: 'www.google.com' },
    ],
  },
  // Allow canvas/Phaser in edge environments
  serverExternalPackages: ['livekit-server-sdk'],
}

export default nextConfig
