import { useCallback, useEffect, useRef, useState } from 'react'
import {
  DUEL_HANDOFF_MS,
  DUEL_MATCH_SECONDS,
  DUEL_TURN_SECONDS,
  RUSH_PASS,
} from '../content/rules'
import { WORD_BANK, type Word } from '../content/scenarios'
import { pickNextWord } from '../engine/wordPool'
import { useCountdown } from '../engine/useCountdown'
import { useDuelTurn } from '../engine/useDuelTurn'
import { applyTurn, playerName, startMatch, type Match, type TurnResult } from '../duel/matchState'
import { CameraView } from '../ui/CameraView'
import { GameShell } from '../ui/GameShell'
import { Meter } from '../ui/Meter'
import { ModelReadout } from '../ui/ModelReadout'
import { useDetector } from '../vision/useDetector'
import { useCamera } from '../vision/useCamera'
import { DuelHandoff, type LastTurn } from './duel/DuelHandoff'
import { DuelResult } from './duel/DuelResult'
import { DuelScoreboard } from './duel/DuelScoreboard'
import { DuelStart } from './duel/DuelStart'

const TITLE = { title: 'Rush hour', sub: 'head to head' }

const pickWord = (previous: Word) => pickNextWord(WORD_BANK, previous)

/** Before the one Go press, then the automatic loop: announce, sign, announce, sign. */
type Phase = 'arming' | 'handoff' | 'signing'

/**
 * Two players, one camera, one continuous minute.
 *
 * The camera and the clock are both owned here rather than inside a turn, so they stay
 * live across the handoff. Remounting the camera between turns would re-prompt for
 * permission and put a black frame in front of whoever went second.
 */
export function RushDuel() {
  const [started, setStarted] = useState(false)
  const [completed, setCompleted] = useState<Match | null>(null)

  if (completed) {
    return (
      <GameShell {...TITLE}>
        <DuelResult
          match={completed}
          onAgain={() => {
            setCompleted(null)
            // Back to the Go screen, not straight into another match. The device has
            // to physically change hands here, and the 1.5 s handoff beat is not
            // enough warning for that on its own.
            setStarted(false)
          }}
        />
      </GameShell>
    )
  }

  if (!started) {
    return (
      <GameShell {...TITLE}>
        <DuelStart onGo={() => setStarted(true)} />
      </GameShell>
    )
  }

  // Unmounted on both exits above, so every match starts from a fresh camera and a
  // fresh Match without needing a key to force it.
  return <DuelMatch onComplete={setCompleted} />
}

/** Mounted only after Go, so owning this component is equivalent to camera consent. */
function DuelMatch({ onComplete }: { onComplete: (match: Match) => void }) {
  const { detector, status: modelStatus } = useDetector()
  const { videoRef, status: cameraStatus } = useCamera()
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  const [match, setMatch] = useState<Match>(() => startMatch(pickNextWord(WORD_BANK, null)))
  const [phase, setPhase] = useState<Phase>('arming')
  const [last, setLast] = useState<LastTurn | null>(null)

  const keysOnly = modelStatus !== 'ready' || cameraStatus === 'denied' || cameraStatus === 'error'
  const ready = modelStatus !== 'loading' && cameraStatus !== 'starting'
  // Readiness reveals the first handoff without a synchronous setState effect. Later
  // handoffs are explicit state transitions after each completed turn.
  const visiblePhase: Phase = phase === 'arming' && ready ? 'handoff' : phase

  // Permission and model setup do not consume match time. The minute begins only once
  // the real camera or the keyboard fallback is ready to play.
  const clock = useCountdown(DUEL_MATCH_SECONDS, visiblePhase !== 'arming')

  // The turn loop hands results back from a rAF callback, so it reads the match through
  // a ref. Advancing inside a setState updater instead would apply the turn twice under
  // StrictMode, which double-counts a mistake.
  const matchRef = useRef(match)
  useEffect(() => {
    matchRef.current = match
  })

  const onResult = useCallback(
    (result: TurnResult) => {
      const current = matchRef.current
      setLast({ player: current.turn, result })
      const next = applyTurn(current, result, {
        pickWord,
        // Read the deadline, not the displayed clock: this decides the match, and the
        // display can be up to a tick behind.
        timeRemains: clock.deadline.current - performance.now() > 0,
      })
      setMatch(next)

      // Hand the result to the wrapper so this camera-owning component unmounts and
      // releases the MediaStream before the result screen is shown.
      if (next.outcome) onComplete(next)
      else setPhase('handoff')
    },
    [clock.deadline, onComplete],
  )

  // The handoff runs itself out and starts the next turn. This is the whole reason
  // there is no button here.
  useEffect(() => {
    if (visiblePhase !== 'handoff') return
    const id = setTimeout(() => setPhase('signing'), DUEL_HANDOFF_MS)
    return () => clearTimeout(id)
  }, [visiblePhase, match.round, match.turn])

  const reading = useDuelTurn({
    videoRef,
    canvasRef,
    detector,
    keysOnly,
    target: match.word.gesture,
    pass: RUSH_PASS,
    seconds: DUEL_TURN_SECONDS,
    // A fresh phrase per turn usually restarts the loop on its own, but not reliably:
    // the same phrase can come round again a few turns later. The round and player
    // make the turn identity explicit.
    turnId: `${match.round}-${match.turn}`,
    enabled: visiblePhase === 'signing' && ready,
    onResult,
  })

  return (
    <GameShell {...TITLE}>
      <div className="stage two">
        <div>
          <CameraView
            videoRef={videoRef}
            canvasRef={canvasRef}
            status={cameraStatus}
            badge={
              visiblePhase === 'signing'
                ? `${playerName(match.turn).toUpperCase()} — GO`
                : visiblePhase === 'arming'
                  ? 'SETTING UP CAMERA'
                  : `${DUEL_MATCH_SECONDS} SECONDS, TWO PLAYERS`
            }
            keysOnly={keysOnly}
          />
          <DuelScoreboard
            match={match}
            active={visiblePhase === 'arming' ? null : match.turn}
            remaining={visiblePhase === 'arming' ? DUEL_MATCH_SECONDS : clock.remaining}
          />
        </div>

        <div>
          {visiblePhase === 'arming' && (
            <div className="panel duelhandoff">
              <p className="eyebrow">Getting the game ready</p>
              <p className="taskline">Camera setup</p>
              <p className="howto">
                Allow camera access when prompted. The {DUEL_MATCH_SECONDS}-second clock
                will not start until the camera or practice mode is ready.
              </p>
            </div>
          )}

          {visiblePhase === 'handoff' && (
            <DuelHandoff player={match.turn} round={match.round} last={last} />
          )}

          {visiblePhase === 'signing' && (
            <div className="panel">
              <p className="eyebrow">
                {playerName(match.turn)} · round {match.round}
              </p>
              <p className="taskline">“{match.word.phrase}”</p>

              <Meter
                label="Match"
                value={`${Math.round(reading.rolling * 100)}%`}
                fraction={reading.rolling}
                good={reading.rolling >= RUSH_PASS}
              />
              <Meter
                label="Your turn"
                value={`${reading.remaining.toFixed(1)}s`}
                fraction={1 - reading.remaining / DUEL_TURN_SECONDS}
                dim
              />

              {keysOnly ? (
                <p className="readout">Practice mode: keys 1–6 stand in for a hand.</p>
              ) : (
                <ModelReadout
                  label={reading.label}
                  mScore={reading.mScore}
                  gScore={reading.gScore}
                />
              )}
            </div>
          )}
        </div>
      </div>
    </GameShell>
  )
}
