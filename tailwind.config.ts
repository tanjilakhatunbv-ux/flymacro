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
        gold: {
          DEFAULT: '#d4af37',
          light: '#f5d76e',
          dark: '#a88b2b',
        },
        parchment: {
          DEFAULT: '#f4e4bc',
          dark: '#e8d4a0',
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
          dark: '#0f0e0d',
          card: '#1a1817',
          elevated: '#252220',
        },
      },
      fontFamily: {
        title: ['Cinzel', 'Noto Serif SC', 'serif'],
        body: ['Noto Sans SC', 'system-ui', 'sans-serif'],
        accent: ['IM Fell English', 'serif'],
      },
    },
  },
  plugins: [],
}

export default config
