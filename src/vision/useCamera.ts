import { useEffect, useRef, useState } from 'react'

export type CameraStatus = 'starting' | 'ready' | 'denied' | 'error'

export type CameraState = {
  videoRef: React.RefObject<HTMLVideoElement | null>
  status: CameraStatus
  error: string | null
}

// 640x480 rather than HD: the recognizer runs on every frame, and the extra pixels
// buy nothing at 21 landmarks while costing real time per frame.
const CONSTRAINTS: MediaStreamConstraints = {
  video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' },
  audio: false,
}

/**
 * Attaches the user's webcam to a video element for as long as the component lives.
 *
 * getUserMedia needs a secure context: localhost is fine, but serving over a LAN IP
 * requires HTTPS or the camera silently never appears.
 */
export function useCamera(): CameraState {
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const [status, setStatus] = useState<CameraStatus>('starting')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let stream: MediaStream | null = null
    let cancelled = false

    async function start() {
      try {
        stream = await navigator.mediaDevices.getUserMedia(CONSTRAINTS)
        if (cancelled) return

        const video = videoRef.current
        if (!video) throw new Error('video element not mounted')

        video.srcObject = stream
        await video.play()
        if (cancelled) return
        setStatus('ready')
      } catch (err) {
        if (cancelled) return
        const denied = err instanceof DOMException && err.name === 'NotAllowedError'
        setStatus(denied ? 'denied' : 'error')
        setError(err instanceof Error ? err.message : String(err))
      }
    }

    void start()

    // Releasing the tracks is what turns the camera light off. Leaving a scenario
    // must not leave the webcam running behind the home screen.
    return () => {
      cancelled = true
      stream?.getTracks().forEach((track) => track.stop())
    }
  }, [])

  return { videoRef, status, error }
}
