import { redirect } from 'next/navigation'

type SearchParams = Promise<{ return?: string }>

export default async function RegisterRedirectPage({ searchParams }: { searchParams: SearchParams }) {
  const sp = await searchParams
  const params = new URLSearchParams({ mode: 'register' })
  const returnUrl = sanitizeReturnUrl(sp.return)
  if (returnUrl !== '/account') params.set('return', returnUrl)
  redirect(`/auth?${params.toString()}`)
}

function sanitizeReturnUrl(input?: string): string {
  if (!input) return '/account'
  if (!input.startsWith('/') || input.startsWith('//')) return '/account'
  return input
}
