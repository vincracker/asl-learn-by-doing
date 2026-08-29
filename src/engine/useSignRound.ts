import { useCallback, useEffect, useRef, useState } from 'react'
import type { Word } from '../content/scenarios'
import { RUSH_COOLDOWN } from '../content/rules'
import { emptyWindow, pushSample, type Window } from '../recognition/rollingWindow'
import { NO_LABEL } from '../recognition/scoreFrame'
import type { Detector } from '../vision/recognizer'
import { isHit } from './hitRule'
import { readFrame } from './readFrame'
import { useFrameSource, type FrameRefs } from './useFrameSource'
import { pickNextWord } from './wordPool'

export type RoundReading = {
  rolling: number
  label: string
  mScore: number
  gScore: number
  remaining: number
}

export type RoundResult = { hits: number; skips: number }

export type SignRound = {
  word: Word | null
  reading: RoundReading
  hits: number
  skips: number
  /** Increments on every hit, so the counter can flash without owning the state. */
  pulse: number
  skip: () => void
}

export type SignRoundOptions = FrameRefs & {
  detector: Detector | null
  keysOnly: boolean
  enabled: boolean
  /** The phrases this round draws from. */
  bank: readonly Word[]
  /** Rolling confidence that counts as a hit. */
  pass: number
  seconds: number
  onComplete: (result: RoundResult) => void
}

/**
 * One timed round of "here is a phrase, make the sign", shared by Rush hour and AI guess.
 *
 * This is a SINGLE rAF loop for the whole round — moving to the next word is a state
 * change, never a restart. Restarting the loop from inside a frame callback is what
 * makes a round double-count a hold that is still in front of the camera.
 */
export function useSignRound(opts: SignRoundOptions): SignRound {
  const { detector, keysOnly, enabled, bank, pass, seconds, onComplete } = opts
  const source = useFrameSource(opts, detector, keysOnly)

  const [word, setWord] = useState<Word | null>(null)
  const [reading, setReading] = useState<RoundReading>({
    rolling: 0,
    label: NO_LABEL,
    mScore: 0,
    gScore: 0,
    remaining: seconds,
  })
  const [tally, setTally] = useState({ hits: 0, skips: 0, pulse: 0 })

  // Latest-ref so an inline callback can't restart the round mid-clock.
  const onCompleteRef = useRef(onComplete)
  useEffect(() => {
    onCompleteRef.current = onComplete
  })
  const skipRef = useRef<() => void>(() => {})

  useEffect(() => {
    if (!enabled) return

    let raf = 0
    let running = true
    let current: Word | null = null
    let window: Window = emptyWindow
    let hits = 0
    let skips = 0
    let cooldownUntil = 0
    const endsAt = performance.now() + seconds * 1000

    const nextWord = () => {
      current = pickNextWord(bank, current)
      // Clearing the window is what stops the previous word's confidences from
      // instantly clearing the new one.
      window = emptyWindow
      setWord(current)
    }

    const advance = (now: number, scored: boolean) => {
      if (scored) hits += 1
      else skips += 1
      cooldownUntil = now + RUSH_COOLDOWN
      // `hits` doubles as the pulse: it only moves on a hit, so a skip can never
      // retrigger the flash.
      setTally({ hits, skips, pulse: hits })
      nextWord()
    }

    skipRef.current = () => {
      if (running) advance(performance.now(), false)
    }

    const frame = (now: number) => {
      if (!running || !current) return

      const { conf, label, mScore, gScore } = readFrame(source(), current.gesture, now)
      const step = pushSample(window, now, conf)
      window = step.window
      const remaining = Math.max(0, (endsAt - now) / 1000)

      setReading({ rolling: step.rolling, label, mScore, gScore, remaining })

      if (remaining <= 0) {
        running = false
        onCompleteRef.current({ hits, skips })
        return
      }

      if (isHit({ settled: step.settled, rolling: step.rolling, pass, now, cooldownUntil })) {
        advance(now, true)
      }

      raf = requestAnimationFrame(frame)
    }

    nextWord()
    raf = requestAnimationFrame(frame)

    return () => {
      running = false
      cancelAnimationFrame(raf)
    }
  }, [enabled, source, bank, pass, seconds])

  const skip = useCallback(() => skipRef.current(), [])

  return { word, reading, hits: tally.hits, skips: tally.skips, pulse: tally.pulse, skip }
}
