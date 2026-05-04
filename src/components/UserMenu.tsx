'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

type Role = 'super-admin' | 'operator' | 'support' | 'user'

type Props = {
  email: string
  name: string | null
  role: Role
  unread: number
  credits: number
}

export function UserMenu({ email, name, role, unread, credits }: Props) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)
  const ref = useRef<HTMLDivElement | null>(null)

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
    try {
      await fetch('/api/users/logout', { method: 'POST', credentials: 'same-origin' })
    } catch {
      /* ignore */
    } finally {
      setOpen(false)
      router.push('/')
      router.refresh()
    }
  }

  const display = name || email.split('@')[0]
  const initial = (display[0] || '?').toUpperCase()
  const isStaff = role === 'super-admin' || role === 'operator' || role === 'support'

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
            {credits} 积分
          </span>
        )}
        {unread > 0 && (
          <span className="user-badge" aria-label={`${unread} 条未读通知`}>
            {unread > 99 ? '99+' : unread}
          </span>
        )}
      </button>
      {open && (
        <div role="menu" className="user-menu-pop">
          <div className="user-menu-header">
            <div className="user-menu-name">{display}</div>
            <div className="user-menu-mail">{email}</div>
          </div>
          <Link role="menuitem" href="/account" onClick={() => setOpen(false)}>
            个人中心
          </Link>
          <Link role="menuitem" href="/account/credits" onClick={() => setOpen(false)}>
            充值积分
          </Link>
          <Link role="menuitem" href="/account/exchanges" onClick={() => setOpen(false)}>
            我的兑换
          </Link>
          <Link role="menuitem" href="/account/orders" onClick={() => setOpen(false)}>
            充值记录
          </Link>
          <Link role="menuitem" href="/account/tickets" onClick={() => setOpen(false)}>
            我的工单
          </Link>
          <Link role="menuitem" href="/account/notifications" onClick={() => setOpen(false)}>
            通知
            {unread > 0 && <span className="user-menu-pip">{unread}</span>}
          </Link>
          {isStaff && (
            <>
              <div className="user-menu-sep" role="separator" />
              <Link role="menuitem" href="/admin" onClick={() => setOpen(false)}>
                运营后台
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
            {loggingOut ? '退出中…' : '退出登录'}
          </button>
        </div>
      )}
    </div>
  )
}
