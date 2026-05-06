import type { CollectionConfig } from 'payload'
import { isOperatorOrAbove, isSuperAdmin } from '../lib/access'

export const Notifications: CollectionConfig = {
  slug: 'notifications',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'recipient', 'category', 'read', 'createdAt'],
    group: '客服',
    description: '站内通知。可按系统、订单、工单、促销分类。',
    listSearchableFields: ['title', 'body'],
  },
  access: {
    read: ({ req: { user } }) => {
      if (!user) return false
      if (user.role === 'super-admin' || user.role === 'operator' || user.role === 'support') return true
      return { recipient: { equals: user.id } }
    },
    create: isOperatorOrAbove,
    update: ({ req: { user } }) => {
      if (!user) return false
      if (user.role === 'super-admin' || user.role === 'operator') return true
      return { recipient: { equals: user.id } }
    },
    delete: isSuperAdmin,
  },
  fields: [
    {
      name: 'recipient',
      type: 'relationship',
      relationTo: 'users',
      required: true,
      index: true,
    },
    { name: 'title', type: 'text', required: true },
    { name: 'body', type: 'textarea' },
    { name: 'link', type: 'text', admin: { description: '点击通知后跳转的站内链接' } },
    {
      name: 'category',
      type: 'select',
      defaultValue: 'system',
      options: [
        { label: '系统', value: 'system' },
        { label: '订单', value: 'order' },
        { label: '工单回复', value: 'ticket' },
        { label: '促销', value: 'promotion' },
      ],
    },
    { name: 'read', type: 'checkbox', defaultValue: false, index: true },
    { name: 'readAt', type: 'date' },
  ],
  timestamps: true,
}
