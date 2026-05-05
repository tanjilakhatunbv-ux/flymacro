import { NextResponse } from 'next/server'
import { getCurrentUser, isStaffRole } from '../../../../lib/auth'
import { getPayload } from '../../../../lib/payload'

export async function GET(req: Request) {
  const user = await getCurrentUser()
  if (!user) {
    return NextResponse.json({
      loggedIn: false,
      isStaff: false,
      exchange: null,
      userCredits: 0,
    })
  }

  const { searchParams } = new URL(req.url)
  const macroId = searchParams.get('macroId')

  if (!macroId) {
    return NextResponse.json(
      { error: 'missing-macro-id', message: '缺少宏 ID' },
      { status: 400 }
    )
  }

  try {
    const payload = await getPayload()
    const staff = isStaffRole(user)

    const result = await payload.find({
      collection: 'macro-exchanges',
      where: {
        and: [
          { user: { equals: user.id } },
          { macro: { equals: Number(macroId) } },
        ],
      },
      sort: '-createdAt',
      limit: 1,
      depth: 0,
      overrideAccess: true,
    })

    const exchange = (result.docs[0] as any) ?? null
    const now = new Date()
    const expired = exchange?.expiresAt ? new Date(exchange.expiresAt) <= now : false

    return NextResponse.json({
      loggedIn: true,
      isStaff: staff,
      exchange: exchange
        ? {
            id: exchange.id,
            expiresAt: exchange.expiresAt,
            autoRenew: exchange.autoRenew,
            expired,
          }
        : null,
      userCredits: (user.credits as number) ?? 0,
    })
  } catch (err: any) {
    return NextResponse.json(
      { error: 'internal-error', message: err.message },
      { status: 500 }
    )
  }
}
