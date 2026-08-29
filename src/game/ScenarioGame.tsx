import { useCallback, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { CameraStage } from '../ui/CameraStage'
import { Disclaimer } from '../ui/Disclaimer'
import { useSignCapture, type CaptureMode } from './useSignCapture'
import { AttemptPanel, type Attempt } from './AttemptPanel'
import { CaptureControls } from './CaptureControls'
import { scenarioById, type Beat } from '../scenarios'
import { signById, allTemplates, hasTemplate } from '../signs/registry'
import { rankAll } from '../recognition/matcher'
import type { Sequence } from '../recognition/dtw'

/** After this many misses on one beat, the learner may skip so the scene can't deadlock. */
const SKIP_AFTER = 3

export function ScenarioGame() {
  const { scenarioId = '' } = useParams()
  const scenario = scenarioById(scenarioId)

  const [index, setIndex] = useState(0)
  const [mode, setMode] = useState<CaptureMode>('auto')
  const [attempt, setAttempt] = useState<Attempt | null>(null)
  const [misses, setMisses] = useState(0)
  const [passed, setPassed] = useState<string[]>([])

  const beat: Beat | undefined = scenario?.beats[index]
  const isSignBeat = beat?.kind === 'sign'
  // Only score beats whose sign actually has a template; otherwise the beat is
  // presented but not gated, so a half-recorded catalog still demos end to end.
  const scorable = isSignBeat && hasTemplate(beat.signId)

  const advance = useCallback(() => {
    setIndex((i) => i + 1)
    setAttempt(null)
    setMisses(0)
  }, [])

  const onAttempt = useCallback(
    (sequence: Sequence) => {
      if (!beat || beat.kind !== 'sign') return
      const ranked = rankAll(sequence, allTemplates())
      const expected = ranked.find((r) => r.id === beat.signId)
      if (!expected) return

      setAttempt({ best: ranked[0], expected })
      if (expected.passed) {
        setPassed((p) => (p.includes(beat.signId) ? p : [...p, beat.signId]))
        window.setTimeout(advance, 900)
      } else {
        setMisses((m) => m + 1)
      }
    },
    [beat, advance],
  )

  const capture = useSignCapture({ enabled: Boolean(scorable), mode, onAttempt })

  const progress = useMemo(
    () => scenario?.beats.filter((b) => b.kind === 'sign') ?? [],
    [scenario],
  )

  if (!scenario) {
    return (
      <p className="opacity-60">
        Unknown scenario. <Link className="link link-accent" to="/">Back home</Link>.
      </p>
    )
  }

  if (!beat) {
    return (
      <div className="card border-2 border-base-300 bg-base-100">
        <div className="card-body gap-3">
          <h2 className="card-title text-2xl">{scenario.emoji} Scene complete</h2>
          <p className="opacity-70">
            You signed {passed.length} of {progress.length} prompts well enough to pass.
          </p>
          <div className="card-actions">
            <button className="btn btn-primary" onClick={() => { setIndex(0); setPassed([]) }}>
              Run it again
            </button>
            <Link className="btn btn-ghost" to="/">Back home</Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1.35fr)_minmax(280px,1fr)]">
      <CameraStage {...capture} frameRef={capture.frameRef} />

      <aside className="flex flex-col gap-3">
        <div className="card border-2 border-base-300 bg-base-100">
          <div className="card-body gap-3">
            <div className="flex items-center justify-between gap-2">
              <h2 className="card-title text-lg">{scenario.emoji} {scenario.title}</h2>
              <ProgressDots beats={scenario.beats} index={index} />
            </div>

            {beat.kind === 'npc' ? (
              <>
                <div className="flex flex-col gap-1.5">
                  <span className="text-xs font-bold uppercase tracking-wider opacity-60">
                    {beat.speaker}
                  </span>
                  <p className="leading-relaxed">{beat.text}</p>
                </div>
                <button className="btn btn-primary" onClick={advance}>Continue</button>
              </>
            ) : (
              <div className="flex flex-col gap-1.5">
                <span className="text-xs font-bold uppercase tracking-wider opacity-60">
                  Your turn
                </span>
                <p className="leading-relaxed">{beat.prompt}</p>
                {beat.hint && <p className="text-sm opacity-60">{beat.hint}</p>}
                <p className="text-sm opacity-60">
                  Sign: <strong>{signById(beat.signId)?.gloss ?? beat.signId}</strong>
                </p>
              </div>
            )}
          </div>
        </div>

        {isSignBeat && (
          <div className="card border-2 border-base-300 bg-base-100">
            <div className="card-body gap-3">
              {scorable ? (
                <>
                  <CaptureControls
                    mode={mode}
                    onModeChange={setMode}
                    state={capture.captureState}
                    onTap={capture.tap}
                  />
                  <AttemptPanel attempt={attempt} />
                </>
              ) : (
                <p className="text-sm opacity-60">
                  This sign has no template recorded yet, so it can't be scored — practise it
                  and continue.
                </p>
              )}

              <div className="card-actions">
                <Link className="btn btn-ghost btn-sm" to={`/practice/${beat.signId}`}>
                  Practise this sign
                </Link>
                {(misses >= SKIP_AFTER || !scorable) && (
                  <button className="btn btn-sm" onClick={advance}>Skip this one</button>
                )}
              </div>
              {misses > 0 && misses < SKIP_AFTER && (
                <span className="text-sm opacity-60">
                  {SKIP_AFTER - misses} more tries before you can skip.
                </span>
              )}
            </div>
          </div>
        )}

        <Disclaimer />
      </aside>
    </div>
  )
}

function ProgressDots({ beats, index }: { beats: Beat[]; index: number }) {
  return (
    <div className="flex gap-1.5">
      {beats.map((beat, i) => (
        <span
          key={i}
          className={`size-2 rounded-full ${
            i === index ? 'bg-primary' : i < index ? 'bg-accent' : 'bg-base-300'
          }`}
          title={beat.kind === 'sign' ? beat.signId : 'dialogue'}
        />
      ))}
    </div>
  )
}
