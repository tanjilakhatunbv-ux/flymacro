export function authLoginUrl(message?: string): string {
  const params = new URLSearchParams({ mode: 'login' })
  if (message) {
    params.set('error', 'oauth')
    params.set('message', message)
  }
  return `/auth?${params.toString()}`
}
