import { PASS } from '../../content/rules'
import type { Step } from '../../content/scenarios'

/** Verdict on one sign, with the option to redo it before moving on. */
export function StepResult({
  step,
  score,
  isLast,
  onRetry,
  onNext,
}: {
  step: Step
  score: number
  isLast: boolean
  onRetry: () => void
  onNext: () => void
}) {
  const ok = score >= PASS

  return (
    <div className="stage">
      <div className="panel" style={{ maxWidth: 640, margin: '20px auto', textAlign: 'center' }}>
        <p className="eyebrow">“{step.phrase}”</p>
        <div className={`bigscore ${ok ? 'pass' : 'fail'}`} style={{ fontSize: 'clamp(56px,14vw,96px)' }}>
          {Math.round(score * 100)}
          <span style={{ fontSize: '.4em' }}>%</span>
        </div>
        <p className="verdict" style={{ color: ok ? 'var(--go)' : 'var(--stop)' }}>
          {ok ? 'Clean hold' : 'Too shaky to read'}
        </p>
        <p className="howto">
          {ok
            ? 'The model held a confident lock on your hand. Next line.'
            : 'Try again with the hand closer to the camera, palm square on, and hold still for a full two seconds.'}
        </p>
        <div className="btnrow" style={{ justifyContent: 'center' }}>
          <button className="btn ghost" onClick={onRetry}>
            Retry this sign
          </button>
          <button className="btn" onClick={onNext}>
            {isLast ? 'See your score' : 'Next line'}
          </button>
        </div>
      </div>
    </div>
  )
}
