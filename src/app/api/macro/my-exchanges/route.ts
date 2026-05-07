import { NextResponse } from 'next/server'
import { getCurrentUser } from '../../../../lib/auth'
import { getPayload } from '../../../../lib/payload'
import { unauthorized, success } from '../../../../lib/api-response'
import type { MacroExchange } from '../../../../payload-types'

export async function GET() {
  const user = await getCurrentUser()
  if (!user) {
    return unauthorized('unauthenticated')
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
    })

    const exchangedIds = result.docs.map((e) => {
      const doc = e as MacroExchange
      return typeof doc.macro === 'object' ? doc.macro?.id : doc.macro
    })

    return NextResponse.json(success({ exchangedIds }))
  } catch {
    return NextResponse.json(success({ exchangedIds: [] }))
  }
}
