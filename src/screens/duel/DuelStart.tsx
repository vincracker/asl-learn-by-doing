import {
  DUEL_MATCH_SECONDS,
  DUEL_MISTAKE_LIMIT,
  DUEL_TURN_SECONDS,
} from '../../content/rules'

/** The one press in the whole match. Everything after this runs on its own. */
export function DuelStart({ onGo }: { onGo: () => void }) {
  return (
    <div className="panel duelhandoff">
      <p className="eyebrow">Two players, one camera</p>
      <p className="taskline">{DUEL_MATCH_SECONDS} seconds</p>
      <p className="howto">
        Your camera stays off on this screen. Press Go when both players are ready;
        the match clock waits for camera access before it begins.
      </p>
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
      <div className="btnrow">
        <button className="btn" onClick={onGo} autoFocus>
          Go — Player 1 first
        </button>
      </div>
    </div>
  )
}
