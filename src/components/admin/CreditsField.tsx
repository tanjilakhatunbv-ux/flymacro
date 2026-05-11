'use client'

import { useState } from 'react'
import { useField } from '@payloadcms/ui'

export const CreditsField = ({ path }: { path: string }) => {
  const { value } = useField<number>({ path })
  const [open, setOpen] = useState(false)
  const [amount, setAmount] = useState('')
  const [reason, setReason] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleAdjust() {
    const num = parseInt(amount, 10)
    if (!num || num === 0) {
      setError('请输入非零整数')
      return
    }

    setLoading(true)
    setError('')

    try {
      const segments = window.location.pathname.split('/')
      const docId = segments[segments.length - 1]

      const res = await fetch('/api/admin/adjust-credits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ userId: parseInt(docId, 10), amount: num, reason }),
      })

      const data = await res.json()
      if (!res.ok) {
        setError(data.error || '操作失败')
        return
      }

      // Reload to reflect updated credits
      window.location.reload()
    } catch {
      setError('网络错误')
    } finally {
      setLoading(false)
    }
  }

  const credits = value ?? 0

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
        <span style={{ fontSize: '1.6rem', fontWeight: 700, color: '#10b981' }}>{credits}</span>
        <button
          type="button"
          style={{
            padding: '0.35rem 0.75rem',
            background: '#6366f1',
            color: '#fff',
            border: 'none',
            borderRadius: 4,
            cursor: 'pointer',
            fontSize: '0.85rem',
          }}
          onClick={() => setOpen(true)}
        >
          调整积分
        </button>
      </div>

      {open && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
          }}
          onClick={(e) => { if (e.target === e.currentTarget) { setOpen(false); setError('') } }}
        >
          <div
            style={{
              background: '#fff',
              borderRadius: 8,
              padding: '1.5rem',
              width: 400,
              maxWidth: '90vw',
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem',
            }}
          >
            <h3 style={{ margin: 0 }}>调整积分</h3>
            <p style={{ margin: 0, color: '#666', fontSize: '0.9rem' }}>
              当前积分: <strong>{credits}</strong>
            </p>
            <label style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 500 }}>调整数量（正数增加，负数扣除）</span>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                style={{ padding: '0.5rem', border: '1px solid #ddd', borderRadius: 4 }}
              />
            </label>
            <label style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 500 }}>调整原因</span>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={3}
                style={{ padding: '0.5rem', border: '1px solid #ddd', borderRadius: 4, resize: 'vertical' }}
              />
            </label>
            {error && <p style={{ color: 'red', margin: 0, fontSize: '0.85rem' }}>{error}</p>}
            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => { setOpen(false); setError('') }}
                style={{ padding: '0.4rem 1rem', border: '1px solid #ddd', borderRadius: 4, background: '#fff', cursor: 'pointer' }}
              >
                取消
              </button>
              <button
                type="button"
                onClick={handleAdjust}
                disabled={loading}
                style={{
                  padding: '0.4rem 1rem',
                  border: 'none',
                  borderRadius: 4,
                  background: '#6366f1',
                  color: '#fff',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  opacity: loading ? 0.6 : 1,
                }}
              >
                {loading ? '处理中...' : '确认调整'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
