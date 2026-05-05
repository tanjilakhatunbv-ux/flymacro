import { NextResponse } from 'next/server'
import { getPayload } from '../../../../lib/payload'
import type { User } from '../../../../payload-types'

export async function POST(req: Request) {
  console.log('[exchange] API called')

  try {
    // Direct auth from request headers — more reliable in Route Handlers than nextHeaders()
    const cookieHeader = req.headers.get('cookie')
    console.log('[exchange] cookie header present:', !!cookieHeader)
    if (cookieHeader) {
      console.log('[exchange] has payload-token:', cookieHeader.includes('payload-token'))
    }

    const payload = await getPayload()
    const auth = await payload.auth({ headers: req.headers })
    const user = auth.user as User | undefined ?? null
    console.log('[exchange] user:', user ? { id: user.id, email: user.email, credits: user.credits } : null)

    if (!user) {
      console.log('[exchange] ERROR: user not authenticated')
      return NextResponse.json({ error: 'unauthenticated', message: '请先登录。' }, { status: 401 })
    }

    let body: { macroSlug?: string }
    try {
      body = (await req.json()) as typeof body
    } catch (err) {
      console.log('[exchange] ERROR: invalid JSON body', err)
      return NextResponse.json({ error: 'invalid-body', message: '请求体格式错误。' }, { status: 400 })
    }

    const { macroSlug } = body
    console.log('[exchange] macroSlug:', macroSlug)

    if (!macroSlug) {
      return NextResponse.json({ error: 'missing-macro', message: '缺少宏标识。' }, { status: 400 })
    }

    const macroRes = await payload.find({
      collection: 'macros',
      where: { slug: { equals: macroSlug } },
      limit: 1,
      depth: 0,
    })
    const macro = macroRes.docs[0] as any
    console.log('[exchange] macro found:', macro ? { id: macro.id, slug: macro.slug, price: macro.price } : null)

    if (!macro) {
      return NextResponse.json({ error: 'macro-not-found', message: '宏不存在。' }, { status: 404 })
    }

    const price = macro.price ?? 0
    const currentCredits = (user.credits as number) ?? 0
    console.log('[exchange] price:', price, 'currentCredits:', currentCredits)

    if (currentCredits < price) {
      return NextResponse.json(
        { error: 'insufficient-credits', message: `积分不足，需要 ${price} 积分，当前 ${currentCredits} 积分。` },
        { status: 403 },
      )
    }

    // Check for existing active exchange
    const existing = await payload.find({
      collection: 'macro-exchanges',
      where: {
        and: [
          { user: { equals: user.id } },
          { macro: { equals: macro.id } },
          {
            or: [
              { expiresAt: { exists: false } },
              { expiresAt: { greater_than_equal: new Date().toISOString() } },
            ],
          },
        ],
      },
      limit: 1,
      depth: 0,
      overrideAccess: true,
    })
    console.log('[exchange] existing exchanges:', existing.docs.length)

    if (existing.docs.length > 0) {
      return NextResponse.json(
        { error: 'already-exchanged', message: '你已经兑换过此宏，且仍在有效期内。' },
        { status: 409 },
      )
    }

    const now = new Date()
    const durationDays = macro.durationDays ?? 0
    const expiresAt = durationDays > 0
      ? new Date(now.getTime() + durationDays * 24 * 60 * 60 * 1000).toISOString()
      : null

    // Deduct credits
    const newCredits = currentCredits - price
    console.log('[exchange] deducting credits:', currentCredits, '->', newCredits)
    await payload.update({
      collection: 'users',
      id: user.id,
      data: { credits: newCredits } as any,
      overrideAccess: true,
    })

    // Create exchange record
    console.log('[exchange] creating exchange record')
    const exchange = await payload.create({
      collection: 'macro-exchanges',
      data: {
        user: user.id,
        macro: macro.id,
        creditsSpent: price,
        grantedAt: now.toISOString(),
        expiresAt,
        autoRenew: macro.autoRenewable ?? false,
      } as any,
      overrideAccess: true,
    })
    console.log('[exchange] exchange created:', exchange.id)

    // Create credit transaction
    await payload.create({
      collection: 'credit-transactions',
      data: {
        user: user.id,
        amount: -price,
        balanceAfter: newCredits,
        type: 'exchange',
        relatedExchange: exchange.id,
        reason: `兑换「${macro.title}」`,
      } as any,
      overrideAccess: true,
    })

    // Create notification
    await payload.create({
      collection: 'notifications',
      data: {
        recipient: user.id,
        title: '兑换成功',
        body: `你已成功兑换「${macro.title}」，花费 ${price} 积分。${expiresAt ? '有效期至 ' + expiresAt.slice(0, 10) : '永久有效'}。`,
        link: `/macros/${macroSlug}`,
        category: 'order',
        read: false,
      } as any,
      overrideAccess: true,
    })

    console.log('[exchange] SUCCESS')
    return NextResponse.json({
      success: true,
      credits: newCredits,
      expiresAt,
      autoRenew: macro.autoRenewable ?? false,
    })
  } catch (err: any) {
    console.error('[exchange] UNEXPECTED ERROR:', err.message, err.stack)
    return NextResponse.json(
      { error: 'internal-error', message: '服务器内部错误：' + err.message },
      { status: 500 },
    )
  }
}
