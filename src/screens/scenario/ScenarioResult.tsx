import { Link } from 'react-router-dom'
import { PASS } from '../../content/rules'
import { ORDER, SCENARIOS, type Scenario } from '../../content/scenarios'

/** End of a scenario: the averaged score, a per-word breakdown, and the gate verdict. */
export function ScenarioResult({
  scenario,
  scores,
  onReplay,
}: {
  scenario: Scenario
  scores: number[]
  onReplay: () => void
}) {
  const average = scores.reduce((a, b) => a + b, 0) / scores.length
  const ok = average >= PASS
  const nextId = ORDER[ORDER.indexOf(scenario.id) + 1]

  return (
    <div className="result">
      <p className="eyebrow">{scenario.name} complete</p>
      <div className={`bigscore ${ok ? 'pass' : 'fail'}`}>
        {Math.round(average * 100)}
        <span style={{ fontSize: '.34em' }}>%</span>
      </div>
      <p className="verdict" style={{ color: ok ? 'var(--go)' : 'var(--stop)' }}>
        {ok
          ? `Passed — ${Math.round(PASS * 100)}% needed`
          : `Under ${Math.round(PASS * 100)}% — replay to unlock`}
      </p>

      <div className="breakdown">
        {scenario.steps.map((step, i) => (
          <div className="brow" key={step.phrase}>
            <span className="n">{step.phrase}</span>
            <span className="pct">{Math.round(scores[i] * 100)}%</span>
            <span className="b">
              <i
                style={{
                  width: `${scores[i] * 100}%`,
                  background: scores[i] >= PASS ? 'var(--go)' : 'var(--stop)',
                }}
              />
            </span>
          </div>
        ))}
      </div>

      <p className="howto">
        {ok ? (
          nextId ? (
            <>
              <b style={{ color: 'var(--type)' }}>{SCENARIOS[nextId].name}</b> is now unlocked.
            </>
          ) : (
            "That's every scenario built so far. More are in development."
          )
        ) : (
          'Your three best word scores are averaged. Replay any time — nothing is lost.'
        )}
      </p>

      <div className="btnrow" style={{ justifyContent: 'center' }}>
        <button className="btn ghost" onClick={onReplay}>
          Play again
        </button>
        {ok && nextId ? (
          <Link className="btn" to={`/scenario/${nextId}`}>
            Start {SCENARIOS[nextId].name}
          </Link>
        ) : (
          <Link className="btn" to="/">
            All games
          </Link>
        )}
      </div>
    </div>
  )
}
