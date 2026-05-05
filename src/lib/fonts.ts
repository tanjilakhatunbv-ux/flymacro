import { Cinzel, Cinzel_Decorative, IM_Fell_English_SC, Marcellus_SC, JetBrains_Mono } from 'next/font/google'

export const cinzel = Cinzel({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800', '900'],
  variable: '--font-cinzel',
  display: 'swap',
})

export const cinzelDecorative = Cinzel_Decorative({
  subsets: ['latin'],
  weight: ['400', '700', '900'],
  variable: '--font-cinzel-decorative',
  display: 'swap',
})

export const marcellusSC = Marcellus_SC({
  subsets: ['latin'],
  weight: ['400'],
  variable: '--font-marcellus',
  display: 'swap',
})

export const imFellEnglishSC = IM_Fell_English_SC({
  subsets: ['latin'],
  weight: ['400'],
  variable: '--font-im-fell',
  display: 'swap',
})

export const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-jetbrains-mono',
  display: 'swap',
})
