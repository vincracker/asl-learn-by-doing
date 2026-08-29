import type { SceneArtId } from '../ui/scenes'

export type BonusGame = {
  id: string
  name: string
  blurb: string
  chips: string[]
  /** Playable games link out; the rest are shown as locked cards. */
  path: string | null
  art: SceneArtId
}

export const BONUS: BonusGame[] = [
  {
    id: 'rush',
    name: 'Rush hour',
    blurb: 'The phrase is on screen — the sign is not. Sixty seconds to clear as many as you can remember.',
    chips: ['60 s', 'Beat your best'],
    path: '/rush',
    art: 'rush',
  },
  {
    id: 'guess',
    name: 'AI guess',
    blurb: 'Make any sign you like. The model names it and shows how sure it is. Thirty seconds, as many as you can hit.',
    chips: ['Free play', '30 s'],
    path: '/guess',
    art: 'guess',
  },
  {
    id: 'sixseven',
    name: '6-7',
    blurb:
      'The meme, judged strictly. Two flat palms apart, one up and one down, then swap. Sixty seconds to rack up as many as you can.',
    chips: ['60 s', 'Two hands', 'Motion'],
    path: '/six-seven',
    art: 'sixseven',
  },
  {
    id: 'mirror',
    name: 'Mirror match',
    blurb: 'Two signs on screen, one is yours. Copy the right one before the timer runs out.',
    chips: ['Coming soon'],
    path: null,
    art: 'guess',
  },
  {
    id: 'chain',
    name: 'Sign chain',
    blurb: 'A sentence appears one sign at a time and you have to repeat the whole chain back.',
    chips: ['Coming soon'],
    path: null,
    art: 'guess',
  },
]
