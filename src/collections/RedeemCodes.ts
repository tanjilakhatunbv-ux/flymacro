import type { CollectionBeforeChangeHook, CollectionConfig } from 'payload'
import { isAdmin, isOperatorOrAbove } from '../lib/access'
import {
  REDEEM_CODE_CREDIT_OPTIONS,
  assertRedeemCodeMatchesCredits,
  normalizeRedeemCode,
} from '../lib/redeem-code-rules'

const validateRedeemCode: CollectionBeforeChangeHook = async ({
  data,
  originalDoc,
  operation,
}) => {
  if (!data) return data

  const incomingCode = typeof data.code === 'string' ? normalizeRedeemCode(data.code) : undefined
  const code = incomingCode ?? originalDoc?.code
  const creditsGranted = Number(data.creditsGranted ?? originalDoc?.creditsGranted)
  const redeemedCount = Number(originalDoc?.redeemedCount ?? data.redeemedCount ?? 0)
  const maxRedemptions = Number(data.maxRedemptions ?? originalDoc?.maxRedemptions ?? 1)

  if (incomingCode) {
    data.code = incomingCode
  }

  if (code && creditsGranted) {
    assertRedeemCodeMatchesCredits(code, creditsGranted)
  }

  if (maxRedemptions < redeemedCount) {
    throw new Error('最大兑换次数不能小于已兑换次数')
  }

  if (operation === 'update' && redeemedCount > 0 && originalDoc) {
    if (data.code && data.code !== originalDoc.code) {
      throw new Error('已兑换过的兑换码不能修改码值')
    }
    if (
      data.creditsGranted !== undefined &&
      Number(data.creditsGranted) !== Number(originalDoc.creditsGranted)
    ) {
      throw new Error('已兑换过的兑换码不能修改点券额度')
    }
  }

  return data
}

export const RedeemCodes: CollectionConfig = {
  slug: 'redeem-codes',
  labels: { singular: '兑换码', plural: '兑换码' },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['code', 'creditsGranted', 'redeemedCount', 'maxRedemptions', 'enabled', 'title', 'createdAt'],
    group: '商务',
    description: '点券兑换码管理。支持一次性单码和通用码，可批量生成并查询兑换情况。',
    listSearchableFields: ['code', 'title', 'note'],
    components: {
      beforeList: ['@/components/admin/RedeemCodeBatchGenerator#RedeemCodeBatchGenerator'],
    },
  },
  access: {
    read: isOperatorOrAbove,
    create: isOperatorOrAbove,
    update: isOperatorOrAbove,
    delete: isAdmin,
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
      label: '标题/批次名',
      admin: { description: '例如：微信客服补偿、五一活动 F100 批次' },
    },
    {
      name: 'code',
      type: 'text',
      required: true,
      unique: true,
      index: true,
      label: '兑换码',
      admin: {
        components: {
          Cell: '@/components/admin/RedeemCodeCell#RedeemCodeCell',
          Field: '@/components/admin/RedeemCodeField#RedeemCodeField',
        },
        description: '前缀必须匹配点券额度：F010/F020/F050/F100/F200/F500',
      },
    },
    {
      name: 'creditsGranted',
      type: 'select',
      required: true,
      label: '点券额度',
      options: REDEEM_CODE_CREDIT_OPTIONS.map((option) => ({
        label: option.label,
        value: String(option.value),
      })),
      admin: { description: '只支持固定点券包，必须与兑换码前缀一致。' },
    },
    {
      name: 'maxRedemptions',
      type: 'number',
      required: true,
      defaultValue: 1,
      min: 1,
      label: '最大兑换次数',
      admin: { description: '一次性单码填 1；通用码填总可兑换次数。' },
    },
    {
      name: 'redeemedCount',
      type: 'number',
      required: true,
      defaultValue: 0,
      min: 0,
      label: '已兑换次数',
      admin: { readOnly: true },
    },
    {
      name: 'enabled',
      type: 'checkbox',
      defaultValue: true,
      label: '启用',
      admin: { position: 'sidebar' },
    },
    {
      name: 'note',
      type: 'textarea',
      label: '运营备注',
    },
  ],
  hooks: {
    beforeChange: [validateRedeemCode],
  },
  timestamps: true,
}
