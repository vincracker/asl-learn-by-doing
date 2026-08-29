import { useCallback, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { CameraStage } from '../ui/CameraStage'
import { Disclaimer } from '../ui/Disclaimer'
import { useSignCapture, type CaptureMode } from './useSignCapture'
import { AttemptPanel, type Attempt } from './AttemptPanel'
import { CaptureControls } from './CaptureControls'
import { signById, allTemplates } from '../signs/registry'
import { rankAll } from '../recognition/matcher'
import type { Sequence } from '../recognition/dtw'

/** Watch the reference clip, then mimic it and get scored. The core teaching loop. */
export function LearnMimic() {
  const { signId = '' } = useParams()
  const sign = signById(signId)

  const [mode, setMode] = useState<CaptureMode>('auto')
  const [attempt, setAttempt] = useState<Attempt | null>(null)
  const [attempts, setAttempts] = useState(0)

  const onAttempt = useCallback(
    (sequence: Sequence) => {
      if (!sign?.template) return
      const ranked = rankAll(sequence, allTemplates())
      const expected = ranked.find((r) => r.id === sign.id)
      if (!expected) return
      setAttempt({ best: ranked[0], expected })
      setAttempts((n) => n + 1)
    },
    [sign],
  )

  const capture = useSignCapture({ enabled: Boolean(sign?.template), mode, onAttempt })

  if (!sign) return <p className="muted">Unknown sign. <Link to="/">Back home</Link>.</p>

  return (
    <div className="layout">
      <CameraStage {...capture} frameRef={capture.frameRef} />

      <aside className="stack">
        <div className="panel stack">
          <h2>{sign.gloss}</h2>
          <p className="muted">{sign.how}</p>
          <p className="muted">{sign.hands === 2 ? 'Two hands' : 'One hand'} — keep them in frame.</p>
          {sign.note && <p className="disclaimer">{sign.note}</p>}
        </div>

        {sign.template ? (
          <>
            <div className="panel stack">
              <h3 style={{ fontSize: 15 }}>Reference</h3>
              <video className="clip" src={sign.clipUrl} autoPlay loop muted playsInline />
              <p className="muted">Recorded for this app; loop it until the shape is clear.</p>
            </div>

            <div className="panel stack">
              <CaptureControls
                mode={mode}
                onModeChange={setMode}
                state={capture.captureState}
                onTap={capture.tap}
              />
              <AttemptPanel attempt={attempt} />
              {attempts > 0 && <span className="muted">{attempts} attempts this session</span>}
            </div>
          </>
        ) : (
          <div className="panel stack">
            <h3 style={{ fontSize: 15 }}>Not recorded yet</h3>
            <p className="muted">
              This sign has no reference template, so it can't be scored. Record one in the
              author tool.
            </p>
          </div>
        )}

        <Disclaimer />
      </aside>
    </div>
  )
}
