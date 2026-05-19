import path from 'path'
import { fileURLToPath } from 'url'
import { buildConfig } from 'payload'
import { postgresAdapter } from '@payloadcms/db-postgres'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { resendAdapter } from '@payloadcms/email-resend'
import { s3Storage } from '@payloadcms/storage-s3'
import { zh } from '@payloadcms/translations/languages/zh'
import sharp from 'sharp'

import { Users } from './collections/Users'
import { Media } from './collections/Media'
import { Classes } from './collections/Classes'
import { Specs } from './collections/Specs'
import { Versions } from './collections/Versions'
import { Macros } from './collections/Macros'
import { Guides } from './collections/Guides'
import { Articles } from './collections/Articles'
import { Pages } from './collections/Pages'
import { CreditPackages } from './collections/CreditPackages'
import { CreditOrders } from './collections/CreditOrders'
import { MacroExchanges } from './collections/MacroExchanges'
import { CreditTransactions } from './collections/CreditTransactions'
import { Tickets } from './collections/Tickets'
import { TicketMessages } from './collections/TicketMessages'
import { Notifications } from './collections/Notifications'
import { PluginFiles } from './collections/PluginFiles'
import { PluginReleases } from './collections/PluginReleases'
import { AuditLogs } from './collections/AuditLogs'
import { News } from './collections/News'
import { SiteSettings } from './globals/SiteSettings'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

const useResend = !!process.env.RESEND_API_KEY
const useS3 = !!process.env.S3_BUCKET && !!process.env.S3_ACCESS_KEY_ID

// Resolve the actual public URL — critical for cookie, CORS and CSRF to work
const serverUrl =
  process.env.NEXT_PUBLIC_SERVER_URL ||
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000')

// Collect all possible origins for CORS/CSRF
const allOrigins = [
  serverUrl,
  'http://localhost:3000',
  'https://flymacro.qzz.io',
  process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : '',
].filter(Boolean) as string[]

// Deduplicate
const uniqueOrigins = [...new Set(allOrigins)]

export default buildConfig({
  admin: {
    user: Users.slug,
    importMap: {
      baseDir: path.resolve(dirname),
    },
    meta: {
      titleSuffix: ' — FlyMacro 后台',
      description: '魔兽世界宏库管理后台',
      icons: [],
    },
    dateFormat: 'yyyy-MM-dd HH:mm',
    timezones: {
      defaultTimezone: 'Asia/Shanghai',
    },
  },
  i18n: {
    supportedLanguages: { zh },
    fallbackLanguage: 'zh',
  },
  collections: [
    Users,
    Media,
    Classes,
    Specs,
    Versions,
    Macros,
    Guides,
    Articles,
    Pages,
    CreditPackages,
    CreditOrders,
    MacroExchanges,
    CreditTransactions,
    Tickets,
    TicketMessages,
    Notifications,
    PluginFiles,
    PluginReleases,
    AuditLogs,
    News,
  ],
  globals: [SiteSettings],
  editor: lexicalEditor({}),
  secret: process.env.PAYLOAD_SECRET || 'CHANGE_ME_IN_ENV',
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  db: postgresAdapter({
    pool: {
      connectionString: process.env.DATABASE_URI || '',
      // Neon free tier allows ~10 concurrent connections.
      // Vercel serverless can spawn many concurrent functions,
      // so keep this low to avoid "too many connections" errors.
      max: 5,
      idleTimeoutMillis: 10000,
      connectionTimeoutMillis: 3000,
      // Allow queueing a few requests before failing
      allowExitOnIdle: false,
    },
    push: false,
  }),
  serverURL: serverUrl,
  bodyParser: {
    limits: {
      fileSize: 50 * 1024 * 1024, // 50 MB
    },
  },
  sharp,
  ...(useResend && {
    email: resendAdapter({
      defaultFromAddress: process.env.RESEND_FROM_EMAIL || 'noreply@flymacro.qzz.io',
      defaultFromName: process.env.RESEND_FROM_NAME || 'FlyMacro',
      apiKey: process.env.RESEND_API_KEY || '',
    }),
  }),
  plugins: [
    ...(useS3
      ? [
          s3Storage({
            collections: {
              media: {
                prefix: 'media',
                disablePayloadAccessControl: true,
                generateFileURL: ({ filename, prefix }) => {
                  const publicUrl = process.env.S3_PUBLIC_URL || ''
                  const path = prefix ? `${prefix}/${filename}` : filename
                  return `${publicUrl}/${path}`
                },
              },
              'plugin-files': {
                prefix: 'plugin-files',
                disablePayloadAccessControl: true,
                generateFileURL: ({ filename, prefix }) => {
                  const publicUrl = process.env.S3_PUBLIC_URL || ''
                  const path = prefix ? `${prefix}/${filename}` : filename
                  return `${publicUrl}/${path}`
                },
              },
            },
            bucket: process.env.S3_BUCKET || '',
            config: {
              endpoint: process.env.S3_ENDPOINT,
              region: process.env.S3_REGION || 'auto',
              credentials: {
                accessKeyId: process.env.S3_ACCESS_KEY_ID || '',
                secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || '',
              },
              forcePathStyle: true,
            },
          }),
        ]
      : []),
  ],
  cors: uniqueOrigins,
  csrf: uniqueOrigins,
})
