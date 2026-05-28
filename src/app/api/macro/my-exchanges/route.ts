import { NextResponse } from 'next/server'
import { getCurrentUser } from '../../../../lib/auth'
import { getActiveExchangeMacroIds } from '../../../../lib/macro-access'
import { unauthorized, success } from '../../../../lib/api-response'

export async function GET() {
  const user = await getCurrentUser()
  if (!user) {
    return unauthorized('unauthenticated')
  }

  try {
    const exchangedIds = await getActiveExchangeMacroIds(user.id)
    return NextResponse.json(success({ exchangedIds }))
  } catch {
    return NextResponse.json(success({ exchangedIds: [] }))
  }
}
