export const FALLBACK_GUIDES: Record<
  string,
  { title: string; summary: string; body: any }
> = {
  'how-to-use-macro': {
    title: '宏代码使用指南',
    summary:
      '兑换宏后如何复制代码并在游戏中使用，包括宏编辑器的打开方式和常见注意事项。',
    body: {
      root: {
        type: 'root',
        format: '',
        indent: 0,
        version: 1,
        direction: 'ltr',
        children: [
          {
            type: 'paragraph',
            format: '',
            indent: 0,
            version: 1,
            direction: 'ltr',
            children: [
              {
                mode: 'normal',
                text: '## 打开宏编辑器',
                type: 'text',
                style: '',
                detail: 0,
                format: 1,
                version: 1,
              },
            ],
          },
          {
            type: 'paragraph',
            format: '',
            indent: 0,
            version: 1,
            direction: 'ltr',
            children: [
              {
                mode: 'normal',
                text: '在游戏中按下 ESC 键，选择「宏命令设置」，或者直接在聊天框输入 /macro 回车。',
                type: 'text',
                style: '',
                detail: 0,
                format: 0,
                version: 1,
              },
            ],
          },
          {
            type: 'paragraph',
            format: '',
            indent: 0,
            version: 1,
            direction: 'ltr',
            children: [
              {
                mode: 'normal',
                text: '## 创建新宏',
                type: 'text',
                style: '',
                detail: 0,
                format: 1,
                version: 1,
              },
            ],
          },
          {
            type: 'paragraph',
            format: '',
            indent: 0,
            version: 1,
            direction: 'ltr',
            children: [
              {
                mode: 'normal',
                text: '1. 点击「新建」按钮\n2. 选择一个图标（建议选择第一个问号图标，会自动显示技能图标）\n3. 输入宏名称\n4. 将 FlyMacro 提供的代码完整复制到编辑框中\n5. 点击「保存」',
                type: 'text',
                style: '',
                detail: 0,
                format: 0,
                version: 1,
              },
            ],
          },
          {
            type: 'paragraph',
            format: '',
            indent: 0,
            version: 1,
            direction: 'ltr',
            children: [
              {
                mode: 'normal',
                text: '## 拖放技能栏',
                type: 'text',
                style: '',
                detail: 0,
                format: 1,
                version: 1,
              },
            ],
          },
          {
            type: 'paragraph',
            format: '',
            indent: 0,
            version: 1,
            direction: 'ltr',
            children: [
              {
                mode: 'normal',
                text: '保存后，将宏图标拖动到技能栏的任意位置。建议放在容易按到的按键上，例如数字键 1-6 或鼠标侧键。',
                type: 'text',
                style: '',
                detail: 0,
                format: 0,
                version: 1,
              },
            ],
          },
          {
            type: 'paragraph',
            format: '',
            indent: 0,
            version: 1,
            direction: 'ltr',
            children: [
              {
                mode: 'normal',
                text: '## 注意事项',
                type: 'text',
                style: '',
                detail: 0,
                format: 1,
                version: 1,
              },
            ],
          },
          {
            type: 'paragraph',
            format: '',
            indent: 0,
            version: 1,
            direction: 'ltr',
            children: [
              {
                mode: 'normal',
                text: '• 复制代码时请确保完整复制，不要遗漏开头或结尾的字符\n• 如果宏包含条件判断（如 [mod:shift]），请按照说明使用对应的按键组合\n• 部分高级宏需要配合特定插件使用，详情见宏页面说明\n• 遇到问题时，可以通过工单系统联系客服',
                type: 'text',
                style: '',
                detail: 0,
                format: 0,
                version: 1,
              },
            ],
          },
        ],
      },
    },
  },
}
