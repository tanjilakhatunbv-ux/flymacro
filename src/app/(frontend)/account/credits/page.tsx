import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default function AccountCreditsRedirect() {
  redirect('/credits')
}
