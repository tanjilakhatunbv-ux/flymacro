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
