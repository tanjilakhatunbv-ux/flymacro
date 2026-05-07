/**
 * Audit log & operator permission integration test.
 * Simulates operator creating/updating/deleting users and validates audit trail.
 * Run with: pnpm tsx --env-file=.env src/scripts/test-audit-logs.ts
 */
import { getPayload } from 'payload'
import config from '../payload.config'

const OPERATOR_EMAIL = 'test-operator@flymacro.local'
const OPERATOR_PASS = 'Operator123!'
const TEST_USER_EMAIL = 'audit-test-user@flymacro.local'

async function main() {
  const payload = await getPayload({ config })
  let passed = 0
  let failed = 0

  function ok(label: string) {
    console.log(`✅ ${label}`)
    passed++
  }
  function fail(label: string, detail?: string) {
    console.log(`❌ ${label}${detail ? ` | ${detail}` : ''}`)
    failed++
  }

  // 1. Ensure operator exists
  const opRes = await payload.find({
    collection: 'users',
    where: { email: { equals: OPERATOR_EMAIL } },
    limit: 1,
    depth: 0,
  })
  let operatorId: string | number
  if (opRes.docs.length > 0) {
    operatorId = (opRes.docs[0] as any).id
    console.log(`[test] operator exists: ${OPERATOR_EMAIL} (id=${operatorId})`)
  } else {
    const op = await payload.create({
      collection: 'users',
      data: { email: OPERATOR_EMAIL, password: OPERATOR_PASS, name: '测试运营', role: 'operator', _verified: true } as never,
    })
    operatorId = (op as any).id
    console.log(`[test] created operator: ${OPERATOR_EMAIL} (id=${operatorId})`)
  }

  // Helper to build a mock request with operator as current user
  const mockReq = (role: string, id: string | number) =>
    ({ user: { id, role, email: `${role}@test.local` }, payload } as any)

  // Clean up any existing test user
  const existingTestUser = await payload.find({
    collection: 'users',
    where: { email: { equals: TEST_USER_EMAIL } },
    limit: 1,
    depth: 0,
  })
  if (existingTestUser.docs.length > 0) {
    const existingId = (existingTestUser.docs[0] as any).id
    await payload.delete({ collection: 'users', id: existingId, req: mockReq('super-admin', 1) })
    console.log(`[test] cleaned up existing test user: ${TEST_USER_EMAIL}`)
  }

  // 2. Operator creates a user
  let testUserId: string | number
  try {
    const created = await payload.create({
      collection: 'users',
      data: { email: TEST_USER_EMAIL, password: 'UserPass123!', name: '审计测试用户', role: 'user', _verified: true } as never,
      req: mockReq('operator', operatorId),
    })
    testUserId = (created as any).id
    ok('operator can create user')
  } catch (err: any) {
    fail('operator can create user', err.message)
    process.exit(1)
  }

  // 3. Operator updates user name
  try {
    await payload.update({
      collection: 'users',
      id: testUserId,
      data: { name: '审计测试用户-已改名' } as never,
      req: mockReq('operator', operatorId),
    })
    ok('operator can update user name')
  } catch (err: any) {
    fail('operator can update user name', err.message)
  }

  // 4. Operator tries to update user password -> should fail
  try {
    await payload.update({
      collection: 'users',
      id: testUserId,
      data: { password: 'Hacked123!' } as never,
      req: mockReq('operator', operatorId),
    })
    fail('operator CANNOT update other user password')
  } catch (err: any) {
    if (err.message?.includes('无权修改其他用户的密码')) {
      ok('operator CANNOT update other user password')
    } else {
      fail('operator CANNOT update other user password', `unexpected error: ${err.message}`)
    }
  }

  // 5. Operator tries to update user role -> should fail
  try {
    await payload.update({
      collection: 'users',
      id: testUserId,
      data: { role: 'operator' } as never,
      req: mockReq('operator', operatorId),
    })
    fail('operator CANNOT update user role')
  } catch (err: any) {
    if (err.message?.includes('无权创建/修改非普通用户角色')) {
      ok('operator CANNOT update user role')
    } else {
      fail('operator CANNOT update user role', `unexpected error: ${err.message}`)
    }
  }

  // 6. Operator deletes user
  try {
    await payload.delete({
      collection: 'users',
      id: testUserId,
      req: mockReq('operator', operatorId),
    })
    ok('operator can delete user')
  } catch (err: any) {
    fail('operator can delete user', err.message)
  }

  // 7. Verify audit logs
  const auditRes = await payload.find({
    collection: 'audit-logs',
    where: { operator: { equals: operatorId } },
    sort: '-createdAt',
    limit: 10,
    depth: 0,
    overrideAccess: true,
  })

  const actions = (auditRes.docs as any[]).map((d) => d.action)
  console.log(`[test] audit logs found: ${actions.join(', ')}`)

  if (actions.includes('create_user')) {
    ok('audit log recorded create_user')
  } else {
    fail('audit log recorded create_user')
  }

  if (actions.includes('update_user')) {
    ok('audit log recorded update_user')
  } else {
    fail('audit log recorded update_user')
  }

  if (actions.includes('delete_user')) {
    ok('audit log recorded delete_user')
  } else {
    fail('audit log recorded delete_user')
  }

  // 8. Clean up: delete operator if it was created for this test
  // (Keep it for reuse; no cleanup needed)

  console.log(`\n[test] RESULT: ${passed} passed, ${failed} failed`)
  if (failed > 0) process.exit(1)
  console.log('[test] ALL CHECKS PASSED ✅')
  process.exit(0)
}

main().catch((err) => {
  console.error('[test] FAILED:', err)
  process.exit(1)
})
