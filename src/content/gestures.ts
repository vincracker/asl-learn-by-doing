/**
 * The hand shapes this app teaches.
 *
 * Ids map 1:1 to MediaPipe's pretrained canned gesture classes, so a category name
 * coming back from the recognizer can be used as a key here without translation.
 */
export type GestureId =
  | 'Open_Palm'
  | 'Pointing_Up'
  | 'Thumb_Up'
  | 'Victory'
  | 'Closed_Fist'
  | 'ILoveYou'

/**
 * Which way the sign travels.
 *
 * A front-on pictogram cannot tell a side-to-side wave from a push toward the
 * other person — both are "the hand moves". So travel is named on the data and
 * the pictogram encodes it twice: in how the hand animates (`z` scales up rather
 * than sliding, so the trail reads as concentric rather than fanned) and in a
 * small top-down inset that says the same thing in a still frame.
 */
export type MotionAxis = 'x' | 'y' | 'z' | 'twist' | 'steady'

export type GestureMeta = {
  label: string
  /** [thumb, index, middle, ring, pinky] — 0 straight, 1 folded into the palm. */
  curl: [number, number, number, number, number]
  /** How far the extended fingers fan apart, 0–1. */
  spread: number
  axis: MotionAxis
  /** Names the travel in two or three words, under the pictogram. */
  motionHint: string
}

export const GESTURES: Record<GestureId, GestureMeta> = {
  Open_Palm: {
    label: 'Open palm',
    curl: [0, 0, 0, 0, 0],
    spread: 1,
    axis: 'x',
    motionHint: 'Wave side to side',
  },
  Pointing_Up: {
    label: 'Index up',
    curl: [0.85, 0, 1, 1, 1],
    spread: 0,
    axis: 'y',
    motionHint: 'Lift up, twice',
  },
  Thumb_Up: {
    label: 'Thumb up',
    curl: [0, 1, 1, 1, 1],
    spread: 0,
    axis: 'z',
    motionHint: 'Push toward them',
  },
  Victory: {
    // The tip warns that counting signs get misread when they wobble, so this
    // one is deliberately the still member of the set.
    label: 'Two fingers',
    curl: [0.9, 0, 0, 1, 1],
    spread: 1,
    axis: 'steady',
    motionHint: 'Raise and hold still',
  },
  Closed_Fist: {
    label: 'Closed fist',
    curl: [0.9, 1, 1, 1, 1],
    spread: 0,
    axis: 'z',
    motionHint: 'Forward, once, firm',
  },
  ILoveYou: {
    label: 'Thumb-index-pinky',
    curl: [0, 0, 1, 1, 0],
    spread: 0.8,
    axis: 'twist',
    motionHint: 'Twist the wrist',
  },
}

export const GESTURE_IDS = Object.keys(GESTURES) as GestureId[]

/** Human-readable name for whatever the model reported, including its non-gesture values. */
export function gestureLabel(name: string): string {
  if (name === 'None') return 'no clear sign'
  if (name === '—' || name === '') return '—'
  return GESTURES[name as GestureId]?.label ?? name
}
