import { withPayload } from '@payloadcms/next/withPayload'
import createNextIntlPlugin from 'next-intl/plugin'

const withNextIntl = createNextIntlPlugin()
const devScriptSrc = process.env.NODE_ENV !== 'production' ? " 'unsafe-eval'" : ''

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
      allowedOrigins: ['flymacro.qzz.io', 'localhost:3000'],
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
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              `script-src 'self' 'unsafe-inline'${devScriptSrc} https://static.cloudflareinsights.com https://challenges.cloudflare.com`,
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: blob: https://media.flymacro.qzz.io https://flymacro.qzz.io",
              "font-src 'self'",
              "connect-src 'self' https://media.flymacro.qzz.io https://challenges.cloudflare.com",
              "frame-src https://challenges.cloudflare.com",
              "object-src 'none'",
              "base-uri 'self'",
            ].join('; '),
          },
        ],
      },
      {
        source: '/admin/:path*',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://static.cloudflareinsights.com https://challenges.cloudflare.com",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: blob: https://media.flymacro.qzz.io https://flymacro.qzz.io",
              "font-src 'self'",
              "connect-src 'self' https://media.flymacro.qzz.io https://challenges.cloudflare.com",
              "frame-src https://challenges.cloudflare.com",
              "object-src 'none'",
              "base-uri 'self'",
            ].join('; '),
          },
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
