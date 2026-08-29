import { useRef } from 'react'
import { ATTEMPT_SECONDS, PASS } from '../../content/rules'
import type { Step } from '../../content/scenarios'
import { useAttempt } from '../../engine/useAttempt'
import { CameraView } from '../../ui/CameraView'
import { HandPictogram } from '../../ui/HandPictogram'
import { Meter } from '../../ui/Meter'
import { ModelReadout } from '../../ui/ModelReadout'
import { useCamera } from '../../vision/useCamera'
import { useDetector } from '../../vision/useDetector'

/** The timed attempt: camera on, hold the shape, watch the match bar. */
export function StepCapture({ step, onDone }: { step: Step; onDone: (score: number) => void }) {
  const { detector, status: modelStatus } = useDetector()
  const { videoRef, status: cameraStatus } = useCamera()
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  const keysOnly = modelStatus !== 'ready' || cameraStatus === 'denied' || cameraStatus === 'error'

  const reading = useAttempt({
    videoRef,
    canvasRef,
    detector,
    keysOnly,
    target: step.gesture,
    seconds: ATTEMPT_SECONDS,
    // Starting before the camera resolves would burn the clock on black frames.
    enabled: modelStatus !== 'loading' && cameraStatus !== 'starting',
    onDone,
  })

  return (
    <div className="stage two">
      <div>
        <CameraView
          videoRef={videoRef}
          canvasRef={canvasRef}
          status={cameraStatus}
          badge="HOLD THE SIGN"
          keysOnly={keysOnly}
        />
      </div>

      <div>
        <div className="panel">
          <p className="eyebrow">Say it with your hand</p>
          <p className="taskline">“{step.phrase}”</p>

          <div className="teach" style={{ marginTop: 14 }}>
            <div className="handbox handbox--sm">
              <HandPictogram gesture={step.gesture} size="sm" />
            </div>
            <div className="teachcopy">
              <p className="howto">{step.tip}</p>
            </div>
          </div>

          <Meter
            label="Match"
            value={`${Math.round(reading.best * 100)}%`}
            fraction={reading.rolling}
            good={reading.rolling >= PASS}
          />
          <Meter
            label="Time"
            value={`${reading.remaining.toFixed(1)}s`}
            fraction={1 - reading.remaining / ATTEMPT_SECONDS}
            dim
          />

          {keysOnly ? (
            <p className="readout">Practice mode: keys 1–6 stand in for a hand.</p>
          ) : (
            <ModelReadout label={reading.label} mScore={reading.mScore} gScore={reading.gScore} />
          )}
        </div>
      </div>
    </div>
  )
}
