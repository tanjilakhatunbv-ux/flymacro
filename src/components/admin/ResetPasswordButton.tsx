'use client'

import { useState } from 'react'

export const ResetPasswordButton = () => {
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  async function handleReset() {
    const segments = window.location.pathname.split('/')
    const docId = segments[segments.length - 1]
    if (!docId || docId === 'create') {
      setError('请先保存用户后再重置密码')
      return
    }

    if (!confirm('确认向该用户发送密码重置邮件？')) return

    setLoading(true)
    setError('')
    setMessage('')

    try {
      const res = await fetch('/api/admin/send-reset-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ userId: parseInt(docId, 10) }),
      })

      const data = await res.json()
      if (!res.ok) {
        setError(data.error || '操作失败')
        return
      }

      setMessage('密码重置邮件已发送')
    } catch {
      setError('网络错误')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
      <button
        type="button"
        onClick={handleReset}
        disabled={loading}
        style={{
          padding: '0.4rem 0.75rem',
          background: '#f59e0b',
          color: '#fff',
          border: 'none',
          borderRadius: 4,
          cursor: loading ? 'not-allowed' : 'pointer',
          fontSize: '0.85rem',
          opacity: loading ? 0.6 : 1,
        }}
      >
        {loading ? '发送中...' : '发送密码重置邮件'}
      </button>
      {message && <p style={{ color: '#10b981', margin: 0, fontSize: '0.8rem' }}>{message}</p>}
      {error && <p style={{ color: 'red', margin: 0, fontSize: '0.8rem' }}>{error}</p>}
    </div>
  )
}
