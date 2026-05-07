import { z } from 'zod'

function optionalString() {
  return z
    .string()
    .optional()
    .transform((v) => (v?.trim() ? v.trim() : undefined))
}

function optionalUrl() {
  return z
    .string()
    .optional()
    .transform((v) => {
      if (!v?.trim()) return undefined
      // Allow relative URLs (e.g. /images/wechat-qr.png)
      if (v.startsWith('/')) return v
      try {
        new URL(v)
        return v
      } catch {
        return undefined
      }
    })
}

const envSchema = z.object({
  DATABASE_URI: z.string().min(1),
  PAYLOAD_SECRET: z.string().min(1),
  NEXT_PUBLIC_SERVER_URL: z.string().url(),

  // Payment
  DODO_API_KEY: z.string().min(1),
  DODO_WEBHOOK_SECRET: optionalString(),
  DODO_MODE: z.enum(['test_mode', 'live']).default('test_mode'),

  // Email
  RESEND_API_KEY: optionalString(),
  RESEND_FROM_EMAIL: optionalString(),

  // OAuth
  GOOGLE_CLIENT_ID: optionalString(),
  GOOGLE_CLIENT_SECRET: optionalString(),
  GITHUB_CLIENT_ID: optionalString(),
  GITHUB_CLIENT_SECRET: optionalString(),

  // Storage
  S3_BUCKET: optionalString(),
  S3_REGION: optionalString(),
  S3_ENDPOINT: optionalString(),
  S3_ACCESS_KEY_ID: optionalString(),
  S3_SECRET_ACCESS_KEY: optionalString(),

  // Security
  CRON_SECRET: optionalString(),
  TURNSTILE_SECRET_KEY: optionalString(),
  NEXT_PUBLIC_TURNSTILE_SITE_KEY: optionalString(),

  // Optional
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  NEXT_PUBLIC_TELEGRAM_URL: optionalUrl(),
  NEXT_PUBLIC_WECHAT_QR_URL: optionalUrl(),
})

function validateEnv() {
  const parsed = envSchema.safeParse(process.env)

  if (!parsed.success) {
    const errors = parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`)
    console.error('❌ Invalid environment variables:\n  ' + errors.join('\n  '))
    throw new Error(`Environment validation failed: ${errors.length} error(s)`)
  }

  return parsed.data
}

export const env = validateEnv()
export type Env = z.infer<typeof envSchema>
