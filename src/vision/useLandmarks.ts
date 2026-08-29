import { useEffect, useRef, useState } from 'react'
import { loadDetectors, detectFrame } from './landmarker'
import type { Frame } from './types'

export type LandmarkStatus = 'loading' | 'running' | 'error'

/**
 * Drives a requestAnimationFrame detection loop over the video element.
 *
 * `onFrame` fires up to once per rendered video frame and is deliberately NOT wired to
 * React state — re-rendering at 30-60fps would starve the loop. Callers keep their own
 * refs and re-render only when something user-visible changes.
 */
export function useLandmarks(
  videoRef: React.RefObject<HTMLVideoElement | null>,
  enabled: boolean,
  onFrame: (frame: Frame) => void,
) {
  const [status, setStatus] = useState<LandmarkStatus>('loading')
  const [fps, setFps] = useState(0)
  const [error, setError] = useState<string | null>(null)

  // Keep the newest callback without restarting the loop when its identity changes.
  // Assigned in an effect rather than during render so concurrent re-renders that are
  // thrown away can't leave a stale callback behind.
  const onFrameRef = useRef(onFrame)
  useEffect(() => {
    onFrameRef.current = onFrame
  }, [onFrame])

  useEffect(() => {
    if (!enabled) return

    let raf = 0
    let cancelled = false
    // MediaPipe VIDEO mode rejects repeated/decreasing timestamps, so we only run
    // detection when the video has actually advanced to a new frame.
    let lastVideoTime = -1
    let frameCount = 0
    let windowStart = performance.now()

    void loadDetectors()
      .then((detectors) => {
        if (cancelled) return
        setStatus('running')

        const tick = () => {
          raf = requestAnimationFrame(tick)
          const video = videoRef.current
          if (!video || video.readyState < 2 || video.currentTime === lastVideoTime) return
          lastVideoTime = video.currentTime

          try {
            onFrameRef.current(detectFrame(detectors, video, performance.now()))
          } catch (err) {
            setStatus('error')
            setError(err instanceof Error ? err.message : String(err))
            cancelAnimationFrame(raf)
            return
          }

          frameCount += 1
          const now = performance.now()
          if (now - windowStart >= 500) {
            setFps(Math.round((frameCount * 1000) / (now - windowStart)))
            frameCount = 0
            windowStart = now
          }
        }
        raf = requestAnimationFrame(tick)
      })
      .catch((err: unknown) => {
        if (cancelled) return
        setStatus('error')
        setError(err instanceof Error ? err.message : String(err))
      })

    return () => {
      cancelled = true
      cancelAnimationFrame(raf)
    }
  }, [enabled, videoRef])

  return { status, fps, error }
}
