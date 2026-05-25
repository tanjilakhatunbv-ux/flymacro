import type { CollectionConfig } from 'payload'
import { isOwnerOrStaff, isStaff } from '../lib/access'

export const RedeemCodeRedemptions: CollectionConfig = {
  slug: 'redeem-code-redemptions',
  labels: { singular: '兑换码记录', plural: '兑换码记录' },
  admin: {
    useAsTitle: 'label',
    defaultColumns: ['createdAt', 'user', 'redeemCode', 'creditsGranted', 'balanceBefore', 'balanceAfter'],
    group: '商务',
    description: '用户兑换码使用记录。账务字段只读，仅允许后台编辑备注。',
    listSearchableFields: ['label', 'adminNote'],
  },
  access: {
    read: isOwnerOrStaff,
    create: () => false,
    update: isStaff,
    delete: () => false,
  },
  fields: [
    {
      name: 'label',
      type: 'text',
      label: '摘要',
      admin: { readOnly: true },
      hooks: {
        beforeChange: [
          ({ data }) => {
            const credits = Number(data?.creditsGranted ?? 0)
            return `兑换码 +${credits} 点券`
          },
        ],
      },
    },
    {
      name: 'user',
      type: 'relationship',
      relationTo: 'users',
      required: true,
      index: true,
      label: '用户',
      access: { update: () => false },
      admin: { readOnly: true },
    },
    {
      name: 'redeemCode',
      type: 'relationship',
      relationTo: 'redeem-codes',
      required: true,
      index: true,
      label: '兑换码',
      access: { update: () => false },
      admin: { readOnly: true },
    },
    {
      name: 'creditsGranted',
      type: 'number',
      required: true,
      index: true,
      label: '点券数',
      access: { update: () => false },
      admin: { readOnly: true },
    },
    {
      name: 'balanceBefore',
      type: 'number',
      required: true,
      label: '兑换前余额',
      access: { update: () => false },
      admin: { readOnly: true },
    },
    {
      name: 'balanceAfter',
      type: 'number',
      required: true,
      label: '兑换后余额',
      access: { update: () => false },
      admin: { readOnly: true },
    },
    {
      name: 'adminNote',
      type: 'textarea',
      label: '后台备注',
    },
  ],
  timestamps: true,
}
