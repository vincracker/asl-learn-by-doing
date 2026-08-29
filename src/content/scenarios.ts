import type { GestureId } from './gestures'

export type SceneId = 'airport' | 'bus'

export type Step = {
  /** What the other person says, before you reply. */
  npc: string
  who: string
  /** The phrase you have to produce, in English. */
  phrase: string
  gesture: GestureId
  /** How to form the shape, in plain language. */
  tip: string
}

export type Scenario = {
  id: SceneId
  name: string
  tagline: string
  blurb: string
  words: string[]
  steps: Step[]
}

export const SCENARIOS: Record<SceneId, Scenario> = {
  airport: {
    id: 'airport',
    name: 'Airport',
    tagline: 'Check-in desk, 06:40',
    blurb: 'A ground agent looks up from the counter. Answer her three times without speaking.',
    words: ['Hello', 'Check in', 'Thank you'],
    steps: [
      {
        npc: 'Good morning — what can I help you with?',
        who: 'Ground agent',
        phrase: 'Hello',
        gesture: 'Open_Palm',
        tip: 'Open hand, fingers spread, palm facing her at shoulder height. A small wave is fine — the model reads the shape, not the swing.',
      },
      {
        npc: 'Sure. Are you dropping a bag, or picking up a booking?',
        who: 'Ground agent',
        phrase: 'Check in',
        gesture: 'Pointing_Up',
        tip: "Index finger straight up, other fingers curled in. In the real world you'd point at the desk; here, point up and hold.",
      },
      {
        npc: "You're all set. Gate 22, boarding at 07:15.",
        who: 'Ground agent',
        phrase: 'Thank you',
        gesture: 'Thumb_Up',
        tip: 'Thumb up, four fingers folded. Keep the thumb clear of the fingers so the edge is visible.',
      },
    ],
  },
  bus: {
    id: 'bus',
    name: 'Bus',
    tagline: 'Route 431, doors open',
    blurb: "You're boarding with a friend and you need to get off three stops early.",
    words: ['Two tickets', 'Stop here', 'See you'],
    steps: [
      {
        npc: 'Morning. How many riding today?',
        who: 'Driver',
        phrase: 'Two tickets',
        gesture: 'Victory',
        tip: 'Index and middle finger up in a V, thumb tucked. Hold it still — counting signs get misread when they wobble.',
      },
      {
        npc: 'Right. Tell me when you want off.',
        who: 'Driver',
        phrase: 'Stop here',
        gesture: 'Closed_Fist',
        tip: 'Fist, thumb resting across the fingers, held out in front of you. Firm and steady.',
      },
      {
        npc: "That's your stop. Mind the step.",
        who: 'Driver',
        phrase: 'See you',
        gesture: 'ILoveYou',
        tip: 'Thumb, index and pinky out; middle and ring folded down. Used widely as a warm goodbye.',
      },
    ],
  },
}

/** Play order. Each scenario gates the next one. */
export const ORDER: SceneId[] = ['airport', 'bus']

export const SCENARIO_LIST = ORDER.map((id) => SCENARIOS[id])

/** Scenarios that are announced but not built yet. */
export const SOON = [
  { name: 'Restaurant', tagline: 'Ordering, allergies, the bill' },
  { name: 'Pharmacy', tagline: 'Symptoms and dosage' },
  { name: 'Train', tagline: 'Platforms and delays' },
]

export type Word = { phrase: string; gesture: GestureId; tip: string }

/**
 * Derived from the scenarios rather than hand-written, so the pool grows by
 * itself the day Restaurant or Pharmacy get built.
 */
export const WORD_BANK: Word[] = ORDER.flatMap((id) =>
  SCENARIOS[id].steps.map((s) => ({ phrase: s.phrase, gesture: s.gesture, tip: s.tip })),
)

export function isSceneId(value: string | undefined): value is SceneId {
  return value === 'airport' || value === 'bus'
}
