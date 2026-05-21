import { getPayload } from './payload'
import { sql } from '@payloadcms/db-postgres'

/**
 * Grant 20 registration bonus credits to a newly-registered user.
 * Uses atomic SQL to prevent concurrent calls from granting the bonus twice.
 */
export async function grantRegisterBonus(user: { id: number; credits?: number | null }): Promise<void> {
  const payload = await getPayload()

  // Atomic: only updates if credits is currently 0, preventing double-grant races
  const result = await payload.db.drizzle.execute(
    sql`UPDATE users SET credits = 20 WHERE id = ${user.id} AND credits = 0 RETURNING id`
  )
  const rows = result.rows as Array<{ id: number }> | undefined
  if (!rows || rows.length === 0) return

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
