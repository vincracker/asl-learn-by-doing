import {
  DUEL_MATCH_SECONDS,
  DUEL_MISTAKE_LIMIT,
  DUEL_TURN_SECONDS,
} from '../../content/rules'
import { GameIntro } from '../../ui/GameIntro'

/** The one press in the whole match. Everything after this runs on its own. */
export function DuelStart({ onGo }: { onGo: () => void }) {
  return (
    <GameIntro
      art={<img src="/head-to-head.png" width={1672} height={941} alt="" />}
      eyebrow="Two players, one camera"
      title={`${DUEL_MATCH_SECONDS} seconds`}
      description="Press Go when both players are ready. The match clock waits for camera access before it begins."
      facts={[
        { value: '2', label: 'Players' },
        { value: `${DUEL_TURN_SECONDS}s`, label: 'Each turn' },
        { value: DUEL_MISTAKE_LIMIT, label: 'Mistake limit' },
      ]}
      action="Go — Player 1 first"
      onStart={onGo}
    >
      <ul className="duelrules">
        <li>You take turns automatically — press Go once and don't touch it again.</li>
        <li>
          Every turn draws a <b>random phrase</b> — and never the shape that was just
          played, so you can't copy what you watched.
        </li>
        <li>
          {DUEL_TURN_SECONDS} seconds a turn. Miss it and that's a mistake;{' '}
          {DUEL_MISTAKE_LIMIT} mistakes and you're out.
        </li>
        <li>Most signs cleared when the clock stops wins. Level on clears, faster wins.</li>
      </ul>
    </GameIntro>
  )
}
