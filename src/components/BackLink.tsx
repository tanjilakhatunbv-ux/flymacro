'use client'

import Link from 'next/link'

export function BackLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <div className="back-link-wrap">
      <Link href={href} className="back-link">
        ← {children}
      </Link>
    </div>
  )
}
