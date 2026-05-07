'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { UserMenu } from './UserMenu'

type UserRole = 'super-admin' | 'operator' | 'support' | 'user'

type User = {
  id: string | number
  email: string
  name: string | null
  role: UserRole
  credits: number
}

const CACHE_KEY = 'flymacro_session_v2'
const CACHE_TTL_MS = 5 * 60 * 1000 // 5 minutes

function readCache(): { user: User | null; unread: number; ts: number } | null {
  if (typeof sessionStorage === 'undefined') return null
  try {
    const raw = sessionStorage.getItem(CACHE_KEY)
    if (!raw) return null
    return JSON.parse(raw)
  } catch {
    return null
  }
}

function writeCache(user: User | null, unread: number) {
  if (typeof sessionStorage === 'undefined') return
  try {
    sessionStorage.setItem(CACHE_KEY, JSON.stringify({ user, unread, ts: Date.now() }))
  } catch {}
}

export function HeaderAuth() {
  const [user, setUser] = useState<User | null | undefined>(undefined)
  const [unread, setUnread] = useState(0)

  useEffect(() => {
    let cancelled = false

    // 1. Use cached value instantly
    const cached = readCache()
    const cacheValid = cached && Date.now() - cached.ts < CACHE_TTL_MS
    if (cacheValid) {
      setUser(cached.user)
      setUnread(cached.unread)
    }

    // 2. Always fetch fresh in background
    fetch('/api/auth/session', { credentials: 'same-origin' })
      .then((r) => (r.ok ? r.json() : { user: null, unread: 0 }))
      .then((data) => {
        if (cancelled) return
        const u = data.user ?? null
        const count = data.unread ?? 0
        setUser(u)
        setUnread(count)
        writeCache(u, count)
      })
      .catch(() => {
        if (!cancelled) {
          setUser(null)
          setUnread(0)
          writeCache(null, 0)
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
