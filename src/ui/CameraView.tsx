import type { RefObject } from 'react'
import type { CameraStatus } from '../vision/useCamera'

/**
 * The camera feed with the framing brackets and the landmark overlay on top.
 *
 * Refs come from the parent because the scoring loop reads the video and writes to the
 * canvas every frame; owning them here would mean handing them back out again.
 */
export function CameraView({
  videoRef,
  canvasRef,
  status,
  badge,
  keysOnly,
}: {
  videoRef: RefObject<HTMLVideoElement | null>
  canvasRef: RefObject<HTMLCanvasElement | null>
  status: CameraStatus
  /** Corner label, e.g. "HOLD THE SIGN". */
  badge: string
  /** True when keys 1-6 are standing in, which changes the denied-camera copy. */
  keysOnly: boolean
}) {
  return (
    <div className="viewwrap">
      <video ref={videoRef} playsInline muted />
      <canvas ref={canvasRef} />
      <div className="brackets">
        <i />
        <i />
        <i />
        <i />
      </div>
      <div className="rec">
        <b /> {badge}
      </div>
      {status !== 'ready' && (
        <div className="camnote" style={status === 'starting' ? undefined : { background: 'rgba(12,16,19,.9)' }}>
          {status === 'starting' ? 'Asking for camera access…' : <DeniedNote keysOnly={keysOnly} />}
        </div>
      )}
    </div>
  )
}

function DeniedNote({ keysOnly }: { keysOnly: boolean }) {
  return (
    <>
      No camera access.
      <br />
      <br />
      {keysOnly
        ? 'Playing on keys 1–6 instead — each key stands in for one hand shape.'
        : "Allow it in your browser's address bar, then reload. You can still finish in practice mode with keys 1–6."}
    </>
  )
}
