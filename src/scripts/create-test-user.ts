/**
 * Create a test user with credits for end-to-end testing.
 * Run with: pnpm tsx --env-file=.env src/scripts/create-test-user.ts
 */
import { getPayload } from 'payload'
import config from '../payload.config'

const TEST_EMAIL = 'test@flymacro.local'
const TEST_PASSWORD = 'TestPass123!'
const TEST_CREDITS = 1000

async function main() {
  const payload = await getPayload({ config })
  console.log('[test-user] checking existing user...')

  const existing = await payload.find({
    collection: 'users',
    where: { email: { equals: TEST_EMAIL } },
    limit: 1,
    depth: 0,
  })

  let userId: string | number

  if (existing.docs.length > 0) {
    userId = (existing.docs[0] as any).id
    console.log(`[test-user] user already exists: ${TEST_EMAIL} (id=${userId})`)
  } else {
    const created = await payload.create({
      collection: 'users',
      data: {
        email: TEST_EMAIL,
        password: TEST_PASSWORD,
        name: '测试用户',
        role: 'user',
        credits: TEST_CREDITS,
        _verified: true,
      } as any,
    })
    userId = (created as any).id
    console.log(`[test-user] created user: ${TEST_EMAIL} (id=${userId})`)
  }

  // Ensure credits are set
  await payload.update({
    collection: 'users',
    id: userId,
    data: { credits: TEST_CREDITS } as any,
  })
  console.log(`[test-user] set credits to ${TEST_CREDITS}`)

  console.log(`[test-user] credentials:`)
  console.log(`  email:    ${TEST_EMAIL}`)
  console.log(`  password: ${TEST_PASSWORD}`)
  console.log(`  credits:  ${TEST_CREDITS}`)
  process.exit(0)
}

main().catch((err) => {
  console.error('[test-user] failed:', err)
  process.exit(1)
})
