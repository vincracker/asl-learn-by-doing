import { useCallback, useEffect, useState } from 'react'
import { Navigate, useParams } from 'react-router-dom'
import { SCENARIOS, isSceneId } from '../content/scenarios'
import { useProgress } from '../progress/useProgress'
import { GameShell, StepPips } from '../ui/GameShell'
import { useDetector } from '../vision/useDetector'
import { ScenarioResult } from './scenario/ScenarioResult'
import { StepBrief } from './scenario/StepBrief'
import { StepCapture } from './scenario/StepCapture'
import { StepResult } from './scenario/StepResult'

type Phase = 'brief' | 'capture' | 'verdict' | 'complete'

type Run = {
  index: number
  phase: Phase
  /** One entry per completed sign, in order. */
  scores: number[]
}

const FRESH: Run = { index: 0, phase: 'brief', scores: [] }

/**
 * Drives one pass through a scenario: brief → capture → verdict, three times, then the
 * averaged result.
 *
 * The run is keyed by scenario id so navigating straight from one scenario's result into
 * the next starts the new one clean rather than inheriting the old scores.
 */
export function ScenarioGame() {
  const { scenarioId } = useParams()
  if (!isSceneId(scenarioId)) return <Navigate to="/" replace />
  return <ScenarioRun key={scenarioId} id={scenarioId} />
}

function ScenarioRun({ id }: { id: 'airport' | 'bus' }) {
  const scenario = SCENARIOS[id]
  const { status } = useDetector()
  const { setScore, isUnlocked } = useProgress()
  const [run, setRun] = useState<Run>(FRESH)

  const step = scenario.steps[run.index]
  const isLast = run.index === scenario.steps.length - 1
  const lastScore = run.scores[run.index]

  const onAttemptDone = useCallback((score: number) => {
    setRun((prev) => ({
      ...prev,
      phase: 'verdict',
      scores: [...prev.scores.slice(0, prev.index), score],
    }))
  }, [])

  // Banking the average is a side effect of finishing, so it belongs here rather than
  // in the result view, which re-renders on every navigation.
  useEffect(() => {
    if (run.phase !== 'complete') return
    const average = run.scores.reduce((a, b) => a + b, 0) / run.scores.length
    setScore(id, average)
  }, [run.phase, run.scores, id, setScore])

  if (!isUnlocked(id)) return <Navigate to="/" replace />

  return (
    <GameShell
      title={scenario.name}
      sub={scenario.tagline}
      pips={
        run.phase !== 'complete' ? (
          <StepPips total={scenario.steps.length} current={run.index} />
        ) : undefined
      }
    >
      {run.phase === 'brief' && (
        <StepBrief
          scenario={scenario}
          step={step}
          index={run.index}
          total={scenario.steps.length}
          keysOnly={status !== 'ready'}
          onStart={() => setRun((p) => ({ ...p, phase: 'capture' }))}
        />
      )}

      {run.phase === 'capture' && <StepCapture step={step} onDone={onAttemptDone} />}

      {run.phase === 'verdict' && (
        <StepResult
          step={step}
          score={lastScore}
          isLast={isLast}
          onRetry={() =>
            setRun((p) => ({ ...p, phase: 'capture', scores: p.scores.slice(0, p.index) }))
          }
          onNext={() =>
            setRun((p) =>
              isLast ? { ...p, phase: 'complete' } : { ...p, index: p.index + 1, phase: 'brief' },
            )
          }
        />
      )}

      {run.phase === 'complete' && (
        <ScenarioResult
          scenario={scenario}
          scores={run.scores}
          onReplay={() => setRun(FRESH)}
        />
      )}
    </GameShell>
  )
}
