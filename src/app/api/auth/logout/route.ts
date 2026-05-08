import { NextResponse } from 'next/server'
import { success } from '../../../../lib/api-response'

export async function POST() {
  const response = NextResponse.json(success({ message: '已退出登录' }))

  response.cookies.set('payload-token', '', {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
    expires: new Date(0),
  })

  return response
}
