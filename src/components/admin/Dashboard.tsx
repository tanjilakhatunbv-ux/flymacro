'use client'

import React, { useEffect, useState } from 'react'

interface Stats {
  users: number
  orders: number
  tickets: number
  macros: number
  exchanges: number
}

const StatCard: React.FC<{
  label: string
  value: number
  icon: React.ReactNode
  color: string
  href: string
}> = ({ label, value, icon, color, href }) => (
  <a
    href={href}
    style={{
      display: 'flex',
      alignItems: 'center',
      gap: 16,
      padding: '20px 24px',
      background: '#1e293b',
      border: '1px solid #334155',
      borderRadius: 12,
      textDecoration: 'none',
      transition: 'all 0.2s ease',
      cursor: 'pointer',
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.borderColor = color
      e.currentTarget.style.transform = 'translateY(-2px)'
      e.currentTarget.style.boxShadow = `0 8px 30px ${color}20`
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.borderColor = '#334155'
      e.currentTarget.style.transform = 'translateY(0)'
      e.currentTarget.style.boxShadow = 'none'
    }}
  >
    <div
      style={{
        width: 48,
        height: 48,
        borderRadius: 10,
        background: `${color}15`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        color,
      }}
    >
      {icon}
    </div>
    <div>
      <div
        style={{
          fontSize: 28,
          fontWeight: 700,
          color: '#f8fafc',
          lineHeight: 1.2,
          fontFamily: 'system-ui, -apple-system, sans-serif',
        }}
      >
        {value.toLocaleString()}
      </div>
      <div
        style={{
          fontSize: 13,
          color: '#94a3b8',
          marginTop: 4,
          fontWeight: 500,
          letterSpacing: '0.02em',
        }}
      >
        {label}
      </div>
    </div>
  </a>
)

const QuickLink: React.FC<{
  label: string
  description: string
  href: string
}> = ({ label, description, href }) => (
  <a
    href={href}
    style={{
      display: 'block',
      padding: '16px 20px',
      background: '#1e293b',
      border: '1px solid #334155',
      borderRadius: 10,
      textDecoration: 'none',
      transition: 'all 0.15s ease',
      cursor: 'pointer',
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.borderColor = '#6366f1'
      e.currentTarget.style.background = '#252f42'
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.borderColor = '#334155'
      e.currentTarget.style.background = '#1e293b'
    }}
  >
    <div
      style={{
        fontSize: 14,
        fontWeight: 600,
        color: '#f8fafc',
        marginBottom: 4,
      }}
    >
      {label}
    </div>
    <div
      style={{
        fontSize: 13,
        color: '#64748b',
        lineHeight: 1.5,
      }}
    >
      {description}
    </div>
  </a>
)

export default function Dashboard() {
  const [stats, setStats] = useState<Stats>({
    users: 0,
    orders: 0,
    tickets: 0,
    macros: 0,
    exchanges: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const headers = { 'Content-Type': 'application/json' }
        const [usersRes, ordersRes, ticketsRes, macrosRes, exchangesRes] =
          await Promise.all([
            fetch('/api/users?limit=0', { headers }),
            fetch('/api/credit-orders?limit=0', { headers }),
            fetch('/api/tickets?limit=0', { headers }),
            fetch('/api/macros?limit=0', { headers }),
            fetch('/api/macro-exchanges?limit=0', { headers }),
          ])

        const [users, orders, tickets, macros, exchanges] = await Promise.all([
          usersRes.json(),
          ordersRes.json(),
          ticketsRes.json(),
          macrosRes.json(),
          exchangesRes.json(),
        ])

        setStats({
          users: users.totalDocs ?? 0,
          orders: orders.totalDocs ?? 0,
          tickets: tickets.totalDocs ?? 0,
          macros: macros.totalDocs ?? 0,
          exchanges: exchanges.totalDocs ?? 0,
        })
      } catch {
        // silent fail
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [])

  return (
    <div
      style={{
        padding: '32px 40px',
        maxWidth: 1200,
        fontFamily: 'system-ui, -apple-system, sans-serif',
      }}
    >
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <h1
          style={{
            fontSize: 28,
            fontWeight: 700,
            color: '#f8fafc',
            margin: 0,
            letterSpacing: '-0.02em',
          }}
        >
          控制台
        </h1>
        <p
          style={{
            fontSize: 15,
            color: '#64748b',
            margin: '8px 0 0',
            lineHeight: 1.5,
          }}
        >
          欢迎回来，以下是 FlyMacro 的实时运营概览
        </p>
      </div>

      {/* Stats Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
          gap: 16,
          marginBottom: 32,
        }}
      >
        <StatCard
          label="注册用户"
          value={loading ? 0 : stats.users}
          color="#6366f1"
          href="/admin/collections/users"
          icon={
            <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          }
        />
        <StatCard
          label="充值订单"
          value={loading ? 0 : stats.orders}
          color="#22c55e"
          href="/admin/collections/credit-orders"
          icon={
            <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
        <StatCard
          label="工单数"
          value={loading ? 0 : stats.tickets}
          color="#f59e0b"
          href="/admin/collections/tickets"
          icon={
            <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
            </svg>
          }
        />
        <StatCard
          label="宏数量"
          value={loading ? 0 : stats.macros}
          color="#8b5cf6"
          href="/admin/collections/macros"
          icon={
            <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
            </svg>
          }
        />
        <StatCard
          label="兑换记录"
          value={loading ? 0 : stats.exchanges}
          color="#06b6d4"
          href="/admin/collections/macro-exchanges"
          icon={
            <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          }
        />
      </div>

      {/* Quick Links */}
      <div>
        <h2
          style={{
            fontSize: 14,
            fontWeight: 600,
            color: '#94a3b8',
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            marginBottom: 16,
          }}
        >
          快捷入口
        </h2>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: 12,
          }}
        >
          <QuickLink
            label="发布新宏"
            description="创建新的免费或付费宏内容"
            href="/admin/collections/macros/create"
          />
          <QuickLink
            label="管理用户"
            description="查看注册用户列表与详情"
            href="/admin/collections/users"
          />
          <QuickLink
            label="处理工单"
            description="回复用户提交的客服工单"
            href="/admin/collections/tickets"
          />
          <QuickLink
            label="充值订单"
            description="查看积分充值订单记录"
            href="/admin/collections/credit-orders"
          />
          <QuickLink
            label="发送通知"
            description="向用户推送站内消息"
            href="/admin/collections/notifications/create"
          />
          <QuickLink
            label="管理文章"
            description="发布或编辑公告和教程"
            href="/admin/collections/articles"
          />
        </div>
      </div>
    </div>
  )
}
