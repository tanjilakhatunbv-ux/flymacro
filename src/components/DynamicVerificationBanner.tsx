'use client'

import dynamic from 'next/dynamic'

export const DynamicVerificationBanner = dynamic(
  () => import('./VerificationBanner').then((m) => m.VerificationBanner),
  { ssr: false },
)
