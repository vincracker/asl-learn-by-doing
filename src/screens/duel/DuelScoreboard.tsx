import { DUEL_MATCH_SECONDS, DUEL_MISTAKE_LIMIT } from '../../content/rules'
import {
  averageMs,
  formatSeconds,
  playerName,
  type Match,
  type PlayerId,
} from '../../duel/matchState'

/**
 * The live head-to-head strip, with the shared match clock between the two players.
 *
 * Both the clear count and the average time are shown, because they are the two things
 * that decide the match: level on clears, the faster average takes it.
 */
export function DuelScoreboard({
  match,
  active,
  remaining,
}: {
  match: Match
  active: PlayerId | null
  remaining: number
}) {
  return (
    <div className="duelboard">
      <PlayerPanel
        id={0}
        state={match.players[0]}
        active={active === 0}
        out={match.players[0].mistakes >= DUEL_MISTAKE_LIMIT}
      />

      <div className="duelclock">
        <p className="duelclock__value">{remaining.toFixed(1)}</p>
        <p className="duelclock__label">seconds left</p>
        <div className="duelclock__bar">
          <i style={{ width: `${(remaining / DUEL_MATCH_SECONDS) * 100}%` }} />
        </div>
      </div>

      <PlayerPanel
        id={1}
        state={match.players[1]}
        active={active === 1}
        out={match.players[1].mistakes >= DUEL_MISTAKE_LIMIT}
      />
    </div>
  )
}

function PlayerPanel({
  id,
  state,
  active,
  out,
}: {
  id: PlayerId
  state: Match['players'][number]
  active: boolean
  out: boolean
}) {
  const average = averageMs(state)

  return (
    <div className={`duelp${active ? ' active' : ''}${out ? ' out' : ''}`}>
      <p className="duelp__name">{playerName(id)}</p>
      <p className="duelp__score">{state.clears}</p>
      <div className="lives" aria-label={`${state.mistakes} of ${DUEL_MISTAKE_LIMIT} mistakes`}>
        {Array.from({ length: DUEL_MISTAKE_LIMIT }, (_, i) => (
          <span key={i} className={`life${i < state.mistakes ? ' spent' : ''}`} />
        ))}
      </div>
      <p className="duelp__time">{average === null ? '—' : `${formatSeconds(average)} avg`}</p>
    </div>
  )
}
