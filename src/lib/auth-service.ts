import crypto from 'crypto'
import { sql } from '@payloadcms/db-postgres'
import { getPayload } from './payload'
import { signJwt } from './jwt'
import type { AuditLog, User } from '../payload-types'

type Payload = Awaited<ReturnType<typeof getPayload>>

function verifyPasswordHash(password: string, hash: string, salt: string): Promise<boolean> {
  return new Promise((resolve) => {
    crypto.pbkdf2(password, salt, 25000, 512, 'sha256', (err, hashBuffer) => {
      if (err) {
        resolve(false)
        return
      }
      const storedHashBuffer = Buffer.from(hash, 'hex')
      resolve(hashBuffer.length === storedHashBuffer.length && crypto.timingSafeEqual(hashBuffer, storedHashBuffer))
    })
  })
}

export async function findUserByEmail(email: string, payload?: Payload): Promise<User | null> {
  const payloadClient = payload ?? await getPayload()
  const result = await payloadClient.find({
    collection: 'users',
    where: { email: { equals: email.toLowerCase().trim() } },
    limit: 1,
    depth: 0,
    overrideAccess: true,
  })

  return (result.docs[0] as User | undefined) ?? null
}

export async function verifyPasswordForUser(
  user: User,
  password: string,
  payload?: Payload,
): Promise<{ valid: boolean; token: string | null }> {
  const payloadClient = payload ?? await getPayload()

  try {
    const result = await payloadClient.login({
      collection: 'users',
      data: { email: user.email, password },
      depth: 0,
    })
    if (result?.token) return { valid: true, token: result.token }
  } catch {
    // Payload rejects unverified users even when the password is correct.
  }

  try {
    const hashResult = await payloadClient.db.drizzle.execute(
      sql`SELECT hash, salt FROM users WHERE id = ${user.id}`,
    )
    const rows = hashResult.rows as Array<{ hash: string; salt: string }> | undefined
    const row = rows?.[0]
    if (row?.hash && row?.salt && await verifyPasswordHash(password, row.hash, row.salt)) {
      return { valid: true, token: null }
    }
  } catch {
    return { valid: false, token: null }
  }

  return { valid: false, token: null }
}

export async function signAuthToken(user: Pick<User, 'id' | 'email'>, payload?: { secret?: string }): Promise<string> {
  const payloadClient = payload ?? await getPayload()
  const payloadSecret = payloadClient.secret ?? ''
  return signJwt(
    { id: user.id, email: user.email, collection: 'users' },
    payloadSecret,
    { expiresInSeconds: 60 * 60 * 24 * 7 },
  )
}

export async function updateLoginMetadata(user: User, payload?: Payload): Promise<void> {
  const payloadClient = payload ?? await getPayload()

  try {
    await payloadClient.update({
      collection: 'users',
      id: user.id,
      data: {
        lastLoginAt: new Date().toISOString(),
        loginCount: ((user.loginCount ?? 0) as number) + 1,
      } as never,
      overrideAccess: true,
    })
  } catch {
    /* metadata update failures must not block login */
  }
}

export async function writeUserAuditLog(
  action: AuditLog['action'],
  user: Pick<User, 'id'>,
  ip: string,
  reason: string,
  payload?: Payload,
  metadata?: Record<string, unknown>,
): Promise<void> {
  const payloadClient = payload ?? await getPayload()

  try {
    await payloadClient.create({
      collection: 'audit-logs',
      data: {
        action,
        collection: 'users',
        docId: String(user.id),
        operator: user.id,
        ip,
        reason,
        ...(metadata ? { metadata } : {}),
      },
      overrideAccess: true,
    })
  } catch {
    /* audit log failures must not block auth flows */
  }
}

export async function createPasswordUser(
  data: { email: string; password: string; name?: string },
  payload?: Payload,
): Promise<User> {
  const payloadClient = payload ?? await getPayload()
  return await payloadClient.create({
    collection: 'users',
    data: {
      email: data.email,
      password: data.password,
      name: data.name || undefined,
      role: 'user',
      _verified: false,
    } as never,
    overrideAccess: true,
  }) as User
}

export async function sendPasswordResetEmail(email: string, payload?: Payload): Promise<void> {
  const payloadClient = payload ?? await getPayload()

  await payloadClient.forgotPassword({
    collection: 'users',
    data: { email: email.toLowerCase().trim() },
  })
}

export async function resetPasswordWithReuseCheck(
  data: { token: string; password: string; ip: string },
  payload?: Payload,
): Promise<'ok' | 'invalid_token' | 'password_reuse'> {
  const payloadClient = payload ?? await getPayload()
  const now = new Date().toISOString()
  const users = await payloadClient.find({
    collection: 'users',
    where: {
      resetPasswordToken: { equals: data.token },
      resetPasswordExpiration: { greater_than: now },
    },
    limit: 1,
    depth: 0,
    overrideAccess: true,
  })

  const user = users.docs[0] as User | undefined
  if (!user) return 'invalid_token'

  if (user.hash && user.salt && await verifyPasswordHash(data.password, user.hash, user.salt)) {
    return 'password_reuse'
  }

  try {
    await payloadClient.resetPassword({
      collection: 'users',
      data: { token: data.token, password: data.password },
      overrideAccess: true,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : ''
    if (message.includes('invalid') || message.includes('expired') || message.includes('Token')) {
      return 'invalid_token'
    }
    throw err
  }

  await writeUserAuditLog(
    'reset_password',
    user,
    data.ip,
    '\u7528\u6237\u81ea\u52a9\u91cd\u7f6e\u5bc6\u7801',
    payloadClient,
  )

  return 'ok'
}

export async function sendVerificationEmail(user: User, ip: string, payload?: Payload): Promise<void> {
  const payloadClient = payload ?? await getPayload()
  const token = crypto.randomBytes(32).toString('hex')

  await payloadClient.update({
    collection: 'users',
    id: user.id,
    data: {
      _verificationToken: token,
    } as never,
    overrideAccess: true,
  })

  const verifyUrl = `${process.env.NEXT_PUBLIC_SERVER_URL}/verify-email?token=${token}`

  await payloadClient.sendEmail({
    from: process.env.RESEND_FROM_EMAIL || 'noreply@flymacro.qzz.io',
    to: user.email,
    subject: '\u9a8c\u8bc1\u4f60\u7684\u90ae\u7bb1\u5730\u5740',
    html: `<p>\u4f60\u597d ${user.email ?? ''}\uff0c</p>
<p>\u8bf7\u70b9\u51fb\u4e0b\u65b9\u94fe\u63a5\u9a8c\u8bc1\u4f60\u7684\u90ae\u7bb1\uff1a</p>
<p><a href="${verifyUrl}">${verifyUrl}</a></p>
<p>\u8be5\u94fe\u63a5 24 \u5c0f\u65f6\u5185\u6709\u6548\u3002</p>`,
  })

  await writeUserAuditLog(
    'resend_verification',
    user,
    ip,
    '\u7528\u6237\u8bf7\u6c42\u91cd\u53d1\u9a8c\u8bc1\u90ae\u4ef6',
    payloadClient,
  )
}
