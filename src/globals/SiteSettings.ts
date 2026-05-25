import type { Field, GlobalConfig } from 'payload'
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
    {
      type: 'group',
      name: 'contactPage',
      label: '联系方式页面设置',
      admin: {
        description: '控制前台 /contact 页面展示的联系渠道和开启状态。',
      },
      fields: [
        {
          name: 'enabled',
          type: 'checkbox',
          defaultValue: true,
          label: '启用联系方式页面渠道展示',
        },
        {
          type: 'row',
          fields: [
            {
              name: 'email',
              type: 'group',
              label: 'Email',
              fields: contactChannelFields('邮箱地址', false, true),
            },
            {
              name: 'telegram',
              type: 'group',
              label: 'Telegram',
              fields: contactChannelFields('Telegram 显示名称或链接', true, true),
            },
          ],
        },
        {
          type: 'row',
          fields: [
            {
              name: 'discord',
              type: 'group',
              label: 'Discord',
              fields: contactChannelFields('Discord 邀请链接或服务器名', true, false),
            },
            {
              name: 'qq',
              type: 'group',
              label: 'QQ',
              fields: contactChannelFields('QQ 号或 QQ 群号', false, false),
            },
          ],
        },
      ],
    },
  ],
}

function contactChannelFields(valueLabel: string, includeUrl: boolean, enabledByDefault: boolean): Field[] {
  const enabledCondition = (_: unknown, siblingData: { enabled?: boolean } | undefined) => siblingData?.enabled === true

  return [
    {
      name: 'enabled',
      type: 'checkbox',
      defaultValue: enabledByDefault,
      label: '启用',
    },
    {
      name: 'value',
      type: 'text',
      label: valueLabel,
      admin: {
        condition: enabledCondition,
      },
    },
    ...(includeUrl
      ? ([
          {
            name: 'url',
            type: 'text',
            label: '跳转链接',
            admin: {
              condition: enabledCondition,
            },
          },
        ] satisfies Field[])
      : []),
    {
      name: 'note',
      type: 'text',
      label: '说明',
      admin: {
        condition: enabledCondition,
      },
    },
  ]
}
