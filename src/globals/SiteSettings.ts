import type { GlobalConfig } from 'payload'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { isOperatorOrAbove } from '../lib/access'

export const SiteSettings: GlobalConfig = {
  slug: 'site-settings',
  label: '站点设置',
  admin: {
    group: '设置',
    description: '全局运营配置：充值页面文案、活动横幅、充值须知等。',
  },
  access: {
    read: () => true,
    update: isOperatorOrAbove,
  },
  fields: [
    {
      type: 'group',
      name: 'creditPage',
      label: '充值页面设置',
      admin: {
        description: '控制前台 /credits 页面的标题、副标题、活动横幅与充值须知。',
      },
      fields: [
        {
          name: 'title',
          type: 'text',
          label: '页面标题',
          defaultValue: '充值积分',
        },
        {
          name: 'subtitle',
          type: 'text',
          label: '副标题',
          defaultValue: '登录后即可充值积分，兑换宏使用权。',
        },
        {
          name: 'promoEnabled',
          type: 'checkbox',
          defaultValue: false,
          label: '显示活动横幅',
          admin: { description: '开启后在页面顶部显示活动横幅条' },
        },
        {
          name: 'promoBanner',
          type: 'text',
          label: '活动横幅文案',
          admin: {
            description: '例如：新用户首充双倍积分、限时全场8折',
            condition: (_, sib) => sib?.promoEnabled === true,
          },
        },
        {
          name: 'noticeEnabled',
          type: 'checkbox',
          defaultValue: true,
          label: '显示充值须知',
        },
        {
          name: 'notice',
          type: 'richText',
          label: '充值须知内容',
          editor: lexicalEditor({}),
          admin: {
            description: '留空则使用系统默认充值须知',
            condition: (_, sib) => sib?.noticeEnabled === true,
          },
        },
      ],
    },
  ],
}
