import { useEffect, useRef, useState } from 'react'
import type { GestureId } from '../content/gestures'
import type { TurnResult } from '../duel/matchState'
import { emptyWindow, pushSample, type Window } from '../recognition/rollingWindow'
import { NO_LABEL } from '../recognition/scoreFrame'
import type { Detector } from '../vision/recognizer'
import { isHit } from './hitRule'
import { readFrame } from './readFrame'
import { useFrameSource, type FrameRefs } from './useFrameSource'

export type TurnReading = {
  rolling: number
  label: string
  mScore: number
  gScore: number
  remaining: number
}

export type DuelTurnOptions = FrameRefs & {
  detector: Detector | null
  keysOnly: boolean
  target: GestureId
  pass: number
  seconds: number
  /** Changing this starts a fresh turn — the same phrase is signed twice per round. */
  turnId: string
  enabled: boolean
  onResult: (result: TurnResult) => void
}

/**
 * One player's turn: race a single sign against the clock.
 *
 * Unlike a scenario attempt, this stops the instant the sign is read rather than
 * playing out the timer — the elapsed time *is* the score, so letting it run on would
 * make everyone equally slow.
 */
export function useDuelTurn(opts: DuelTurnOptions): TurnReading {
  const { detector, keysOnly, target, pass, seconds, turnId, enabled, onResult } = opts
  const source = useFrameSource(opts, detector, keysOnly)
  const [reading, setReading] = useState<TurnReading>({
    rolling: 0,
    label: NO_LABEL,
    mScore: 0,
    gScore: 0,
    remaining: seconds,
  })

  const onResultRef = useRef(onResult)
  useEffect(() => {
    onResultRef.current = onResult
  })

  useEffect(() => {
    if (!enabled) return

    let raf = 0
    let done = false
    let window: Window = emptyWindow
    const t0 = performance.now()

    const finish = (result: TurnResult) => {
      done = true
      onResultRef.current(result)
    }

    const frame = (now: number) => {
      const elapsed = now - t0
      const { conf, label, mScore, gScore } = readFrame(source(), target, now)
      const step = pushSample(window, now, conf)
      window = step.window

      setReading({
        rolling: step.rolling,
        label,
        mScore,
        gScore,
        remaining: Math.max(0, seconds - elapsed / 1000),
      })

      // No cooldown to respect: a turn only ever scores once, and it ends here.
      if (isHit({ settled: step.settled, rolling: step.rolling, pass, now, cooldownUntil: 0 })) {
        finish({ kind: 'clear', ms: elapsed })
        return
      }
      if (elapsed / 1000 >= seconds) {
        finish({ kind: 'miss' })
        return
      }
      raf = requestAnimationFrame(frame)
    }

    raf = requestAnimationFrame(frame)
    return () => {
      if (!done) cancelAnimationFrame(raf)
    }
  }, [enabled, target, pass, seconds, turnId, source])

  return reading
}
