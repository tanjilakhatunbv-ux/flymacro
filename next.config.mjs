import { withPayload } from '@payloadcms/next/withPayload'
import createNextIntlPlugin from 'next-intl/plugin'

const withNextIntl = createNextIntlPlugin()

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'flymacro.qzz.io',
      },
      {
        protocol: 'https',
        hostname: '*.vercel.app',
      },
      ...(process.env.S3_PUBLIC_URL
        ? [(() => {
            try {
              const url = new URL(process.env.S3_PUBLIC_URL)
              return { protocol: url.protocol.slice(0, -1), hostname: url.hostname }
            } catch { return null }
          })()].filter(Boolean)
        : []),
    ],
  },
  experimental: {
    reactCompiler: false,
    serverActions: {
      allowedOrigins: ['flymacro.qzz.io'],
    },
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'X-DNS-Prefetch-Control', value: 'on' },
        ],
      },
      {
        source: '/_next/static/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
      {
        source: '/images/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=86400' },
        ],
      },
    ]
  },
}

export default withPayload(withNextIntl(nextConfig))
