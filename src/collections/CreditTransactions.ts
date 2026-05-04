import type { CollectionConfig } from 'payload'
import { isOwnerOrStaff, isSuperAdmin } from '../lib/access'

export const CreditTransactions: CollectionConfig = {
  slug: 'credit-transactions',
  admin: {
    useAsTitle: 'id',
    defaultColumns: ['user', 'amount', 'balanceAfter', 'type', 'createdAt'],
    group: '商务',
  },
  access: {
    read: isOwnerOrStaff,
    create: () => false,
    update: () => false,
    delete: isSuperAdmin,
  },
  fields: [
    { name: 'user', type: 'relationship', relationTo: 'users', required: true, index: true },
    {
      name: 'amount',
      type: 'number',
      required: true,
      label: '变动数值',
      admin: { description: '正数=增加，负数=减少' },
    },
    {
      name: 'balanceAfter',
      type: 'number',
      required: true,
      label: '变动后余额',
    },
    {
      name: 'type',
      type: 'select',
      required: true,
      options: [
        { label: '注册奖励', value: 'register_bonus' },
        { label: '充值', value: 'recharge' },
        { label: '兑换宏', value: 'exchange' },
        { label: '自动续费', value: 'renew' },
        { label: '退款', value: 'refund' },
        { label: '运营调整', value: 'admin_adjust' },
      ],
    },
    {
      name: 'relatedOrder',
      type: 'relationship',
      relationTo: 'credit-orders',
      label: '关联充值订单',
    },
    {
      name: 'relatedExchange',
      type: 'relationship',
      relationTo: 'macro-exchanges',
      label: '关联兑换记录',
    },
    { name: 'reason', type: 'text', label: '描述' },
  ],
  timestamps: true,
}
