import { useCallback, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { SIXSEVEN_SECONDS } from '../content/rules'
import { useSixSevenRound, type SixSevenResult } from '../engine/useSixSevenRound'
import { useProgress } from '../progress/useProgress'
import type { Beat, Fault } from '../recognition/sixSeven'
import { CameraView } from '../ui/CameraView'
import { GameShell } from '../ui/GameShell'
import { Meter, Readout } from '../ui/Meter'
import { SeeSaw } from '../ui/SeeSaw'
import { installPracticePole } from '../vision/practiceKeys'
import { useCamera } from '../vision/useCamera'
import { useDetector } from '../vision/useDetector'

const TITLE = { title: '6-7', sub: 'sixty seconds' }

/**
 * One line of coaching per way the pose can fail.
 *
 * A bare counter that refuses to move teaches nothing — the player has to be told
 * which of the four conditions they are missing.
 */
const COACH: Record<Fault, string> = {
  none: 'Good. Now swap — the low hand goes up, the high hand drops.',
  'no-hands': 'Both hands up, palms open, one either side of your face.',
  'one-hand': 'Two hands. 6-7 is the pair or it is nothing.',
  'not-flat': 'Flatten out — all four fingers open, on both hands.',
  together: 'Hands further apart. One left, one right, not stacked.',
}

/** A finished round, plus the record as it stood before that round was played. */
type Outcome = { round: SixSevenResult; previousBest: number; previousRuns: number }

/**
 * Sixty seconds of 6-7.
 *
 * The only mode in the app that scores a movement rather than a shape: two flat palms
 * held apart, alternating up and down. Every full swap-and-back is one 6-7.
 */
export function SixSeven() {
  const { sixSevenBest, sixSevenRuns, recordSixSeven } = useProgress()
  const [outcome, setOutcome] = useState<Outcome | null>(null)
  const [runId, setRunId] = useState(0)

  // Banking the run happens once, here, where the round actually ends. Doing it from
  // an effect in the result view would count the same run twice under StrictMode.
  const handleComplete = useCallback(
    (round: SixSevenResult) => {
      setOutcome({ round, previousBest: sixSevenBest, previousRuns: sixSevenRuns })
      recordSixSeven(round.reps)
    },
    [sixSevenBest, sixSevenRuns, recordSixSeven],
  )

  if (outcome) {
    return (
      <SixSevenResultView
        outcome={outcome}
        onAgain={() => {
          setOutcome(null)
          setRunId((n) => n + 1)
        }}
      />
    )
  }
  return <SixSevenRun key={runId} onComplete={handleComplete} />
}

function SixSevenRun({ onComplete }: { onComplete: (r: SixSevenResult) => void }) {
  const { detector, status: modelStatus } = useDetector()
  const { videoRef, status: cameraStatus } = useCamera()
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  const keysOnly = modelStatus !== 'ready' || cameraStatus === 'denied' || cameraStatus === 'error'

  // Keys 6 and 7 only stand in when there is nothing to stand in for.
  useEffect(() => {
    if (!keysOnly) return
    return installPracticePole()
  }, [keysOnly])

  const reading = useSixSevenRound({
    videoRef,
    canvasRef,
    detector,
    keysOnly,
    enabled: modelStatus !== 'loading' && cameraStatus !== 'starting',
    seconds: SIXSEVEN_SECONDS,
    onComplete,
  })

  const posed = reading.fault === 'none'

  return (
    <GameShell {...TITLE}>
      <div className="stage two">
        <div>
          <CameraView
            videoRef={videoRef}
            canvasRef={canvasRef}
            status={cameraStatus}
            badge="BOTH HANDS"
            keysOnly={keysOnly}
          />
        </div>

        <div>
          <div className="panel">
            <p className="eyebrow">Alternate the palms</p>
            <BeatPair beat={reading.beat} pulse={reading.beats} />
            <SeeSaw tilt={reading.tilt} valid={posed} />
            <p className="howto" style={{ marginTop: 4 }}>
              {COACH[reading.fault]}
            </p>

            <Meter label="Form" value={`${Math.round(reading.form * 100)}%`} fraction={reading.form} good={posed} />
            <Meter
              label="Time left"
              value={`${reading.remaining.toFixed(1)}s`}
              fraction={1 - reading.remaining / SIXSEVEN_SECONDS}
              dim
            />
            {/* Keyed on the count, not the beat: the number only moves on every second
                beat, and flashing an unchanged number reads as a miscount. */}
            <Readout label="6-7s counted" value={reading.reps} flash={reading.reps > 0} key={reading.reps} />
            <Readout label="Run" value={`${reading.chain} beat${reading.chain === 1 ? '' : 's'}`} />

            <p className="readout">
              {keysOnly
                ? 'Practice mode: press 6 and 7, alternating — each press throws the pair one way.'
                : 'Two flat palms, apart. One up, one down, then swap. A swap and a swap back is one 6-7.'}
            </p>
          </div>
        </div>
      </div>
    </GameShell>
  )
}

/**
 * The two halves of the count, lit as they land.
 *
 * Keyed on the beat number so React remounts the digit and replays the flash — the same
 * trick the hit counter uses, since an animation on a node that never unmounts only
 * ever plays once.
 */
function BeatPair({ beat, pulse }: { beat: Beat | null; pulse: number }) {
  return (
    <div className="beatpair">
      <span key={`six-${beat === 'six' ? pulse : 0}`} className={`beatnum${beat === 'six' ? ' on' : ''}`}>
        6
      </span>
      <span className="beatsep">·</span>
      <span key={`seven-${beat === 'seven' ? pulse : 0}`} className={`beatnum${beat === 'seven' ? ' on' : ''}`}>
        7
      </span>
    </div>
  )
}

function SixSevenResultView({ outcome, onAgain }: { outcome: Outcome; onAgain: () => void }) {
  const { round, previousBest, previousRuns } = outcome
  // "New best" has to mean beating an *earlier* attempt, so it is measured against the
  // record as it stood before this run rather than against the run itself.
  const isBest = previousRuns > 0 && round.reps > previousBest

  return (
    <GameShell {...TITLE}>
      <div className="result">
        <p className="eyebrow">6-7 — {SIXSEVEN_SECONDS} seconds</p>
        <div className="bigscore pass">{round.reps}</div>
        <p className="verdict">{round.reps === 1 ? 'six-seven' : 'six-sevens'}</p>
        <p className="howto">
          {isBest ? (
            <>
              <b style={{ color: 'var(--type)' }}>New best.</b>{' '}
            </>
          ) : (
            <>
              Best this session:{' '}
              <b style={{ color: 'var(--type)' }}>{Math.max(previousBest, round.reps)}</b>.{' '}
            </>
          )}
          {round.beats} beat{round.beats === 1 ? '' : 's'} landed, longest run {round.bestChain}.
          Only swaps in rhythm count — drift out of tempo and the run starts over.
        </p>
        <div className="btnrow" style={{ justifyContent: 'center' }}>
          <button className="btn" onClick={onAgain}>
            Go again
          </button>
          <Link className="btn ghost" to="/">
            All games
          </Link>
        </div>
      </div>
    </GameShell>
  )
}
