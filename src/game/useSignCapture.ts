import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useCamera } from '../vision/useCamera'
import { useLandmarks } from '../vision/useLandmarks'
import { frameToFeature } from '../recognition/normalize'
import { Segmenter } from '../recognition/segment'
import type { Sequence } from '../recognition/dtw'
import type { Frame } from '../vision/types'

export type CaptureMode = 'auto' | 'tap'

/** Mirrors the segmenter's state so the UI can show what the capture is waiting for. */
export type CaptureState = 'idle' | 'armed' | 'capturing'

type Options = {
  enabled: boolean
  mode: CaptureMode
  onAttempt: (sequence: Sequence) => void
}

/**
 * Binds camera -> landmark detection -> segmentation into the single hook every game
 * mode consumes.
 *
 * `frameRef` is exposed instead of frame state on purpose: the overlay reads it inside
 * its own rAF loop, so detection at 30fps costs zero React renders.
 */
export function useSignCapture({ enabled, mode, onAttempt }: Options) {
  const { videoRef, status: cameraStatus, error: cameraError } = useCamera()
  const frameRef = useRef<Frame | null>(null)
  const [captureState, setCaptureState] = useState<CaptureState>('idle')
  const [handsVisible, setHandsVisible] = useState(false)

  const segmenter = useMemo(() => new Segmenter(), [])

  // Latest-value refs, written in an effect so a discarded render can't strand a stale
  // value where the rAF loop will read it.
  const modeRef = useRef(mode)
  const onAttemptRef = useRef(onAttempt)
  useEffect(() => {
    modeRef.current = mode
    onAttemptRef.current = onAttempt
  }, [mode, onAttempt])

  const handleFrame = useCallback(
    (frame: Frame) => {
      frameRef.current = frame
      const hasHands = frame.hands.length > 0
      setHandsVisible((prev) => (prev === hasHands ? prev : hasHands))

      // In tap mode the segmenter only advances once armed; push() is a no-op from idle
      // because forceStart is what opens the capture.
      if (modeRef.current === 'auto' || segmenter.current !== 'idle') {
        const captured = segmenter.push(frameToFeature(frame), hasHands)
        setCaptureState((prev) => (prev === segmenter.current ? prev : segmenter.current))
        if (captured) onAttemptRef.current(captured)
      }
    },
    [segmenter],
  )

  const { status: visionStatus, fps, error: visionError } = useLandmarks(
    videoRef,
    enabled && cameraStatus === 'ready',
    handleFrame,
  )

  /**
   * One control for the whole tap flow: the first tap arms a capture, and a second tap
   * while armed or recording cancels it. There is no release to time, so a take never
   * ends because the user let go a beat early.
   */
  const tap = useCallback(() => {
    if (segmenter.current === 'idle') {
      segmenter.forceStart()
      setCaptureState('armed')
      return
    }
    const captured = segmenter.forceStop()
    setCaptureState('idle')
    if (captured) onAttemptRef.current(captured)
  }, [segmenter])

  // Reset between prompts so a half-finished attempt never leaks into the next one.
  useEffect(() => {
    if (!enabled) {
      segmenter.reset()
      setCaptureState('idle')
    }
  }, [enabled, segmenter])

  // Space mirrors the tap button, so the signer can keep both hands up and ready.
  useEffect(() => {
    if (!enabled || mode !== 'tap') return

    const down = (e: KeyboardEvent) => {
      if (e.code !== 'Space' || e.repeat) return
      e.preventDefault()
      tap()
    }
    window.addEventListener('keydown', down)
    return () => window.removeEventListener('keydown', down)
  }, [enabled, mode, tap])

  return {
    videoRef,
    frameRef,
    cameraStatus,
    visionStatus,
    fps,
    captureState,
    capturing: captureState === 'capturing',
    handsVisible,
    tap,
    error: cameraError ?? visionError,
  }
}
