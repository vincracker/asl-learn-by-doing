import { useEffect, useRef, useState } from 'react'
import type { GestureId } from '../content/gestures'
import { WINDOW_MS } from '../content/rules'
import { emptyWindow, pushSample, type Window } from '../recognition/rollingWindow'
import { NO_LABEL } from '../recognition/scoreFrame'
import type { Detector } from '../vision/recognizer'
import { readFrame } from './readFrame'
import { useFrameSource, type FrameRefs } from './useFrameSource'

export type AttemptReading = {
  /** Mean confidence over the last window — what the match bar shows. */
  rolling: number
  /** Best window seen so far. This is the attempt's score. */
  best: number
  label: string
  mScore: number
  gScore: number
  remaining: number
}

const START: AttemptReading = {
  rolling: 0,
  best: 0,
  label: NO_LABEL,
  mScore: 0,
  gScore: 0,
  remaining: 0,
}

/** A hold this confident is already a pass; don't make the learner wait out the clock. */
const EARLY_EXIT_SCORE = 0.97
const EARLY_EXIT_AFTER_MS = 2200

export type AttemptOptions = FrameRefs & {
  detector: Detector | null
  keysOnly: boolean
  target: GestureId
  seconds: number
  /** The loop waits for this — starting before the camera resolves burns the clock. */
  enabled: boolean
  onDone: (score: number) => void
}

/**
 * Runs one timed attempt at a single sign.
 *
 * The score is the best rolling-mean confidence over the attempt, so a lucky single
 * frame can't carry it and a steady hold is rewarded.
 */
export function useAttempt(opts: AttemptOptions): AttemptReading {
  const { detector, keysOnly, target, seconds, enabled, onDone } = opts
  const [reading, setReading] = useState<AttemptReading>({ ...START, remaining: seconds })
  const source = useFrameSource(opts, detector, keysOnly)

  // Latest-ref so a caller's inline arrow function can't restart the attempt.
  const onDoneRef = useRef(onDone)
  useEffect(() => {
    onDoneRef.current = onDone
  })

  useEffect(() => {
    if (!enabled) return

    let raf = 0
    let window: Window = emptyWindow
    let best = 0
    let finished = false
    const t0 = performance.now()

    const frame = (now: number) => {
      const elapsed = now - t0
      const { conf, label, mScore, gScore } = readFrame(source(), target, now)
      const step = pushSample(window, now, conf)
      window = step.window

      // Only start banking a best once a full window exists behind it.
      if (elapsed > WINDOW_MS) best = Math.max(best, step.rolling)
      const remaining = Math.max(0, seconds - elapsed / 1000)

      setReading({ rolling: step.rolling, best, label, mScore, gScore, remaining })

      const timeUp = elapsed / 1000 >= seconds
      const nailed = best >= EARLY_EXIT_SCORE && elapsed > EARLY_EXIT_AFTER_MS
      if (timeUp || nailed) {
        finished = true
        onDoneRef.current(Math.min(1, best))
        return
      }
      raf = requestAnimationFrame(frame)
    }

    raf = requestAnimationFrame(frame)
    return () => {
      if (!finished) cancelAnimationFrame(raf)
    }
  }, [enabled, target, seconds, source])

  return reading
}
