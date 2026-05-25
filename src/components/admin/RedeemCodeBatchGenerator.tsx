'use client'

import { useState } from 'react'

type GeneratedCode = {
  id: number | string
  code: string
  creditsGranted: number
}

const CREDIT_OPTIONS = [10, 20, 50, 100, 200, 500]

export const RedeemCodeBatchGenerator = () => {
  const [creditsGranted, setCreditsGranted] = useState(100)
  const [count, setCount] = useState(10)
  const [maxRedemptions, setMaxRedemptions] = useState(1)
  const [title, setTitle] = useState('')
  const [note, setNote] = useState('')
  const [codes, setCodes] = useState<GeneratedCode[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function generate() {
    setLoading(true)
    setError('')
    setCodes([])

    try {
      const response = await fetch('/api/admin/redeem-codes/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ creditsGranted, count, maxRedemptions, title, note }),
      })
      const data = (await response.json()) as {
        success?: boolean
        data?: { codes?: GeneratedCode[] }
        error?: string
      }

      if (!response.ok || !data.success) {
        setError(data.error || '生成失败')
        return
      }

      setCodes(data.data?.codes ?? [])
    } catch {
      setError('网络错误')
    } finally {
      setLoading(false)
    }
  }

  async function copyAll() {
    if (codes.length === 0) return
    await navigator.clipboard?.writeText(codes.map((item) => item.code).join('\n'))
  }

  return (
    <section style={{
      border: '1px solid #d1d5db',
      borderRadius: 6,
      padding: '1rem',
      marginBottom: '1rem',
      background: '#fff',
    }}>
      <h3 style={{ marginTop: 0 }}>批量生成兑换码</h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '0.75rem' }}>
        <label>
          <span>点券包</span>
          <select value={creditsGranted} onChange={(event) => setCreditsGranted(Number(event.target.value))}>
            {CREDIT_OPTIONS.map((value) => (
              <option key={value} value={value}>{value} 点券</option>
            ))}
          </select>
        </label>
        <label>
          <span>生成数量</span>
          <input type="number" min={1} max={500} value={count} onChange={(event) => setCount(Number(event.target.value))} />
        </label>
        <label>
          <span>每码最大兑换次数</span>
          <input type="number" min={1} value={maxRedemptions} onChange={(event) => setMaxRedemptions(Number(event.target.value))} />
        </label>
        <label>
          <span>标题/批次名</span>
          <input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="例如：微信客服 F100 批次" />
        </label>
      </div>
      <label style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', marginTop: '0.75rem' }}>
        <span>运营备注</span>
        <textarea value={note} onChange={(event) => setNote(event.target.value)} rows={2} />
      </label>
      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginTop: '0.75rem' }}>
        <button type="button" onClick={generate} disabled={loading}>
          {loading ? '生成中...' : '生成兑换码'}
        </button>
        {codes.length > 0 && <button type="button" onClick={copyAll}>复制全部</button>}
        {error && <span style={{ color: '#b91c1c' }}>{error}</span>}
      </div>
      {codes.length > 0 && (
        <pre style={{
          marginTop: '0.75rem',
          padding: '0.75rem',
          background: '#f9fafb',
          border: '1px solid #e5e7eb',
          borderRadius: 4,
          maxHeight: 220,
          overflow: 'auto',
        }}>
          {codes.map((item) => item.code).join('\n')}
        </pre>
      )}
    </section>
  )
}
