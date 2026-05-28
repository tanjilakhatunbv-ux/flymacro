import { getPayload } from './payload'
import type { Ticket, TicketMessage } from '../payload-types'

export type AccountTicketDetail = {
  ticket: Ticket
  messages: TicketMessage[]
}

export async function getAccountTickets(userId: number): Promise<Ticket[]> {
  const payload = await getPayload()

  const result = await payload.find({
    collection: 'tickets',
    where: { user: { equals: userId } },
    sort: '-updatedAt',
    limit: 50,
    depth: 0,
    overrideAccess: true,
  })

  return result.docs as Ticket[]
}

export async function getAccountTicketDetail(userId: number, ticketId: string): Promise<AccountTicketDetail | null> {
  const payload = await getPayload()

  let ticket: Ticket | null = null
  try {
    ticket = (await payload.findByID({
      collection: 'tickets',
      id: ticketId,
      overrideAccess: true,
      depth: 0,
    })) as Ticket | null
  } catch {
    ticket = null
  }

  if (!ticket) return null

  const ownerId = typeof ticket.user === 'object' ? ticket.user?.id : ticket.user
  if (String(ownerId) !== String(userId)) return null

  const messagesResult = await payload.find({
    collection: 'ticket-messages',
    where: {
      and: [
        { ticket: { equals: ticketId } },
        { isInternalNote: { not_equals: true } },
      ],
    },
    sort: 'createdAt',
    limit: 200,
    depth: 0,
    overrideAccess: true,
  })

  return {
    ticket,
    messages: messagesResult.docs as TicketMessage[],
  }
}
