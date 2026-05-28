import { getPayload } from './payload'
import type { RedeemCodeRedemption } from '../payload-types'

export async function getAccountRedeemCodeRedemptions(userId: number): Promise<RedeemCodeRedemption[]> {
  const payload = await getPayload()

  const result = await payload.find({
    collection: 'redeem-code-redemptions',
    where: { user: { equals: userId } },
    sort: '-createdAt',
    limit: 100,
    depth: 1,
    overrideAccess: true,
  })

  return result.docs as RedeemCodeRedemption[]
}
