'use client'

import React from 'react'
import { useRowLabel } from '@payloadcms/ui'

export const TagRowLabel: React.FC = () => {
  const { data, rowNumber } = useRowLabel<{ value?: string }>()
  const label = data?.value?.trim() || `标签 ${String((rowNumber ?? 0) + 1).padStart(2, '0')}`
  return <span>{label}</span>
}
