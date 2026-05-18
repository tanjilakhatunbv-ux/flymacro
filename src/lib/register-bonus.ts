import { getPayload } from './payload'
import type { User } from '../payload-types'

/**
 * Grant 20 registration bonus credits to a newly-registered user.
 * Idempotent: if the user already has credits > 0, it does nothing.
 */
export async function grantRegisterBonus(user: User | { id: number; credits?: number | null }): Promise<void> {
  if ((user.credits ?? 0) > 0) return

  const payload = await getPayload()

  await payload.update({
    collection: 'users',
    id: user.id,
    data: { credits: 20 } as never,
    overrideAccess: true,
  })

  try {
    await payload.create({
      collection: 'credit-transactions',
      data: {
        user: user.id,
        amount: 20,
        balanceAfter: 20,
        type: 'register_bonus',
        reason: '新用户注册奖励',
      },
      overrideAccess: true,
    })
  } catch {
    /* ignore credit transaction failure */
  }
}
