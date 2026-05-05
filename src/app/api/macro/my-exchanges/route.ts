import { NextResponse } from 'next/server'
import { getCurrentUser } from '../../../../lib/auth'
import { getPayload } from '../../../../lib/payload'

export async function GET() {
  const user = await getCurrentUser()
  if (!user) {
    return NextResponse.json({ exchangedIds: [] })
  }

  try {
    const payload = await getPayload()
    const result = await payload.find({
      collection: 'macro-exchanges',
      where: {
        and: [
          { user: { equals: user.id } },
          {
            or: [
              { expiresAt: { exists: false } },
              { expiresAt: { greater_than_equal: new Date().toISOString() } },
            ],
          },
        ],
      },
      limit: 200,
      depth: 0,
      overrideAccess: true,
    })

    const exchangedIds = result.docs.map((e: any) =>
      typeof e.macro === 'object' ? e.macro.id : e.macro
    )

    return NextResponse.json({ exchangedIds })
  } catch {
    return NextResponse.json({ exchangedIds: [] })
  }
}
