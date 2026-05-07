import { NextResponse } from 'next/server'
import { getCurrentUser } from '../../../../lib/auth'
import { success, unauthorized } from '../../../../lib/api-response'

export async function GET() {
  const user = await getCurrentUser()
  if (!user) {
    return unauthorized('unauthenticated')
  }
  return NextResponse.json(
    success({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      credits: user.credits,
      status: user.status,
    }),
  )
}
