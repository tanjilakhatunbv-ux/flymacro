import { NextResponse } from 'next/server'
import { getCurrentUser } from '../../../../lib/auth'
import { getPayload } from '../../../../lib/payload'

export async function GET() {
  const user = await getCurrentUser()
  if (!user) {
    return NextResponse.json({ user: null, unread: 0 })
  }

  try {
    const payload = await getPayload()
    const r = await payload.count({
      collection: 'notifications',
      where: {
        and: [{ recipient: { equals: user.id } }, { read: { equals: false } }],
      },
      overrideAccess: true,
    })
    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        credits: user.credits,
      },
      unread: r.totalDocs ?? 0,
    })
  } catch {
    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        credits: user.credits,
      },
      unread: 0,
    })
  }
}
