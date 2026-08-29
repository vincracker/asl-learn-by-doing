import { useCallback, useRef, useState } from 'react'
import type { Sequence } from '../recognition/dtw'

export type Take = {
  sequence: Sequence
  /** Reference clip for the take, if MediaRecorder captured one. */
  clip: Blob | null
}

/**
 * Records synchronized takes: the landmark sequence AND a webm clip from the same
 * stream, so the "watch this" video and the scoring template can never drift apart.
 */
export function useTakeRecorder(videoRef: React.RefObject<HTMLVideoElement | null>) {
  const [takes, setTakes] = useState<Take[]>([])
  const recorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const pendingClip = useRef<((blob: Blob | null) => void) | null>(null)

  const startClip = useCallback(() => {
    const stream = videoRef.current?.srcObject as MediaStream | null
    if (!stream || !('MediaRecorder' in window)) return

    chunksRef.current = []
    // Let the browser pick a container it can actually produce.
    const recorder = new MediaRecorder(stream)
    recorder.ondataavailable = (e) => e.data.size && chunksRef.current.push(e.data)
    recorder.onstop = () => {
      const blob = chunksRef.current.length
        ? new Blob(chunksRef.current, { type: recorder.mimeType })
        : null
      pendingClip.current?.(blob)
      pendingClip.current = null
    }
    recorder.start()
    recorderRef.current = recorder
  }, [videoRef])

  /** Stops the clip and pairs it with the captured sequence as one take. */
  const finishTake = useCallback((sequence: Sequence) => {
    const recorder = recorderRef.current
    if (!recorder || recorder.state === 'inactive') {
      setTakes((t) => [...t, { sequence, clip: null }])
      return
    }
    pendingClip.current = (clip) => setTakes((t) => [...t, { sequence, clip }])
    recorder.stop()
    recorderRef.current = null
  }, [])

  const removeTake = useCallback((index: number) => {
    setTakes((t) => t.filter((_, i) => i !== index))
  }, [])

  const clearTakes = useCallback(() => setTakes([]), [])

  return { takes, startClip, finishTake, removeTake, clearTakes }
}
