/**
 * Full admin access control audit.
 * Validates RBAC matrix for all collections across 4 roles.
 * Run with: pnpm tsx --env-file=.env src/scripts/test-admin-access.ts
 */
import { getPayload } from 'payload'
import config from '../payload.config'

type Role = 'super-admin' | 'operator' | 'support' | 'user'

const ROLES: Role[] = ['super-admin', 'operator', 'support', 'user']

const TESTS: { collection: string; ops: ('read' | 'create' | 'update' | 'delete')[] }[] = [
  { collection: 'users', ops: ['read', 'create', 'update', 'delete'] },
  { collection: 'macros', ops: ['read', 'create', 'update', 'delete'] },
  { collection: 'macro-exchanges', ops: ['read', 'create', 'update', 'delete'] },
  { collection: 'credit-orders', ops: ['read', 'create', 'update', 'delete'] },
  { collection: 'credit-transactions', ops: ['read', 'create', 'update', 'delete'] },
  { collection: 'credit-packages', ops: ['read', 'create', 'update', 'delete'] },
  { collection: 'tickets', ops: ['read', 'create', 'update', 'delete'] },
  { collection: 'ticket-messages', ops: ['read', 'create', 'update', 'delete'] },
  { collection: 'notifications', ops: ['read', 'create', 'update', 'delete'] },
  { collection: 'media', ops: ['read', 'create', 'update', 'delete'] },
  { collection: 'guides', ops: ['read', 'create', 'update', 'delete'] },
  { collection: 'articles', ops: ['read', 'create', 'update', 'delete'] },
  { collection: 'pages', ops: ['read', 'create', 'update', 'delete'] },
  { collection: 'classes', ops: ['read', 'create', 'update', 'delete'] },
  { collection: 'specs', ops: ['read', 'create', 'update', 'delete'] },
  { collection: 'versions', ops: ['read', 'create', 'update', 'delete'] },
]

// Expected permissions matrix (simplified)
const EXPECTED: Record<string, Record<string, boolean>> = {
  // users: staff read all, user read own, anyone can register, only owner/super-admin can update
  'users-read': { 'super-admin': true, operator: true, support: true, user: true },
  'users-create': { 'super-admin': true, operator: true, support: true, user: true },
  'users-update': { 'super-admin': true, operator: true, support: true, user: true },
  'users-delete': { 'super-admin': true, operator: false, support: false, user: false },

  // macros: publishedOrStaff, only operator+ manage
  'macros-read': { 'super-admin': true, operator: true, support: true, user: true },
  'macros-create': { 'super-admin': true, operator: true, support: false, user: false },
  'macros-update': { 'super-admin': true, operator: true, support: false, user: false },
  'macros-delete': { 'super-admin': true, operator: true, support: false, user: false },

  // macro-exchanges: ownerOrStaff, create restricted to staff (API uses overrideAccess)
  'macro-exchanges-read': { 'super-admin': true, operator: true, support: true, user: true },
  'macro-exchanges-create': { 'super-admin': true, operator: true, support: true, user: false },
  'macro-exchanges-update': { 'super-admin': true, operator: true, support: true, user: true },
  'macro-exchanges-delete': { 'super-admin': true, operator: false, support: false, user: false },

  // credit-orders: ownerOrStaff read, staff update, no create/delete by users
  'credit-orders-read': { 'super-admin': true, operator: true, support: true, user: true },
  'credit-orders-create': { 'super-admin': false, operator: false, support: false, user: false },
  'credit-orders-update': { 'super-admin': true, operator: true, support: true, user: false },
  'credit-orders-delete': { 'super-admin': true, operator: false, support: false, user: false },

  // credit-transactions: read-only ledger
  'credit-transactions-read': { 'super-admin': true, operator: true, support: true, user: true },
  'credit-transactions-create': { 'super-admin': false, operator: false, support: false, user: false },
  'credit-transactions-update': { 'super-admin': false, operator: false, support: false, user: false },
  'credit-transactions-delete': { 'super-admin': true, operator: false, support: false, user: false },

  // credit-packages: public read, operator+ manage
  'credit-packages-read': { 'super-admin': true, operator: true, support: true, user: true },
  'credit-packages-create': { 'super-admin': true, operator: true, support: false, user: false },
  'credit-packages-update': { 'super-admin': true, operator: true, support: false, user: false },
  'credit-packages-delete': { 'super-admin': true, operator: false, support: false, user: false },

  // tickets: ownerOrStaff, user can create own
  'tickets-read': { 'super-admin': true, operator: true, support: true, user: true },
  'tickets-create': { 'super-admin': true, operator: true, support: true, user: true },
  'tickets-update': { 'super-admin': true, operator: true, support: true, user: true },
  'tickets-delete': { 'super-admin': true, operator: false, support: false, user: false },

  // ticket-messages: restricted create (staff or ticket owner)
  'ticket-messages-read': { 'super-admin': true, operator: true, support: true, user: true },
  'ticket-messages-create': { 'super-admin': true, operator: true, support: true, user: false },
  'ticket-messages-update': { 'super-admin': true, operator: true, support: true, user: false },
  'ticket-messages-delete': { 'super-admin': true, operator: false, support: false, user: false },

  // notifications: recipient or staff
  'notifications-read': { 'super-admin': true, operator: true, support: true, user: true },
  'notifications-create': { 'super-admin': true, operator: true, support: false, user: false },
  'notifications-update': { 'super-admin': true, operator: true, support: true, user: true },
  'notifications-delete': { 'super-admin': true, operator: false, support: false, user: false },

  // media: public read, operator+ manage
  'media-read': { 'super-admin': true, operator: true, support: true, user: true },
  'media-create': { 'super-admin': true, operator: true, support: false, user: false },
  'media-update': { 'super-admin': true, operator: true, support: false, user: false },
  'media-delete': { 'super-admin': true, operator: true, support: false, user: false },

  // guides/articles/pages: publishedOrStaff, operator+ manage
  'guides-read': { 'super-admin': true, operator: true, support: true, user: true },
  'guides-create': { 'super-admin': true, operator: true, support: false, user: false },
  'guides-update': { 'super-admin': true, operator: true, support: false, user: false },
  'guides-delete': { 'super-admin': true, operator: true, support: false, user: false },

  'articles-read': { 'super-admin': true, operator: true, support: true, user: true },
  'articles-create': { 'super-admin': true, operator: true, support: false, user: false },
  'articles-update': { 'super-admin': true, operator: true, support: false, user: false },
  'articles-delete': { 'super-admin': true, operator: true, support: false, user: false },

  'pages-read': { 'super-admin': true, operator: true, support: true, user: true },
  'pages-create': { 'super-admin': true, operator: true, support: false, user: false },
  'pages-update': { 'super-admin': true, operator: true, support: false, user: false },
  'pages-delete': { 'super-admin': true, operator: true, support: false, user: false },

  // classes/specs/versions: public read, operator+ manage
  'classes-read': { 'super-admin': true, operator: true, support: true, user: true },
  'classes-create': { 'super-admin': true, operator: true, support: false, user: false },
  'classes-update': { 'super-admin': true, operator: true, support: false, user: false },
  'classes-delete': { 'super-admin': true, operator: true, support: false, user: false },

  'specs-read': { 'super-admin': true, operator: true, support: true, user: true },
  'specs-create': { 'super-admin': true, operator: true, support: false, user: false },
  'specs-update': { 'super-admin': true, operator: true, support: false, user: false },
  'specs-delete': { 'super-admin': true, operator: true, support: false, user: false },

  'versions-read': { 'super-admin': true, operator: true, support: true, user: true },
  'versions-create': { 'super-admin': true, operator: true, support: false, user: false },
  'versions-update': { 'super-admin': true, operator: true, support: false, user: false },
  'versions-delete': { 'super-admin': true, operator: true, support: false, user: false },
}

async function main() {
  const payload = await getPayload({ config })
  console.log('[audit] starting admin access control audit...\n')

  let passed = 0
  let failed = 0

  for (const { collection, ops } of TESTS) {
    const collConfig = (payload as any).collections[collection]?.config
    if (!collConfig) {
      console.warn(`[audit] SKIP: collection ${collection} not found`)
      continue
    }

    for (const op of ops) {
      const accessFn = collConfig.access?.[op]
      if (!accessFn) {
        console.warn(`[audit] SKIP: ${collection}.${op} has no access function`)
        continue
      }

      for (const role of ROLES) {
        const key = `${collection}-${op}`
        const expected = EXPECTED[key]?.[role] ?? false
        const mockUser = { id: 999, role, email: `${role}@test.local` }
        const req = { user: mockUser, payload } as any

        let result: any
        try {
          result = await accessFn({ req, data: {} })
        } catch (err) {
          result = false
        }

        const actual = result === true || (typeof result === 'object' && result !== null && Object.keys(result).length > 0)
        const status = actual === expected ? '✅' : '❌'

        if (actual === expected) {
          passed++
        } else {
          failed++
          console.log(
            `${status} ${collection}.${op} | role=${role.padEnd(12)} expected=${expected.toString().padEnd(5)} actual=${actual.toString().padEnd(5)} result=${JSON.stringify(result)}`
          )
        }
      }
    }
  }

  console.log(`\n[audit] RESULT: ${passed} passed, ${failed} failed`)

  if (failed > 0) {
    console.log('[audit] SOME CHECKS FAILED — see ❌ lines above')
    process.exit(1)
  }

  console.log('[audit] ALL CHECKS PASSED ✅')
  process.exit(0)
}

main().catch((err) => {
  console.error('[audit] FAILED:', err)
  process.exit(1)
})
