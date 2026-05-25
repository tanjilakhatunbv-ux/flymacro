import type { CollectionConfig } from 'payload'
import { isOperatorOrAbove, isSuperAdmin } from '../lib/access'

export const CreditPackages: CollectionConfig = {
  slug: 'credit-packages',
  labels: { singular: '点券包', plural: '点券包' },
  admin: {
    useAsTitle: 'label',
    defaultColumns: ['label', 'amount', 'originalAmount', 'creditsGranted', 'enabled', 'sort'],
    group: '商务',
    description: '点券包配置。点券数固定，价格通过原价和优惠价展示，Creem 商品由运营后台维护。',
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
      admin: { description: '例如：100 点券包' },
    },
    {
      name: 'amount',
      type: 'number',
      required: true,
      label: '优惠价 / 实付金额（元）',
      min: 0,
    },
    {
      name: 'originalAmount',
      type: 'number',
      label: '原价（仅展示）',
      min: 0,
      admin: {
        description: '划线显示的原价，仅用于前台展示；需大于优惠价才会显示',
        position: 'sidebar',
      },
    },
    {
      name: 'creditsGranted',
      type: 'number',
      required: true,
      label: '到账点券',
      min: 0,
      admin: { description: '固定为 10 / 20 / 50 / 100 / 200 / 500 之一，不随优惠价变化' },
    },
    {
      name: 'discountLabel',
      type: 'text',
      label: '优惠标签',
      admin: {
        description: '如：限时8折、新用户特惠、VIP专享',
        position: 'sidebar',
      },
    },
    {
      name: 'badge',
      type: 'select',
      label: '角标',
      defaultValue: 'none',
      options: [
        { label: '无', value: 'none' },
        { label: '热卖', value: 'hot' },
        { label: '推荐', value: 'recommended' },
        { label: '新品', value: 'new' },
      ],
      admin: { position: 'sidebar' },
    },
    {
      name: 'creemProductId',
      type: 'text',
      required: true,
      label: 'Creem 产品 ID',
      admin: { description: '在 Creem.io 后台创建的对应产品 ID' },
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
