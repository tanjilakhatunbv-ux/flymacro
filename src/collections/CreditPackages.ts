import type { CollectionConfig } from 'payload'
import { isOperatorOrAbove, isSuperAdmin } from '../lib/access'

export const CreditPackages: CollectionConfig = {
  slug: 'credit-packages',
  admin: {
    useAsTitle: 'label',
    defaultColumns: ['label', 'amount', 'creditsGranted', 'enabled', 'sort'],
    group: '商务',
  },
  access: {
    read: () => true,
    create: isOperatorOrAbove,
    update: isOperatorOrAbove,
    delete: isSuperAdmin,
  },
  fields: [
    {
      name: 'label',
      type: 'text',
      required: true,
      label: '显示名称',
      admin: { description: '例如：充值 100 元得 110 积分' },
    },
    {
      name: 'amount',
      type: 'number',
      required: true,
      label: '支付金额（元）',
      min: 0,
    },
    {
      name: 'creditsGranted',
      type: 'number',
      required: true,
      label: '获得积分',
      min: 0,
      admin: { description: '例如充 100 元送 10 积分，则填 110' },
    },
    {
      name: 'dodoProductId',
      type: 'text',
      required: true,
      label: 'DodoPayments 产品 ID',
      admin: { description: '在 DodoPayments 后台创建的对应价格产品 ID' },
    },
    {
      name: 'currency',
      type: 'select',
      required: true,
      defaultValue: 'CNY',
      options: [
        { label: '人民币 CNY', value: 'CNY' },
        { label: '美元 USD', value: 'USD' },
      ],
    },
    {
      name: 'enabled',
      type: 'checkbox',
      defaultValue: true,
      label: '启用',
    },
    {
      name: 'sort',
      type: 'number',
      defaultValue: 0,
      label: '排序',
    },
  ],
  timestamps: true,
}
