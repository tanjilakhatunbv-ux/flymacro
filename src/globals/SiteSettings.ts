import type { GlobalConfig } from 'payload'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { isOperatorOrAbove } from '../lib/access'

export const SiteSettings: GlobalConfig = {
  slug: 'site-settings',
  label: '站点设置',
  admin: {
    group: '设置',
    description: '全局运营配置：点券页面文案、活动横幅、购买须知等。',
  },
  access: {
    read: () => true,
    update: isOperatorOrAbove,
  },
  fields: [
    {
      type: 'group',
      name: 'creditPage',
      label: '点券页面设置',
      admin: {
        description: '控制前台 /credits 页面的标题、副标题、活动横幅与购买须知。',
      },
      fields: [
        {
          name: 'title',
          type: 'text',
          label: '页面标题',
          defaultValue: '购买点券',
        },
        {
          name: 'subtitle',
          type: 'text',
          label: '副标题',
          defaultValue: '购买点券后，可用于兑换宏脚本。',
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
            description: '例如：新用户点券包加赠、限时全场8折',
            condition: (_, sib) => sib?.promoEnabled === true,
          },
        },
        {
          name: 'noticeEnabled',
          type: 'checkbox',
          defaultValue: true,
          label: '显示购买须知',
        },
        {
          name: 'notice',
          type: 'richText',
          label: '购买须知内容',
          editor: lexicalEditor({}),
          admin: {
            description: '留空则使用系统默认购买须知',
            condition: (_, sib) => sib?.noticeEnabled === true,
          },
        },
      ],
    },
  ],
}
