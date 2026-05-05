import { NextResponse } from 'next/server'
import { getPayload } from '../../../../lib/payload'

export async function POST(req: Request) {
  console.log('[login] endpoint called')

  let body: { email?: string; password?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ message: '请求体格式错误' }, { status: 400 })
  }

  const { email, password } = body
  console.log('[login] email:', email)

  if (!email || !password) {
    return NextResponse.json({ message: '请填写邮箱和密码' }, { status: 400 })
  }

  try {
    const payload = await getPayload()

    // Use Payload Local API login — validates password and returns a token.
    const result = await payload.login({
      collection: 'users',
      data: { email, password },
      depth: 0,
    })

    console.log('[login] payload.login result:', result ? 'success' : 'null')

    if (!result || !result.token) {
      console.log('[login] invalid credentials')
      return NextResponse.json({ message: '邮箱或密码错误' }, { status: 401 })
    }

    // Build response and manually set the auth cookie.
    const response = NextResponse.json({
      user: result.user,
      token: result.token,
      message: '登录成功',
    })

    const maxAge = 60 * 60 * 24 * 7 // 7 days
    response.cookies.set('payload-token', result.token, {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      path: '/',
      maxAge,
    })

    console.log('[login] cookie set, user:', (result.user as any)?.email)
    return response
  } catch (err: any) {
    console.error('[login] ERROR:', err.message, err.stack)

    const msg = err.message?.toLowerCase?.() || ''
    if (msg.includes('invalid') || msg.includes('credentials')) {
      return NextResponse.json({ message: '邮箱或密码错误' }, { status: 401 })
    }
    if (msg.includes('not verified') || msg.includes('verify')) {
      return NextResponse.json({ message: '邮箱尚未激活，请检查验证邮件' }, { status: 403 })
    }

    return NextResponse.json(
      { message: '服务器内部错误：' + err.message },
      { status: 500 },
    )
  }
}
