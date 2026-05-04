import type { CollectionConfig } from 'payload'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { isAuthenticated, isStaff, isSuperAdmin } from '../lib/access'

export const TicketMessages: CollectionConfig = {
  slug: 'ticket-messages',
  admin: {
    useAsTitle: 'id',
    defaultColumns: ['ticket', 'sender', 'senderType', 'createdAt'],
    group: '客服',
  },
  access: {
    read: ({ req: { user } }) => {
      if (!user) return false
      if (user.role === 'super-admin' || user.role === 'operator' || user.role === 'support') return true
      return { sender: { equals: user.id } }
    },
    create: isAuthenticated,
    update: isStaff,
    delete: isSuperAdmin,
  },
  fields: [
    {
      name: 'ticket',
      type: 'relationship',
      relationTo: 'tickets',
      required: true,
      index: true,
    },
    {
      name: 'sender',
      type: 'relationship',
      relationTo: 'users',
      required: true,
      defaultValue: ({ user }) => user?.id,
      access: { update: () => false },
    },
    {
      name: 'senderType',
      type: 'select',
      required: true,
      defaultValue: 'user',
      options: [
        { label: '用户', value: 'user' },
        { label: '客服', value: 'staff' },
      ],
    },
    {
      name: 'body',
      type: 'richText',
      required: true,
      editor: lexicalEditor({}),
    },
    {
      name: 'attachments',
      type: 'array',
      fields: [{ name: 'file', type: 'upload', relationTo: 'media' }],
    },
    { name: 'isInternalNote', type: 'checkbox', defaultValue: false, label: '内部备注（用户不可见）', admin: { description: '只有客服之间可见' } },
  ],
  timestamps: true,
}
