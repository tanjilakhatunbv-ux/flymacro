import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

function read(path: string): string {
  return readFileSync(join(process.cwd(), path), 'utf8')
}

function assert(condition: boolean, message: string): void {
  if (!condition) {
    console.error(message)
    process.exit(1)
  }
}

const helperPath = 'src/lib/admin-maintenance-service.ts'
assert(existsSync(join(process.cwd(), helperPath)), 'Admin maintenance service helper must exist.')

const helper = read(helperPath)
assert(
  helper.includes('export async function resetIncompatibleLexicalBodies'),
  'Admin maintenance service must export resetIncompatibleLexicalBodies.',
)

for (const required of ['pages', 'guides', 'articles', 'tickets']) {
  assert(helper.includes(required), `Admin maintenance service must include ${required}.`)
}

const routePath = 'src/app/api/admin/fix-lexical/route.ts'
const route = read(routePath)
assert(
  !route.includes('/lib/payload') && !route.includes('getPayload'),
  `${routePath} must use admin-maintenance-service instead of importing getPayload directly.`,
)
assert(
  route.includes('admin-maintenance-service'),
  `${routePath} must import from admin-maintenance-service.`,
)
assert(
  route.includes('CRON_SECRET') && route.includes('isStaffRole'),
  `${routePath} must keep cron secret and staff auth protection.`,
)

console.log('Admin maintenance API uses the admin-maintenance-service boundary.')
