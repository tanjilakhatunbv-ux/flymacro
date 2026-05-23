'use client'

import dynamic from 'next/dynamic'
import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/routing'
import { readSessionCache, writeSessionCache, isCacheValid } from '../lib/session-cache'

const UserMenu = dynamic(() => import('./UserMenu').then((m) => ({ default: m.UserMenu })))

type UserRole = 'admin' | 'operator' | 'user'

type User = {
  id: string | number
  email: string
  name: string | null
  role: UserRole
  credits: number
}

export function HeaderAuth() {
  const t = useTranslations('nav')
  const [user, setUser] = useState<User | null | undefined>(undefined)
  const [unread, setUnread] = useState(0)

  useEffect(() => {
    let cancelled = false

    const cached = readSessionCache()
    const cacheValid = cached && isCacheValid(cached.ts)
    if (cacheValid) {
      setUser(cached.user as User | null)
      setUnread(cached.unread ?? 0)
      return
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
        writeSessionCache(
          u ? { id: u.id, email: u.email, name: u.name, credits: u.credits, role: u.role, _verified: (u as unknown as { _verified?: boolean })._verified } : null,
          { unread: count },
        )
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
          {t('login')}
        </span>
        <span className="btn btn-primary" style={{ padding: '0.45rem 1rem', fontSize: '0.78rem', opacity: 0.4 }}>
          {t('register')}
        </span>
      </>
    )
  }

  if (user === null) {
    return (
      <>
        <Link href="/auth?mode=login" prefetch={false} className="btn" style={{ padding: '0.45rem 1rem', fontSize: '0.78rem' }}>
          {t('login')}
        </Link>
        <Link href="/auth?mode=register" prefetch={false} className="btn btn-primary" style={{ padding: '0.45rem 1rem', fontSize: '0.78rem' }}>
          {t('register')}
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
