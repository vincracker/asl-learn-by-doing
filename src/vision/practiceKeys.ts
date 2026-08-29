import { GESTURE_IDS, type GestureId } from '../content/gestures'

/**
 * Keyboard stand-in for a hand, used when the model can't load or the camera is
 * refused. Keys 1-6 each hold one shape for a moment.
 *
 * Deliberately module state rather than React state: the scoring loop reads it from
 * inside a requestAnimationFrame callback every frame, where a re-render would be
 * both wasted work and a frame behind.
 */
const HOLD_MS = 1400

let held: GestureId | null = null
let timer: ReturnType<typeof setTimeout> | null = null

export function getPracticeGesture(): GestureId | null {
  return held
}

/** Starts listening. Returns the matching cleanup, for a React effect. */
export function installPracticeKeys(): () => void {
  const onKeyDown = (e: KeyboardEvent) => {
    // 6-7 borrows the 6 key, and it is mounted over the top of this listener rather
    // than instead of it. While it holds the digits, a 6 means one side of the pair
    // and nothing else — without this, it would also arm a shape that then lingers
    // into whatever screen the player opens next.
    if (poleActive) return
    const i = '123456'.indexOf(e.key)
    if (i < 0) return
    held = GESTURE_IDS[i]
    if (timer) clearTimeout(timer)
    timer = setTimeout(() => {
      held = null
      timer = null
    }, HOLD_MS)
  }

  window.addEventListener('keydown', onKeyDown)
  return () => {
    window.removeEventListener('keydown', onKeyDown)
    if (timer) clearTimeout(timer)
    held = null
    timer = null
  }
}

/**
 * Keyboard stand-in for the 6-7 motion.
 *
 * The shape keys above can't express this one: 6-7 is a pair of hands crossing over
 * time, not a held shape. So press 6 and 7 alternately instead — each press throws the
 * pair to one side, and alternating them lands beats exactly as the hands would.
 *
 * Module state for the same reason as `held`: the round loop reads it every frame from
 * inside requestAnimationFrame.
 */
const POLE_HOLD_MS = 1600

let pole: -1 | 0 | 1 = 0
let poleAt = -Infinity
/** True while the 6-7 listener is mounted and owns the digit keys. */
let poleActive = false

/** The side the keys are holding, and whether the last press is still fresh. */
export function getPracticePole(now: number): { pole: -1 | 0 | 1; fresh: boolean } {
  return { pole, fresh: now - poleAt < POLE_HOLD_MS }
}

/** Starts listening for 6 and 7. Returns the matching cleanup, for a React effect. */
export function installPracticePole(): () => void {
  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key !== '6' && e.key !== '7') return
    pole = e.key === '6' ? -1 : 1
    poleAt = performance.now()
  }

  poleActive = true
  // Anything the shape keys were holding is stale the moment 6-7 takes over.
  held = null
  window.addEventListener('keydown', onKeyDown)
  return () => {
    window.removeEventListener('keydown', onKeyDown)
    poleActive = false
    pole = 0
    poleAt = -Infinity
  }
}
