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

  if (!sign) {
    return (
      <p className="opacity-60">
        Unknown sign. <Link className="link link-accent" to="/">Back home</Link>.
      </p>
    )
  }

  return (
    <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1.35fr)_minmax(280px,1fr)]">
      <CameraStage {...capture} frameRef={capture.frameRef} />

      <aside className="flex flex-col gap-3">
        <div className="card border-2 border-base-300 bg-base-100">
          <div className="card-body gap-2">
            <h2 className="card-title text-xl">{sign.gloss}</h2>
            <p className="text-sm opacity-70">{sign.how}</p>
            <p className="text-sm opacity-60">
              {sign.hands === 2 ? 'Two hands' : 'One hand'} — keep them in frame.
            </p>
            {sign.note && (
              <p className="border-l-2 border-base-300 pl-3 text-xs leading-relaxed opacity-70">
                {sign.note}
              </p>
            )}
          </div>
        </div>

        {sign.template ? (
          <>
            <div className="card border-2 border-base-300 bg-base-100">
              <div className="card-body gap-3">
                <h3 className="text-sm font-semibold uppercase tracking-wide opacity-60">
                  Reference
                </h3>
                <video className="clip" src={sign.clipUrl} autoPlay loop muted playsInline />
                <p className="text-sm opacity-60">
                  Recorded for this app; loop it until the shape is clear.
                </p>
              </div>
            </div>

            <div className="card border-2 border-base-300 bg-base-100">
              <div className="card-body gap-3">
                <CaptureControls
                  mode={mode}
                  onModeChange={setMode}
                  state={capture.captureState}
                  onTap={capture.tap}
                />
                <AttemptPanel attempt={attempt} />
                {attempts > 0 && (
                  <span className="text-sm opacity-60">{attempts} attempts this session</span>
                )}
              </div>
            </div>
          </>
        ) : (
          <div className="card border-2 border-base-300 bg-base-100">
            <div className="card-body gap-2">
              <h3 className="text-sm font-semibold uppercase tracking-wide opacity-60">
                Not recorded yet
              </h3>
              <p className="text-sm opacity-70">
                This sign has no reference template, so it can't be scored. Record one in the
                author tool.
              </p>
            </div>
          </div>
        )}

        <Disclaimer />
      </aside>
    </div>
  )
}
