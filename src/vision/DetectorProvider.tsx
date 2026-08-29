import { useEffect, useState, type ReactNode } from 'react'
import { DetectorContext, LOADING, type DetectorState } from './detectorContext'
import { loadDetector } from './recognizer'
import { installPracticeKeys } from './practiceKeys'

/**
 * Loads the recognizer once for the whole app and installs the keyboard fallback.
 *
 * A failed load is not fatal: every mode falls back to practice keys, so the failure is
 * exposed as state rather than thrown.
 */
export function DetectorProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<DetectorState>(LOADING)

  useEffect(() => {
    let cancelled = false

    loadDetector()
      .then((detector) => {
        if (cancelled) return
        setState({
          status: 'ready',
          detector,
          message: `Gesture model ready — MediaPipe, running on this device (${detector.delegate})`,
        })
      })
      .catch((err) => {
        console.warn('[signport] detector failed:', err)
        if (cancelled) return
        setState({
          status: 'error',
          detector: null,
          message:
            "Model couldn't load. Practice mode still works — keys 1–6 stand in for your hand.",
        })
      })

    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => installPracticeKeys(), [])

  return <DetectorContext value={state}>{children}</DetectorContext>
}
