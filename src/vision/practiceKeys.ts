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
