import { Link } from 'react-router-dom'
import {
  PLAYER_IDS,
  averageMs,
  formatSeconds,
  playerName,
  type Match,
  type Outcome,
} from '../../duel/matchState'

/** Final board: who won, why, and the two players' numbers side by side. */
export function DuelResult({ match, onAgain }: { match: Match; onAgain: () => void }) {
  const outcome = match.outcome
  if (!outcome) return null

  return (
    <div className="result">
      <p className="eyebrow">Head to head — round {match.round - 1}</p>
      <div className="bigscore pass" style={{ fontSize: 'clamp(44px,11vw,84px)' }}>
        {outcome.kind === 'draw' ? 'DRAW' : playerName(outcome.player).toUpperCase()}
      </div>
      <p className="verdict">{verdict(outcome)}</p>

      <div className="duelfinal">
        {PLAYER_IDS.map((id) => {
          const p = match.players[id]
          const average = averageMs(p)
          const won = outcome.kind === 'winner' && outcome.player === id
          return (
            <div key={id} className={`duelp${won ? ' active' : ''}`}>
              <p className="duelp__name">{playerName(id)}</p>
              <p className="duelp__score">
                {p.clears}
                <span className="dim"> cleared</span>
              </p>
              <dl className="duelstats">
                <dt>Mistakes</dt>
                <dd>{p.mistakes}</dd>
                <dt>Average</dt>
                <dd>{average === null ? '—' : formatSeconds(average)}</dd>
                <dt>Fastest</dt>
                <dd>{p.fastestMs === null ? '—' : formatSeconds(p.fastestMs)}</dd>
              </dl>
            </div>
          )
        })}
      </div>

      <div className="btnrow" style={{ justifyContent: 'center' }}>
        <button className="btn" onClick={onAgain}>
          Rematch
        </button>
        <Link className="btn ghost" to="/">
          All games
        </Link>
      </div>
    </div>
  )
}

function verdict(outcome: Outcome): string {
  if (outcome.kind === 'draw') return 'Level on clears and on time'
  switch (outcome.reason) {
    case 'knockout':
      return 'Opponent hit five mistakes'
    case 'clears':
      return 'Cleared the most when the clock stopped'
    case 'speed':
      return 'Level on clears — won on time'
  }
}
