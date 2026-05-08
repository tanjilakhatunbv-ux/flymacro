import { NextResponse } from 'next/server'
import { getCurrentUser, isStaffRole } from '../../../../lib/auth'
import { getPayload } from '../../../../lib/payload'
import { unauthorized, badRequest, notFound, forbidden, success } from '../../../../lib/api-response'
import type { Macro } from '../../../../payload-types'

export async function GET(req: Request) {
  const user = await getCurrentUser()
  if (!user) {
    return unauthorized('unauthenticated')
  }

  const { searchParams } = new URL(req.url)
  const macroId = searchParams.get('macroId')

  if (!macroId) {
    return badRequest('缺少宏 ID', 'missing-macro-id')
  }

  const id = Number(macroId)
  if (!id || id <= 0) {
    return badRequest('无效的宏 ID', 'invalid-macro-id')
  }

  const payload = await getPayload()

  // Build a minimal req so the afterRead hook on codeContent sees the current user
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mockReq = { user, payload } as any

  // Staff can always see code
  if (isStaffRole(user)) {
    const macro = await payload
      .findByID({
        collection: 'macros',
        id,
        depth: 0,
        req: mockReq,
      })
      .catch(() => null) as Macro | null
    if (!macro) {
      return notFound('macro-not-found')
    }
    return NextResponse.json(success({ code: macro.codeContent ?? null }))
  }

  // Check active exchange
  const now = new Date().toISOString()
  const exchange = await payload.find({
    collection: 'macro-exchanges',
    where: {
      and: [
        { user: { equals: user.id } },
        { macro: { equals: id } },
        {
          or: [
            { expiresAt: { exists: false } },
            { expiresAt: { greater_than_equal: now } },
          ],
        },
      ],
    },
    limit: 1,
    depth: 0,
  })

  if (exchange.docs.length === 0) {
    return forbidden('未兑换此宏', 'no-exchange')
  }

  const macro = await payload
    .findByID({
      collection: 'macros',
      id,
      depth: 0,
      req: mockReq,
    })
    .catch(() => null) as Macro | null

  if (!macro) {
    return notFound('macro-not-found')
  }

  return NextResponse.json(success({ code: macro.codeContent ?? null }))
}
