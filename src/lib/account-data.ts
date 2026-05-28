import { getPayload } from './payload'
import type { CreditOrder, CreditTransaction, MacroExchange, Notification } from '../payload-types'

export async function getAccountSummary(userId: number) {
  const payload = await getPayload()
  const [exchanges, creditOrders, openTickets, unreadNotifications] = await Promise.all([
    payload.count({
      collection: 'macro-exchanges',
      where: { user: { equals: userId } },
      overrideAccess: true,
    }),
    payload.count({
      collection: 'credit-orders',
      where: { user: { equals: userId } },
      overrideAccess: true,
    }),
    payload.count({
      collection: 'tickets',
      where: {
        and: [{ user: { equals: userId } }, { status: { in: ['open', 'in-progress'] } }],
      },
      overrideAccess: true,
    }),
    payload.count({
      collection: 'notifications',
      where: { and: [{ recipient: { equals: userId } }, { read: { equals: false } }] },
      overrideAccess: true,
    }),
  ])

  return {
    exchanges: exchanges.totalDocs,
    creditOrders: creditOrders.totalDocs,
    openTickets: openTickets.totalDocs,
    unreadNotifications: unreadNotifications.totalDocs,
  }
}

export async function getAccountCreditOrders(userId: number): Promise<CreditOrder[]> {
  const payload = await getPayload()
  const result = await payload.find({
    collection: 'credit-orders',
    where: { user: { equals: userId } },
    sort: '-createdAt',
    limit: 50,
    depth: 0,
    overrideAccess: true,
  })

  return result.docs as CreditOrder[]
}

export async function getAccountCreditTransactions(userId: number): Promise<CreditTransaction[]> {
  const payload = await getPayload()
  const result = await payload.find({
    collection: 'credit-transactions',
    where: { user: { equals: userId } },
    sort: '-createdAt',
    limit: 100,
    depth: 0,
    overrideAccess: true,
  })

  return result.docs as CreditTransaction[]
}

export async function getAccountNotifications(userId: number): Promise<Notification[]> {
  const payload = await getPayload()
  const result = await payload.find({
    collection: 'notifications',
    where: { recipient: { equals: userId } },
    sort: '-createdAt',
    limit: 100,
    depth: 0,
    overrideAccess: true,
  })

  return result.docs as Notification[]
}

export async function getAccountMacroExchanges(userId: number): Promise<MacroExchange[]> {
  const payload = await getPayload()
  const result = await payload.find({
    collection: 'macro-exchanges',
    where: { user: { equals: userId } },
    sort: '-createdAt',
    limit: 50,
    depth: 1,
    overrideAccess: true,
  })

  return result.docs as MacroExchange[]
}
