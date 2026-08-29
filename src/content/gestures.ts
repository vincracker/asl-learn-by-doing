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

export type GestureMeta = {
  label: string
  /** [thumb, index, middle, ring, pinky] — 1 when extended. Drives the pictogram. */
  fingers: [number, number, number, number, number]
  motion?: 'wave'
}

export const GESTURES: Record<GestureId, GestureMeta> = {
  Open_Palm: { label: 'Open palm', fingers: [1, 1, 1, 1, 1], motion: 'wave' },
  Pointing_Up: { label: 'Index up', fingers: [0, 1, 0, 0, 0] },
  Thumb_Up: { label: 'Thumb up', fingers: [1, 0, 0, 0, 0] },
  Victory: { label: 'Two fingers', fingers: [0, 1, 1, 0, 0] },
  Closed_Fist: { label: 'Closed fist', fingers: [0, 0, 0, 0, 0] },
  ILoveYou: { label: 'Thumb-index-pinky', fingers: [1, 1, 0, 0, 1] },
}

export const GESTURE_IDS = Object.keys(GESTURES) as GestureId[]

/** Human-readable name for whatever the model reported, including its non-gesture values. */
export function gestureLabel(name: string): string {
  if (name === 'None') return 'no clear sign'
  if (name === '—' || name === '') return '—'
  return GESTURES[name as GestureId]?.label ?? name
}
