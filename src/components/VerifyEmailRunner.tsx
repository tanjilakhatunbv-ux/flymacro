'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

type State = 'pending' | 'ok' | 'fail'

export function VerifyEmailRunner({ token }: { token: string }) {
  const [state, setState] = useState<State>('pending')
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    let cancelled = false
    async function run() {
      try {
        const resp = await fetch(`/api/users/verify/${encodeURIComponent(token)}`, {
          method: 'POST',
          credentials: 'same-origin',
        })
        if (cancelled) return
        if (resp.ok) {
          setState('ok')
        } else {
          let msg = '验证失败，链接可能已过期或无效'
          try {
            const data = (await resp.json()) as { message?: string }
            if (data?.message) msg = data.message
          } catch {
            /* ignore */
          }
          setErrorMsg(msg)
          setState('fail')
        }
      } catch (e) {
        if (cancelled) return
        setErrorMsg(e instanceof Error ? e.message : '验证失败')
        setState('fail')
      }
    }
    void run()
    return () => {
      cancelled = true
    }
  }, [token])

  if (state === 'pending') {
    return (
      <p className="auth-help" role="status">
        正在验证你的邮箱…
      </p>
    )
  }
  if (state === 'ok') {
    return (
      <div className="auth-success" role="status" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <p>邮箱验证成功！现在你可以登录使用账号了。</p>
        <Link href="/login" className="btn btn-primary" style={{ alignSelf: 'flex-start' }}>
          前往登录
        </Link>
      </div>
    )
  }
  return (
    <div className="auth-error" role="alert" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <p>{errorMsg}</p>
      <p className="auth-help">
        如果你的链接已过期，请尝试重新注册或联系客服。
      </p>
      <div style={{ display: 'flex', gap: '0.75rem' }}>
        <Link href="/register" className="btn">
          重新注册
        </Link>
        <Link href="/login" className="btn">
          返回登录
        </Link>
      </div>
    </div>
  )
}
