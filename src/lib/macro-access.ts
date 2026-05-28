import { getPayload } from './payload'
import { isStaffRole } from './auth'
import type { Macro, MacroExchange, User } from '../payload-types'

export type MacroExchangeStatus = {
  id: number
  expiresAt?: string | null
  autoRenew?: boolean | null
  expired: boolean
}

export async function getActiveExchangeMacroIds(userId: number): Promise<Array<number | null | undefined>> {
  const payload = await getPayload()
  const result = await payload.find({
    collection: 'macro-exchanges',
    where: {
      and: [
        { user: { equals: userId } },
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

  return result.docs.map((exchange) => {
    const doc = exchange as MacroExchange
    return typeof doc.macro === 'object' ? doc.macro?.id : doc.macro
  })
}

export async function getMacroExchangeStatus(
  userId: number,
  macroId: number,
): Promise<MacroExchangeStatus | null> {
  const payload = await getPayload()
  const result = await payload.find({
    collection: 'macro-exchanges',
    where: {
      and: [
        { user: { equals: userId } },
        { macro: { equals: macroId } },
      ],
    },
    sort: '-createdAt',
    limit: 1,
    depth: 0,
  })

  const exchange = result.docs[0] as MacroExchange | undefined
  if (!exchange) return null

  const expired = exchange.expiresAt ? new Date(exchange.expiresAt) <= new Date() : false
  return {
    id: exchange.id,
    expiresAt: exchange.expiresAt,
    autoRenew: exchange.autoRenew,
    expired,
  }
}

export async function getAccessibleMacroCode(
  user: User,
  macroId: number,
): Promise<{ code: string | null; missing: boolean; forbidden: boolean }> {
  const payload = await getPayload()
  // Build a minimal req so the afterRead hook on codeContent sees the current user.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const req = { user, payload } as any

  if (!isStaffRole(user)) {
    const exchange = await payload.find({
      collection: 'macro-exchanges',
      where: {
        and: [
          { user: { equals: user.id } },
          { macro: { equals: macroId } },
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
    })

    if (exchange.docs.length === 0) {
      return { code: null, missing: false, forbidden: true }
    }
  }

  const macro = await payload
    .findByID({
      collection: 'macros',
      id: macroId,
      depth: 0,
      req,
    })
    .catch(() => null) as Macro | null

  if (!macro) return { code: null, missing: true, forbidden: false }
  return { code: macro.codeContent ?? null, missing: false, forbidden: false }
}
