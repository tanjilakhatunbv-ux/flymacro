'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { UserMenu } from './UserMenu'

type User = {
  id: string | number
  email: string
  name: string | null
  role: string
  credits: number
}

export function HeaderAuth() {
  const [user, setUser] = useState<User | null | undefined>(undefined)
  const [unread, setUnread] = useState(0)

  useEffect(() => {
    let cancelled = false
    fetch('/api/auth/me', { credentials: 'same-origin' })
      .then((r) => (r.ok ? r.json() : { user: null }))
      .then((data) => {
        if (cancelled) return
        setUser(data.user ?? null)
        if (data.user) {
          fetch('/api/auth/unread-count', { credentials: 'same-origin' })
            .then((r) => (r.ok ? r.json() : { count: 0 }))
            .then((d) => {
              if (!cancelled) setUnread(d.count ?? 0)
            })
            .catch(() => {})
        }
      })
      .catch(() => {
        if (!cancelled) setUser(null)
      })
    return () => {
      cancelled = true
    }
  }, [])

  if (user === undefined) {
    // Skeleton while loading
    return (
      <>
        <span className="btn" style={{ padding: '0.45rem 1rem', fontSize: '0.78rem', opacity: 0.4 }}>
          登录
        </span>
        <span className="btn btn-primary" style={{ padding: '0.45rem 1rem', fontSize: '0.78rem', opacity: 0.4 }}>
          注册
        </span>
      </>
    )
  }

  if (user === null) {
    return (
      <>
        <Link href="/login" className="btn" style={{ padding: '0.45rem 1rem', fontSize: '0.78rem' }}>
          登录
        </Link>
        <Link href="/register" className="btn btn-primary" style={{ padding: '0.45rem 1rem', fontSize: '0.78rem' }}>
          注册
        </Link>
      </>
    )
  }

  return (
    <UserMenu
      email={user.email}
      name={user.name ?? null}
      role={user.role as any}
      unread={unread}
      credits={user.credits ?? 0}
    />
  )
}
