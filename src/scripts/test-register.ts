import { getPayload } from '../lib/payload'

async function test() {
  const payload = await getPayload()

  const testEmail = `test_${Date.now()}@example.com`

  try {
    const user = await payload.create({
      collection: 'users',
      data: {
        email: testEmail,
        password: 'Test123456',
        name: 'TestUser',
        role: 'user',
        credits: 20,
      } as never,
      overrideAccess: true,
    })
    console.log('User created:', user)

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
      console.log('Credit transaction created')
    } catch (e) {
      console.error('Credit transaction failed:', e)
    }

    // Clean up
    await payload.delete({
      collection: 'users',
      id: user.id,
      overrideAccess: true,
    })
    console.log('User cleaned up')
  } catch (err) {
    console.error('User creation failed:', err)
  }
}

test().then(() => process.exit(0))
