import type { CollectionConfig } from 'payload'
import { isOwnerOrStaff, isSuperAdmin } from '../lib/access'

const buildLabel = (data: Record<string, unknown> | undefined): string => {
  const type = (data?.type as string) ?? 'unknown'
  const amount = Number(data?.amount ?? 0)
  const sign = amount >= 0 ? '+' : ''
  return `${type} ${sign}${amount}积分`
}

export const CreditTransactions: CollectionConfig = {
  slug: 'credit-transactions',
  admin: {
    useAsTitle: 'label',
    defaultColumns: ['label', 'user', 'amount', 'balanceAfter', 'type', 'createdAt'],
    group: '商务',
    description: '积分流水。仅由系统程序化创建，所有字段只读，用作对账依据。',
  },
  access: {
    read: isOwnerOrStaff,
    create: () => false,
    update: () => false,
    delete: isSuperAdmin,
  },
  fields: [
    {
      name: 'label',
      type: 'text',
      label: '摘要',
      admin: { readOnly: true, description: '系统自动生成的列表显示标题' },
      hooks: {
        beforeChange: [({ data }) => buildLabel(data)],
        afterRead: [({ value, data }) => (typeof value === 'string' && value) || buildLabel(data)],
      },
    },
    { name: 'user', type: 'relationship', relationTo: 'users', required: true, index: true, label: '用户' },
    {
      name: 'amount',
      type: 'number',
      required: true,
      label: '变动数值',
      admin: { readOnly: true, description: '正数=增加，负数=减少' },
    },
    {
      name: 'balanceAfter',
      type: 'number',
      required: true,
      label: '变动后余额',
      admin: { readOnly: true },
    },
    {
      name: 'type',
      type: 'select',
      required: true,
      label: '类型',
      options: [
        { label: '注册奖励', value: 'register_bonus' },
        { label: '充值', value: 'recharge' },
        { label: '兑换宏', value: 'exchange' },
        { label: '自动续费', value: 'renew' },
        { label: '退款', value: 'refund' },
        { label: '运营调整', value: 'admin_adjust' },
      ],
      admin: { readOnly: true },
    },
    {
      name: 'relatedOrder',
      type: 'relationship',
      relationTo: 'credit-orders',
      label: '关联充值订单',
      admin: { readOnly: true },
    },
    {
      name: 'relatedExchange',
      type: 'relationship',
      relationTo: 'macro-exchanges',
      label: '关联兑换记录',
      admin: { readOnly: true },
    },
    { name: 'reason', type: 'text', label: '描述', admin: { readOnly: true } },
  ],
  timestamps: true,
}
