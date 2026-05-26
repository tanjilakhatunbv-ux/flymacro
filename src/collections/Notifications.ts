import type { CollectionConfig } from 'payload'
import { isOperatorOrAbove, isStaffField, isSuperAdmin } from '../lib/access'

export const Notifications: CollectionConfig = {
  slug: 'notifications',
  labels: { singular: '站内通知', plural: '站内通知' },
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
      if (user.role === 'admin' || user.role === 'operator') return true
      return { recipient: { equals: user.id } }
    },
    create: isOperatorOrAbove,
    update: ({ req: { user } }) => {
      if (!user) return false
      if (user.role === 'admin' || user.role === 'operator') return true
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
      label: '接收用户',
      access: { create: isStaffField, update: isStaffField },
    },
    { name: 'title', type: 'text', required: true, label: '标题', access: { create: isStaffField, update: isStaffField } },
    { name: 'body', type: 'textarea', label: '内容', access: { create: isStaffField, update: isStaffField } },
    { name: 'link', type: 'text', label: '跳转链接', access: { create: isStaffField, update: isStaffField }, admin: { description: '点击通知后跳转的站内链接' } },
    {
      name: 'category',
      type: 'select',
      defaultValue: 'system',
      label: '分类',
      options: [
        { label: '系统', value: 'system' },
        { label: '订单', value: 'order' },
        { label: '工单回复', value: 'ticket' },
        { label: '促销', value: 'promotion' },
      ],
      access: { create: isStaffField, update: isStaffField },
    },
    { name: 'read', type: 'checkbox', defaultValue: false, label: '已读', index: true },
    { name: 'readAt', type: 'date', label: '阅读时间' },
  ],
  timestamps: true,
}
