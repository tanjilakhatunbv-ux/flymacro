import type { CollectionConfig } from 'payload'
import { isOwnerOrStaff, isStaff, isSuperAdmin } from '../lib/access'

export const CreditOrders: CollectionConfig = {
  slug: 'credit-orders',
  admin: {
    useAsTitle: 'orderNumber',
    defaultColumns: ['orderNumber', 'user', 'amount', 'creditsGranted', 'status', 'createdAt'],
    group: '商务',
  },
  access: {
    read: isOwnerOrStaff,
    create: () => false,
    update: isStaff,
    delete: isSuperAdmin,
  },
  fields: [
    { name: 'orderNumber', type: 'text', required: true, unique: true, index: true, label: '订单号' },
    { name: 'user', type: 'relationship', relationTo: 'users', required: true, index: true },
    {
      name: 'amount',
      type: 'number',
      required: true,
      label: '支付金额',
    },
    {
      name: 'currency',
      type: 'select',
      required: true,
      defaultValue: 'CNY',
      options: [
        { label: 'CNY', value: 'CNY' },
        { label: 'USD', value: 'USD' },
      ],
    },
    {
      name: 'creditsGranted',
      type: 'number',
      required: true,
      label: '获得积分',
    },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'pending',
      options: [
        { label: '待支付', value: 'pending' },
        { label: '已支付', value: 'paid' },
        { label: '失败', value: 'failed' },
      ],
      index: true,
    },
    { name: 'dodoCheckoutId', type: 'text', index: true, admin: { description: 'DodoPayments checkout session ID' } },
    { name: 'paidAt', type: 'date' },
    {
      name: 'meta',
      type: 'json',
      label: '原始 webhook payload',
      admin: { description: '调试用' },
    },
  ],
  timestamps: true,
}
