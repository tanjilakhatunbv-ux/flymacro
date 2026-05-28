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

const servicePath = 'src/lib/auth-service.ts'
assert(existsSync(join(process.cwd(), servicePath)), 'Auth service boundary must exist at src/lib/auth-service.ts.')

const service = read(servicePath)
for (const exportName of [
  'findUserByEmail',
  'verifyPasswordForUser',
  'signAuthToken',
  'updateLoginMetadata',
  'writeUserAuditLog',
  'createPasswordUser',
]) {
  assert(
    service.includes(`export async function ${exportName}`) || service.includes(`export function ${exportName}`),
    `Auth service must export ${exportName}.`,
  )
}

const loginRoute = read('src/app/api/auth/login/route.ts')
assert(
  loginRoute.includes("from '../../../../lib/auth-service'"),
  'Login route must use auth-service helpers for Payload auth business logic.',
)
assert(
  !loginRoute.includes("import { getPayload } from '../../../../lib/payload'"),
  'Login route must not import getPayload directly after auth-service extraction.',
)
assert(
  !loginRoute.includes("from '@payloadcms/db-postgres'"),
  'Login route must not query password hashes directly after auth-service extraction.',
)

const registerRoute = read('src/app/api/auth/register/route.ts')
assert(
  registerRoute.includes("from '../../../../lib/auth-service'"),
  'Register route must use auth-service helpers for Payload auth business logic.',
)
assert(
  !registerRoute.includes("import { getPayload } from '../../../../lib/payload'"),
  'Register route must not import getPayload directly after auth-service extraction.',
)
assert(
  !registerRoute.includes("import { signJwt } from '../../../../lib/jwt'"),
  'Register route must not sign JWTs directly after auth-service extraction.',
)

console.log('Auth service boundary keeps login/register Payload business logic out of route handlers.')
