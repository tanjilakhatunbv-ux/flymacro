'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { clearSessionCache } from '../lib/session-cache'

type Role = 'admin' | 'operator' | 'user'

type Props = {
  email: string
  name: string | null
  role: Role
  unread: number
  credits: number
}

export function UserMenu({ email, name, role, unread, credits }: Props) {
  const [open, setOpen] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)
  const ref = useRef<HTMLDivElement | null>(null)
  const t = useTranslations('nav')
  const tAcct = useTranslations('account')

  useEffect(() => {
    if (!open) return
    function onClick(e: MouseEvent) {
      if (!ref.current) return
      if (e.target instanceof Node && ref.current.contains(e.target)) return
      setOpen(false)
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onClick)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  async function handleLogout() {
    setLoggingOut(true)
    clearSessionCache()

    try {
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 5000)
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'same-origin',
        signal: controller.signal,
      })
      clearTimeout(timeout)
    } catch {
      /* ignore network errors */
    }

    setOpen(false)
    window.location.href = '/'
  }

  const display = name || (email ? email.split('@')[0] : '?')
  const initial = (display[0] || '?').toUpperCase()
  const isStaff = role === 'admin' || role === 'operator'

  return (
    <div className="user-menu" ref={ref}>
      <button
        type="button"
        className="user-menu-trigger"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <span className="user-avatar" aria-hidden="true">
          {initial}
        </span>
        <span className="user-display">{display}</span>
        {credits > 0 && (
          <span style={{ fontSize: '0.7rem', color: 'var(--gold-bright)', marginLeft: 4 }}>
            {tAcct('creditsDisplay', { credits })}
          </span>
        )}
        <svg
          className="user-menu-chevron"
          aria-hidden="true"
          width="13"
          height="13"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>
      {open && (
        <div role="menu" className="user-menu-pop">
          <div className="user-menu-header">
            <div className="user-menu-name">{display}</div>
            <div className="user-menu-mail">{email}</div>
          </div>
          <Link role="menuitem" href="/account" onClick={() => setOpen(false)}>
            {tAcct('center')}
          </Link>
          <Link role="menuitem" href="/account/credits" onClick={() => setOpen(false)}>
            {tAcct('credits')}
          </Link>
          <Link role="menuitem" href="/account/exchanges" onClick={() => setOpen(false)}>
            {tAcct('exchanges')}
          </Link>
          <Link role="menuitem" href="/account/orders" onClick={() => setOpen(false)}>
            {tAcct('orders')}
          </Link>
          <Link role="menuitem" href="/account/tickets" onClick={() => setOpen(false)}>
            {tAcct('tickets')}
          </Link>
          <Link role="menuitem" href="/account/notifications" onClick={() => setOpen(false)}>
            {tAcct('notifications')}
            {unread > 0 && <span className="user-menu-pip">{unread}</span>}
          </Link>
          {isStaff && (
            <>
              <div className="user-menu-sep" role="separator" />
              <Link role="menuitem" href="/admin" onClick={() => setOpen(false)}>
                {tAcct('adminPanel')}
              </Link>
            </>
          )}
          <div className="user-menu-sep" role="separator" />
          <button
            type="button"
            role="menuitem"
            className="user-menu-logout"
            onClick={handleLogout}
            disabled={loggingOut}
          >
            {loggingOut ? t('loggingOut') : t('logout')}
          </button>
        </div>
      )}
    </div>
  )
}
