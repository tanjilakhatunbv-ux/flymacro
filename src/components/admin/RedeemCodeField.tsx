'use client'

import { useState } from 'react'
import { useField } from '@payloadcms/ui'

export const RedeemCodeField = ({ path }: { path: string }) => {
  const { value, setValue } = useField<string>({ path })
  const [visible, setVisible] = useState(false)
  const code = value ?? ''

  async function copyCode() {
    if (!code) return
    await navigator.clipboard?.writeText(code)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
      <input
        value={code}
        onChange={(event) => setValue(event.target.value.toUpperCase())}
        style={{ padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: 4 }}
        autoComplete="off"
      />
      {code && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
          <code style={{ padding: '0.25rem 0.5rem', background: '#f3f4f6', borderRadius: 4 }}>
            {visible ? code : maskCode(code)}
          </code>
          <button type="button" onClick={() => setVisible((next) => !next)}>
            {visible ? '隐藏明文' : '查看明文'}
          </button>
          <button type="button" onClick={copyCode}>复制</button>
        </div>
      )}
    </div>
  )
}

function maskCode(code: string): string {
  if (code.length <= 8) return '****'
  return `${code.slice(0, 4)}-${'*'.repeat(4)}-${code.slice(-4)}`
}
