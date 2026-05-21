import { NextResponse } from 'next/server'
import { getCurrentUser } from '../../../../lib/auth'
import { getPayload } from '../../../../lib/payload'
import { success } from '../../../../lib/api-response'
import { sql } from '@payloadcms/db-postgres'

export async function GET() {
  const user = await getCurrentUser()
  if (!user) {
    return NextResponse.json(success({ user: null, unread: 0 }))
  }

  const userData = {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    credits: user.credits,
    status: user.status,
    _verified: user._verified,
  }

  try {
    // Use a lightweight raw SQL count instead of Payload's full count API
    const payload = await getPayload()
    const result = await payload.db.drizzle.execute(
      sql`SELECT COUNT(*)::int as cnt FROM notifications WHERE recipient_id = ${user.id} AND read = false`
    )
    const rows = result.rows as Array<{ cnt: number }> | undefined
    const unread = rows?.[0]?.cnt ?? 0
    return NextResponse.json(success({ user: userData, unread }))
  } catch {
    return NextResponse.json(success({ user: userData, unread: 0 }))
  }
}
