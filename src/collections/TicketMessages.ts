import type { CollectionConfig } from 'payload'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { isStaff, isSuperAdmin } from '../lib/access'

const richTextToPreview = (body: unknown, limit = 40): string => {
  try {
    const root = (body as { root?: { children?: unknown[] } })?.root
    if (!root?.children) return ''
    const collect = (nodes: unknown[]): string => {
      let out = ''
      for (const n of nodes) {
        const node = n as { text?: string; children?: unknown[] }
        if (typeof node.text === 'string') out += node.text
        if (Array.isArray(node.children)) out += collect(node.children)
        if (out.length >= limit) break
      }
      return out
    }
    const text = collect(root.children).trim()
    return text.length > limit ? text.slice(0, limit) + '…' : text
  } catch {
    return ''
  }
}

const buildMessageLabel = (data: Record<string, unknown> | undefined): string => {
  const senderType = (data?.senderType as string) ?? 'user'
  const isInternal = data?.isInternalNote ? '【内部】' : ''
  const preview = richTextToPreview(data?.body) || '(空消息)'
  return `${isInternal}[${senderType}] ${preview}`
}

export const TicketMessages: CollectionConfig = {
  slug: 'ticket-messages',
  admin: {
    useAsTitle: 'label',
    defaultColumns: ['label', 'ticket', 'sender', 'senderType', 'isInternalNote', 'createdAt'],
    group: '客服',
    description: '工单消息。每条消息可标记为内部备注（用户不可见）。',
  },
  access: {
    read: ({ req: { user } }) => {
      if (!user) return false
      if (user.role === 'super-admin' || user.role === 'operator' || user.role === 'support') return true
      return { sender: { equals: user.id } }
    },
    create: async ({ req: { user, payload }, data }) => {
      if (!user) return false
      if (user.role === 'super-admin' || user.role === 'operator' || user.role === 'support') return true
      const ticketId = (data as any)?.ticket
      if (!ticketId) return false
      try {
        const ticket = await payload.findByID({ collection: 'tickets', id: ticketId, depth: 0 })
        return (ticket as any)?.user === user.id
      } catch {
        return false
      }
    },
    update: isStaff,
    delete: isSuperAdmin,
  },
  fields: [
    {
      name: 'label',
      type: 'text',
      label: '摘要',
      admin: { readOnly: true, description: '系统自动生成的列表显示标题，方便客服快速识别消息内容' },
      hooks: {
        beforeChange: [({ data }) => buildMessageLabel(data)],
        afterRead: [({ value, data }) => (typeof value === 'string' && value) || buildMessageLabel(data)],
      },
    },
    {
      name: 'ticket',
      type: 'relationship',
      relationTo: 'tickets',
      required: true,
      index: true,
      label: '所属工单',
    },
    {
      name: 'sender',
      type: 'relationship',
      relationTo: 'users',
      required: true,
      label: '发送者',
      defaultValue: ({ user }) => user?.id,
      access: { update: () => false },
    },
    {
      name: 'senderType',
      type: 'select',
      required: true,
      defaultValue: 'user',
      label: '发送者类型',
      options: [
        { label: '用户', value: 'user' },
        { label: '客服', value: 'staff' },
      ],
    },
    {
      name: 'body',
      type: 'richText',
      required: true,
      label: '消息内容',
      editor: lexicalEditor({}),
    },
    {
      name: 'attachments',
      type: 'array',
      label: '附件',
      fields: [{ name: 'file', type: 'upload', relationTo: 'media' }],
    },
    {
      name: 'isInternalNote',
      type: 'checkbox',
      defaultValue: false,
      label: '⚠️ 内部备注（用户不可见）',
      admin: {
        description: '⚠️ 警告：勾选后该消息只有客服之间可见，绝不会发送给提交工单的用户。请仔细确认！',
        position: 'sidebar',
      },
    },
  ],
  timestamps: true,
}
