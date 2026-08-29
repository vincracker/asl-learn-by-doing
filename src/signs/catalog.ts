/**
 * The signs this app teaches, with a written description of how each is formed.
 *
 * Descriptions are transcribed from standard ASL references (Lifeprint / HandSpeak).
 * They are learning aids, not authority — regional variation is real, and this app gives
 * practice feedback rather than assessment.
 */
export type SignMeta = {
  id: string
  gloss: string
  /** How to form the sign, in plain language. */
  how: string
  /** Two hands, or one dominant hand? Shown as a hint before an attempt. */
  hands: 1 | 2
  /** Anything a learner should know beyond the mechanics. */
  note?: string
}

export const SIGN_CATALOG: SignMeta[] = [
  {
    id: 'hello',
    gloss: 'HELLO',
    how: 'Flat hand, fingers together, touches the forehead near the temple, then moves out and away in a small salute.',
    hands: 1,
  },
  {
    id: 'how-are-you',
    gloss: 'HOW ARE YOU',
    how: 'HOW: curved hands back to back, knuckles touching, roll them forward and up. Then YOU: point toward the person.',
    hands: 2,
    note: 'This is a short phrase, not a single sign — two movements run together. Expect it to take longer than the others.',
  },
  {
    id: 'please',
    gloss: 'PLEASE',
    how: 'Flat hand on the centre of your chest, circling smoothly a couple of times.',
    hands: 1,
  },
  {
    id: 'thank-you',
    gloss: 'THANK YOU',
    how: 'Flat hand starts at the chin, fingers touching the lips, then moves forward and down toward the person.',
    hands: 1,
  },
  {
    id: 'more',
    gloss: 'MORE',
    how: 'Both hands in a flat "O" — fingertips meeting the thumb — then tap the two bunched fingertips together twice.',
    hands: 2,
  },
  {
    id: 'help',
    gloss: 'HELP',
    how: 'Dominant hand in an "A" fist with the thumb up, resting on the flat non-dominant palm; lift both together.',
    hands: 2,
  },
  {
    id: 'no',
    gloss: 'NO',
    how: 'Index and middle fingers snap down onto the thumb once, like a small mouth closing.',
    hands: 1,
  },
  {
    id: 'like',
    gloss: 'LIKE',
    how: 'Thumb and middle finger touch the chest, then pull outward as the two fingers close together.',
    hands: 1,
  },
  {
    id: 'go',
    gloss: 'GO',
    how: 'Both index fingers point forward, then move away from you together in the direction of travel.',
    hands: 2,
  },
  {
    id: 'forget',
    gloss: 'FORGET',
    how: 'Flat hand wipes across the forehead, closing into a fist as it comes away to the side.',
    hands: 1,
  },
]

export const SIGN_BY_ID = new Map(SIGN_CATALOG.map((s) => [s.id, s]))

export function signMeta(id: string): SignMeta {
  const meta = SIGN_BY_ID.get(id)
  if (!meta) throw new Error(`unknown sign id: ${id}`)
  return meta
}
