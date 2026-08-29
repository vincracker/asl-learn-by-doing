import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { CameraStage } from '../ui/CameraStage'
import { ScoreMeter } from '../ui/ScoreMeter'
import { useSignCapture, type CaptureMode } from '../game/useSignCapture'
import { CaptureControls } from '../game/CaptureControls'
import { useTakeRecorder } from './useTakeRecorder'
import { saveSign } from './saveSign'
import { calibrate } from '../recognition/matcher'
import { SIGN_CATALOG } from '../signs/catalog'
import { hasTemplate, allTemplates } from '../signs/registry'
import type { Sequence } from '../recognition/dtw'

/** Below this take-to-take agreement, the takes disagree too much to trust. */
const AGREEMENT_FLOOR = 0.35
const RECOMMENDED_TAKES = 3

/**
 * Dev-only tool for recording reference signs.
 *
 * One pass produces both artefacts: the landmark template used for scoring and the webm
 * clip shown to learners. It reports how consistent your own takes were, because a
 * template built from three different performances scores everyone badly.
 */
export function Author() {
  const [signId, setSignId] = useState(SIGN_CATALOG[0].id)
  const [mode, setMode] = useState<CaptureMode>('tap')
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const [saveError, setSaveError] = useState<string | null>(null)

  const meta = useMemo(() => SIGN_CATALOG.find((s) => s.id === signId)!, [signId])

  // The recorder needs the camera's video element, and the capture hook needs somewhere
  // to deliver finished takes — a genuine cycle. A ref breaks it explicitly rather than
  // relying on hoisting order.
  const finishTakeRef = useRef<(sequence: Sequence) => void>(() => {})
  const capture = useSignCapture({
    enabled: true,
    mode,
    onAttempt: useCallback((sequence: Sequence) => finishTakeRef.current(sequence), []),
  })
  const { takes, startClip, finishTake, removeTake, clearTakes } = useTakeRecorder(capture.videoRef)
  useEffect(() => {
    finishTakeRef.current = finishTake
  }, [finishTake])

  // Calibration is cheap, so recompute on every take instead of behind a button —
  // the author sees agreement drop the moment a bad take lands.
  const calibration = useMemo(() => {
    if (takes.length === 0) return null
    try {
      // Pass the already-recorded signs so the threshold is capped against whichever is
      // most confusable, rather than being set by self-consistency alone.
      return calibrate(signId, meta.gloss, takes.map((t) => t.sequence), allTemplates())
    } catch {
      return null
    }
  }, [takes, signId, meta.gloss])

  // Start the reference clip on the tap that arms the capture, so the recorded video
  // covers the same performance the landmark template is built from.
  const handleTap = useCallback(() => {
    if (capture.captureState === 'idle') startClip()
    capture.tap()
  }, [startClip, capture])

  const handleSave = useCallback(async () => {
    if (!calibration) return
    setSaveState('saving')
    setSaveError(null)
    try {
      // Pair the saved clip with the medoid take where we can, so the demo video shows
      // the same performance the scorer is comparing against.
      await saveSign(signId, calibration, takes.find((t) => t.clip)?.clip ?? null)
      setSaveState('saved')
    } catch (err) {
      setSaveState('error')
      setSaveError(err instanceof Error ? err.message : String(err))
    }
  }, [calibration, signId, takes])

  const switchSign = useCallback((id: string) => {
    setSignId(id)
    clearTakes()
    setSaveState('idle')
  }, [clearTakes])

  const shaky = calibration !== null && takes.length > 1 && calibration.selfAgreement < AGREEMENT_FLOOR

  return (
    <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1.35fr)_minmax(280px,1fr)]">
      <CameraStage {...capture} frameRef={capture.frameRef} />

      <aside className="flex flex-col gap-3">
        <div className="card border-2 border-base-300 bg-base-100">
          <div className="card-body gap-3">
            <h2 className="card-title text-lg">Record a sign</h2>
            <select
              className="select select-bordered w-full"
              value={signId}
              onChange={(e) => switchSign(e.target.value)}
            >
              {SIGN_CATALOG.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.gloss}{hasTemplate(s.id) ? ' ✓' : ''}
                </option>
              ))}
            </select>
            <p className="text-sm opacity-70">{meta.how}</p>
          </div>
        </div>

        <div className="card border-2 border-base-300 bg-base-100">
          <div className="card-body gap-3">
            <CaptureControls
              mode={mode}
              onModeChange={setMode}
              state={capture.captureState}
              onTap={handleTap}
            />
            <p className="text-sm opacity-60">
              Record {RECOMMENDED_TAKES} takes of the same performance. Consistency matters
              more than perfection — the spread between takes sets the pass threshold.
            </p>
          </div>
        </div>

        <div className="card border-2 border-base-300 bg-base-100">
          <div className="card-body gap-3">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-sm font-semibold uppercase tracking-wide opacity-60">
                Takes ({takes.length})
              </h3>
              {takes.length > 0 && (
                <button className="btn btn-ghost btn-xs" onClick={clearTakes}>Clear all</button>
              )}
            </div>

            {takes.length === 0 && <p className="text-sm opacity-60">No takes yet.</p>}
            {takes.map((take, i) => (
              <div key={i} className="flex items-center justify-between gap-2">
                <span className="text-sm opacity-60">
                  Take {i + 1} — {take.sequence.length} frames{take.clip ? ' + clip' : ''}
                </span>
                <button className="btn btn-ghost btn-xs" onClick={() => removeTake(i)}>
                  Remove
                </button>
              </div>
            ))}

            {calibration && takes.length > 1 && (
              <>
                <ScoreMeter
                  score={calibration.selfAgreement}
                  passed={!shaky}
                  label="Take consistency"
                />
                {shaky && (
                  <p className="text-sm opacity-60">
                    Your takes disagree a lot. Re-record them the same way, or learners will
                    be scored against an average of three different signs.
                  </p>
                )}
                {calibration.nearestOther && (
                  <span className="text-sm opacity-60">
                    closest existing sign:{' '}
                    <strong>{calibration.nearestOther.id}</strong>{' '}
                    (d {calibration.nearestOther.distance.toFixed(3)})
                    {calibration.nearestOther.distance < 0.25 &&
                      ' — very close; these two may get confused.'}
                  </span>
                )}
                <span className="text-sm opacity-60">
                  pass distance {calibration.passDistance.toFixed(3)} · tau {calibration.tau.toFixed(3)}
                </span>
              </>
            )}

            <button
              className="btn btn-primary"
              disabled={!calibration || saveState === 'saving'}
              onClick={handleSave}
            >
              {saveState === 'saving' ? 'Saving…' : `Save ${meta.gloss}`}
            </button>

            {saveState === 'saved' && (
              <p className="text-sm opacity-60">
                Saved to src/signs/templates/{signId}.json and public/clips/{signId}.webm —
                reload to pick it up.
              </p>
            )}
            {saveState === 'error' && (
              <p className="text-sm text-error">Save failed: {saveError}</p>
            )}
          </div>
        </div>
      </aside>
    </div>
  )
}
