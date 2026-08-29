import type { ReactNode } from 'react'
import { HandOverlay } from './HandOverlay'
import type { Frame } from '../vision/types'
import type { CameraStatus } from '../vision/useCamera'
import type { LandmarkStatus } from '../vision/useLandmarks'

type Props = {
  videoRef: React.RefObject<HTMLVideoElement | null>
  frameRef: React.RefObject<Frame | null>
  cameraStatus: CameraStatus
  visionStatus: LandmarkStatus
  fps: number
  capturing: boolean
  captureState?: 'idle' | 'armed' | 'capturing'
  error: string | null
  children?: ReactNode
}

/** The mirrored camera view with the skeleton overlay and a status/diagnostics layer. */
export function CameraStage({
  videoRef, frameRef, cameraStatus, visionStatus, fps, capturing, captureState, error, children,
}: Props) {
  const state = captureState ?? (capturing ? 'capturing' : 'idle')
  const loading = cameraStatus !== 'ready' || visionStatus === 'loading'

  return (
    <div className={`stage stage--${state}`}>
      {/* Mirrored for display only — MediaPipe receives the raw frame. */}
      <video ref={videoRef} className="stage__video" playsInline muted />
      <HandOverlay frameRef={frameRef} active={capturing} />

      {loading && <StageMessage status={cameraStatus} visionStatus={visionStatus} error={error} />}

      <div className="stage__hud">
        <span className={`pill ${state !== 'idle' ? 'pill--live' : ''}`}>
          {state === 'capturing' ? 'recording' : state === 'armed' ? 'ready — move to start' : 'idle'}
        </span>
        <span className="pill pill--muted">{fps} fps</span>
      </div>

      <div className="stage__content">{children}</div>
    </div>
  )
}

function StageMessage({
  status, visionStatus, error,
}: { status: CameraStatus; visionStatus: LandmarkStatus; error: string | null }) {
  if (status === 'denied') {
    return (
      <Veil title="Camera blocked">
        Allow camera access in your browser, then reload. Nothing you record leaves this
        device — all recognition runs locally.
      </Veil>
    )
  }
  if (status === 'error' || visionStatus === 'error') {
    return <Veil title="Something went wrong">{error ?? 'Unknown error'}</Veil>
  }
  return (
    <Veil title={status === 'ready' ? 'Loading hand tracking…' : 'Starting camera…'}>
      First load pulls in the tracking models from this device.
    </Veil>
  )
}

function Veil({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="stage__veil">
      <h2>{title}</h2>
      <p>{children}</p>
    </div>
  )
}
