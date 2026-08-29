import { DUEL_HANDOFF_MS, DUEL_TURN_SECONDS } from '../../content/rules'
import { formatSeconds, playerName, type PlayerId, type TurnResult } from '../../duel/matchState'

export type LastTurn = { player: PlayerId; result: TurnResult }

/**
 * The beat between turns.
 *
 * No button: the players hit Go once at the top of the match, and after that the turn
 * hands over on its own. A press per turn made two people fight over one keyboard
 * between every sign.
 */
export function DuelHandoff({
  player,
  round,
  last,
}: {
  player: PlayerId
  round: number
  last: LastTurn | null
}) {
  return (
    <div className="panel duelhandoff">
      {last && <LastTurnLine last={last} />}
      <p className="eyebrow">Round {round} · get ready</p>
      <p className="duelhandoff__name">{playerName(player)}</p>
      <p className="howto">
        Step in front of the camera. Your {DUEL_TURN_SECONDS} seconds start when the phrase
        appears.
      </p>
      <div className="handoffbar" aria-hidden="true">
        <i style={{ animationDuration: `${DUEL_HANDOFF_MS}ms` }} />
      </div>
    </div>
  )
}

function LastTurnLine({ last }: { last: LastTurn }) {
  const { player, result } = last
  const summary =
    result.kind === 'clear'
      ? `cleared it in ${formatSeconds(result.ms)}`
      : 'ran out of time — mistake'

  return (
    <p
      className="duellast"
      style={{ color: result.kind === 'clear' ? 'var(--go)' : 'var(--stop)' }}
    >
      {playerName(player)} {summary}
    </p>
  )
}
