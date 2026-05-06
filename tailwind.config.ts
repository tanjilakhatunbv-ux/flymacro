import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/app/(frontend)/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/page.tsx',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#0ea5e9',
          light: '#38bdf8',
          dark: '#0284c7',
        },
        surface: {
          DEFAULT: '#ffffff',
          muted: '#f8fafc',
          deep: '#f0f4f8',
        },
        quality: {
          poor: '#9d9d9d',
          common: '#ffffff',
          uncommon: '#1eff00',
          rare: '#0070dd',
          epic: '#a335ee',
          legendary: '#ff8000',
          artifact: '#e6cc80',
        },
        wow: {
          warrior: '#C69B6D',
          paladin: '#F48CBA',
          hunter: '#AAD372',
          rogue: '#FFF468',
          priest: '#FFFFFF',
          shaman: '#0070DD',
          mage: '#3FC7EB',
          warlock: '#8788EE',
          monk: '#00FF98',
          druid: '#FF7C0A',
          demonhunter: '#A330C9',
          deathknight: '#C41E3A',
          evoker: '#33937F',
        },
        bg: {
          dark: '#f0f4f8',
          card: '#ffffff',
          elevated: '#f8fafc',
        },
      },
      fontFamily: {
        title: ['var(--font-main)'],
        body: ['var(--font-main)'],
        accent: ['var(--font-main)'],
      },
    },
  },
  plugins: [],
}

export default config
