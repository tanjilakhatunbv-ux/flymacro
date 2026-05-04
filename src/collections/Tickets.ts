import type { CollectionConfig } from 'payload'
import { isAuthenticated, isOwnerOrStaff, isSuperAdmin } from '../lib/access'

export const Tickets: CollectionConfig = {
  slug: 'tickets',
  admin: {
    useAsTitle: 'subject',
    defaultColumns: ['subject', 'user', 'status', 'priority', 'assignee', 'updatedAt'],
    group: '客服',
  },
  access: {
    read: isOwnerOrStaff,
    create: isAuthenticated,
    update: ({ req: { user } }) => {
      if (!user) return false
      if (user.role === 'super-admin' || user.role === 'operator' || user.role === 'support') return true
      return { user: { equals: user.id } }
    },
    delete: isSuperAdmin,
  },
  fields: [
    { name: 'subject', type: 'text', required: true, label: '主题' },
    {
      name: 'user',
      type: 'relationship',
      relationTo: 'users',
      required: true,
      index: true,
      defaultValue: ({ user }) => user?.id,
      access: {
        update: () => false,
      },
    },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'open',
      options: [
        { label: '待处理', value: 'open' },
        { label: '处理中', value: 'in-progress' },
        { label: '已解决', value: 'resolved' },
        { label: '已关闭', value: 'closed' },
      ],
      index: true,
    },
    {
      name: 'priority',
      type: 'select',
      defaultValue: 'normal',
      options: [
        { label: '低', value: 'low' },
        { label: '普通', value: 'normal' },
        { label: '高', value: 'high' },
        { label: '紧急', value: 'urgent' },
      ],
    },
    {
      name: 'category',
      type: 'select',
      options: [
        { label: '退款申请', value: 'refund' },
        { label: '宏使用问题', value: 'usage' },
        { label: '账号问题', value: 'account' },
        { label: '建议反馈', value: 'feedback' },
        { label: '其他', value: 'other' },
      ],
    },
    {
      name: 'relatedMacro',
      type: 'relationship',
      relationTo: 'macros',
      label: '相关宏',
    },
    {
      name: 'relatedOrder',
      type: 'relationship',
      relationTo: 'credit-orders',
      label: '相关订单',
    },
    {
      name: 'assignee',
      type: 'relationship',
      relationTo: 'users',
      label: '指派给',
      filterOptions: () => ({
        role: { in: ['super-admin', 'operator', 'support'] },
      }),
      access: {
        update: ({ req: { user } }) =>
          !!user && (user.role === 'super-admin' || user.role === 'operator'),
      },
    },
    {
      name: 'closedAt',
      type: 'date',
      admin: { position: 'sidebar' },
      access: { update: () => true, create: () => false },
    },
  ],
  timestamps: true,
}
