'use client'

import { useField } from '@payloadcms/ui'

const STATUS_COLORS: Record<string, { bg: string; text: string; label: string }> = {
  active: { bg: '#dcfce7', text: '#166534', label: '正常' },
  suspended: { bg: '#fef9c3', text: '#854d0e', label: '停用' },
  banned: { bg: '#fecaca', text: '#991b1b', label: '已封禁' },
}

export const StatusField = ({ path }: { path: string }) => {
  const { value, setValue } = useField<string>({ path })
  const current = value ?? 'active'
  const style = STATUS_COLORS[current] || STATUS_COLORS.active

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
      <span
        style={{
          display: 'inline-block',
          padding: '0.25rem 0.75rem',
          borderRadius: 9999,
          fontSize: '0.85rem',
          fontWeight: 600,
          background: style.bg,
          color: style.text,
        }}
      >
        {style.label}
      </span>
      <select
        value={current}
        onChange={(e) => setValue(e.target.value)}
        style={{
          padding: '0.35rem 0.5rem',
          border: '1px solid #ddd',
          borderRadius: 4,
          fontSize: '0.85rem',
        }}
      >
        <option value="active">正常</option>
        <option value="suspended">停用</option>
        <option value="banned">已封禁</option>
      </select>
    </div>
  )
}
