import { useEffect, useRef, useState } from 'react'
import { emptyWindow, pushSample, type Window } from '../recognition/rollingWindow'
import {
  initialRep,
  stepRep,
  type Beat,
  type Fault,
  type RepState,
} from '../recognition/sixSeven'
import type { Detector } from '../vision/recognizer'
import { readPoseFrame } from './readFrame'
import { useFrameSource, type FrameRefs } from './useFrameSource'

export type SixSevenReading = {
  /** Completed 6-7s. The score. */
  reps: number
  /** Beats landed, monotonic — the UI flashes off this. */
  beats: number
  beat: Beat | null
  /** Beats in the run currently going. */
  chain: number
  /** Rolling mean of how flat the palms are — the form meter. */
  form: number
  /** Live tilt in palm-widths, for the see-saw. */
  tilt: number
  fault: Fault
  remaining: number
}

export type SixSevenResult = { reps: number; beats: number; bestChain: number }

export type SixSevenOptions = FrameRefs & {
  detector: Detector | null
  keysOnly: boolean
  /** The loop waits for this — starting before the camera resolves burns the clock. */
  enabled: boolean
  seconds: number
  onComplete: (result: SixSevenResult) => void
}

/**
 * One timed round of 6-7.
 *
 * A single rAF loop for the whole round, like `useSignRound` — there is no per-word
 * restart here to get wrong, but the same rule applies: the counter is a value threaded
 * through the loop, never React state read back inside a frame callback, which would
 * always be a frame behind.
 *
 * The counting itself lives in `stepRep`; this hook only supplies frames and a clock.
 */
export function useSixSevenRound(opts: SixSevenOptions): SixSevenReading {
  const { detector, keysOnly, enabled, seconds, onComplete } = opts
  const source = useFrameSource(opts, detector, keysOnly)

  const [reading, setReading] = useState<SixSevenReading>({
    reps: 0,
    beats: 0,
    beat: null,
    chain: 0,
    form: 0,
    tilt: 0,
    fault: 'no-hands',
    remaining: seconds,
  })

  // Latest-ref so an inline callback can't restart the round mid-clock.
  const onCompleteRef = useRef(onComplete)
  useEffect(() => {
    onCompleteRef.current = onComplete
  })

  useEffect(() => {
    if (!enabled) return

    let raf = 0
    let running = true
    let rep: RepState = initialRep
    let window: Window = emptyWindow
    const endsAt = performance.now() + seconds * 1000

    const frame = (now: number) => {
      if (!running) return

      const pose = readPoseFrame(source(), now)
      rep = stepRep(rep, pose, now)

      // The form meter is a rolling mean for the same reason every other score in the
      // app is one: a single frame is noise, and a bar that twitches teaches nothing.
      const step = pushSample(window, now, pose.valid ? pose.form : 0)
      window = step.window

      const remaining = Math.max(0, (endsAt - now) / 1000)
      setReading({
        reps: rep.reps,
        beats: rep.beats,
        beat: rep.beat,
        chain: rep.halfBeats,
        form: step.rolling,
        tilt: pose.tilt,
        fault: pose.fault,
        remaining,
      })

      if (remaining <= 0) {
        running = false
        onCompleteRef.current({ reps: rep.reps, beats: rep.beats, bestChain: rep.bestChain })
        return
      }

      raf = requestAnimationFrame(frame)
    }

    raf = requestAnimationFrame(frame)

    return () => {
      running = false
      cancelAnimationFrame(raf)
    }
  }, [enabled, source, seconds])

  return reading
}
