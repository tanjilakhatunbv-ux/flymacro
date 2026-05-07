'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { UserMenu } from './UserMenu'
import { readSessionCache, writeSessionCache, isCacheValid } from '../lib/session-cache'

type UserRole = 'super-admin' | 'operator' | 'support' | 'user'

type User = {
  id: string | number
  email: string
  name: string | null
  role: UserRole
  credits: number
}

export function HeaderAuth() {
  const [user, setUser] = useState<User | null | undefined>(undefined)
  const [unread, setUnread] = useState(0)

  useEffect(() => {
    let cancelled = false

    const cached = readSessionCache()
    const cacheValid = cached && isCacheValid(cached.ts)
    if (cacheValid) {
      setUser(cached.user as User | null)
      setUnread(cached.unread ?? 0)
    }

    fetch('/api/auth/session', { credentials: 'same-origin' })
      .then((r) => (r.ok ? r.json() : { user: null, unread: 0 }))
      .then((data) => {
        if (cancelled) return
        const payload = data.data ?? data
        const u = (payload.user ?? null) as User | null
        const count = payload.unread ?? 0
        setUser(u)
        setUnread(count)
        writeSessionCache(u, { unread: count })
      })
      .catch(() => {
        if (!cancelled) {
          setUser(null)
          setUnread(0)
          writeSessionCache(null, { unread: 0 })
        }
      })

    return () => {
      cancelled = true
    }
  }, [])

  if (user === undefined) {
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
      role={user.role}
      unread={unread}
      credits={user.credits ?? 0}
    />
  )
}
