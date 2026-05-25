import { NextResponse } from 'next/server'
import { requireAdmin } from '../../../../../lib/admin-guard'
import {
  REDEEM_CODE_CREDIT_OPTIONS,
  type RedeemCodeCredits,
  generateRedeemCode,
} from '../../../../../lib/redeem-code-rules'

type GenerateBody = {
  creditsGranted?: number
  count?: number
  maxRedemptions?: number
  title?: string
  note?: string
}

type RedeemCodeCreditValue = '10' | '20' | '50' | '100' | '200' | '500'

const allowedCredits = new Set(REDEEM_CODE_CREDIT_OPTIONS.map((option) => option.value))

export async function POST(req: Request) {
  const auth = await requireAdmin()
  if ('error' in auth) {
    return NextResponse.json({ success: false, error: auth.error }, { status: auth.status })
  }

  let body: GenerateBody
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ success: false, error: '无效请求' }, { status: 400 })
  }

  const creditsGranted = Number(body.creditsGranted)
  const count = Math.floor(Number(body.count ?? 1))
  const maxRedemptions = Math.floor(Number(body.maxRedemptions ?? 1))
  const title = String(body.title || '').trim()
  const note = String(body.note || '').trim()

  if (!allowedCredits.has(creditsGranted as RedeemCodeCredits)) {
    return NextResponse.json({ success: false, error: '不支持的点券包' }, { status: 400 })
  }
  if (!Number.isInteger(count) || count < 1 || count > 500) {
    return NextResponse.json({ success: false, error: '生成数量必须在 1 到 500 之间' }, { status: 400 })
  }
  if (!Number.isInteger(maxRedemptions) || maxRedemptions < 1) {
    return NextResponse.json({ success: false, error: '最大兑换次数必须大于 0' }, { status: 400 })
  }
  if (!title) {
    return NextResponse.json({ success: false, error: '请填写标题/批次名' }, { status: 400 })
  }

  const { payload } = auth
  const created: Array<{ id: number | string; code: string; creditsGranted: number }> = []
  const seen = new Set<string>()

  for (let i = 0; i < count; i += 1) {
    let code = ''
    for (let attempts = 0; attempts < 10; attempts += 1) {
      const candidate = generateRedeemCode(creditsGranted as RedeemCodeCredits)
      if (seen.has(candidate)) continue
      const existing = await payload.find({
        collection: 'redeem-codes',
        where: { code: { equals: candidate } },
        limit: 1,
        depth: 0,
        overrideAccess: true,
      })
      if (existing.totalDocs === 0) {
        code = candidate
        seen.add(candidate)
        break
      }
    }

    if (!code) {
      return NextResponse.json({ success: false, error: '生成兑换码失败，请重试' }, { status: 500 })
    }

    const doc = await payload.create({
      collection: 'redeem-codes',
      data: {
        title,
        code,
        creditsGranted: String(creditsGranted) as RedeemCodeCreditValue,
        maxRedemptions,
        redeemedCount: 0,
        enabled: true,
        note,
      },
      overrideAccess: true,
    })

    created.push({ id: doc.id, code, creditsGranted })
  }

  return NextResponse.json({ success: true, data: { codes: created } })
}
