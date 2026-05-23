import { redirect } from 'next/navigation'

type SearchParams = Promise<{ return?: string; error?: string; message?: string }>

export default async function LoginRedirectPage({ searchParams }: { searchParams: SearchParams }) {
  const sp = await searchParams
  const params = new URLSearchParams({ mode: 'login' })
  const returnUrl = sanitizeReturnUrl(sp.return)
  if (returnUrl !== '/account') params.set('return', returnUrl)
  if (sp.error) params.set('error', sp.error)
  if (sp.message) params.set('message', sp.message)
  redirect(`/auth?${params.toString()}`)
}

function sanitizeReturnUrl(input?: string): string {
  if (!input) return '/account'
  if (!input.startsWith('/') || input.startsWith('//')) return '/account'
  return input
}
