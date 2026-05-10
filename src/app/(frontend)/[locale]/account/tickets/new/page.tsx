import type { Metadata } from 'next'
import { TicketCreateForm } from '../../../../../../components/TicketForms'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: '提交工单 — FlyMacro',
}

export default function NewTicketPage() {
  return (
    <>
      <h1>提交工单</h1>
      <p className="lead">描述你遇到的问题，我们的客服会在 24 小时内回复。</p>
      <TicketCreateForm />
    </>
  )
}
