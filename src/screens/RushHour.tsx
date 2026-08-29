import { useCallback, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { RUSH_PASS, RUSH_SECONDS } from '../content/rules'
import { WORD_BANK } from '../content/scenarios'
import { useSignRound, type RoundResult } from '../engine/useSignRound'
import { useProgress } from '../progress/useProgress'
import { CameraView } from '../ui/CameraView'
import { CategoryArt } from '../ui/CategoryArt'
import { GameIntro } from '../ui/GameIntro'
import { GameShell } from '../ui/GameShell'
import { HandPictogram } from '../ui/HandPictogram'
import { Meter } from '../ui/Meter'
import { ModelReadout } from '../ui/ModelReadout'
import { PracticeNotice } from '../ui/PracticeNotice'
import { useDetector } from '../vision/useDetector'
import { useCamera } from '../vision/useCamera'

const TITLE = { title: 'Rush hour', sub: '60 seconds, as many as you can' }

/**
 * Sixty seconds. The phrase is on screen, the sign is not — every sign the model reads
 * at RUSH_PASS or better scores a point.
 */
/** A finished round, plus the record as it stood before that round was played. */
type Outcome = { round: RoundResult; previousBest: number; previousRuns: number }

export function RushHour() {
  const { rushBest, rushRuns, recordRush } = useProgress()
  const [started, setStarted] = useState(false)
  const [outcome, setOutcome] = useState<Outcome | null>(null)
  const [runId, setRunId] = useState(0)

  // Banking the run happens once, here, where the round actually ends. Doing it from
  // an effect in the result view would count the same run twice under StrictMode.
  const handleComplete = useCallback(
    (round: RoundResult) => {
      setOutcome({ round, previousBest: rushBest, previousRuns: rushRuns })
      recordRush(round.hits)
    },
    [rushBest, rushRuns, recordRush],
  )

  if (outcome) {
    return (
      <RushResultView
        outcome={outcome}
        onAgain={() => {
          setOutcome(null)
          setRunId((n) => n + 1)
        }}
      />
    )
  }

  if (!started) return <RushStart onStart={() => setStarted(true)} />

  return <RushRun key={runId} onComplete={handleComplete} />
}

/** The camera-owning round is not mounted until this explicit user action. */
function RushStart({ onStart }: { onStart: () => void }) {
  return (
    <GameShell {...TITLE}>
      <GameIntro
        art={<CategoryArt id="rush" />}
        eyebrow="Ready when you are"
        title={`${RUSH_SECONDS} seconds`}
        description="Recall as many phrases as you can. Your camera stays off until you start, then the first phrase appears as soon as camera access is ready."
        facts={[
          { value: WORD_BANK.length, label: 'Phrases' },
          { value: 'Live', label: 'Camera scoring' },
          { value: 'Best', label: 'Session record' },
        ]}
        action="Start Rush hour"
        onStart={onStart}
      />
    </GameShell>
  )
}

function RushRun({ onComplete }: { onComplete: (r: RoundResult) => void }) {
  const { detector, status: modelStatus } = useDetector()
  const { videoRef, status: cameraStatus } = useCamera()
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  // Keyed by phrase so the reveal resets itself on every new word — asking for help
  // on one phrase must not give the rest away.
  const [revealedFor, setRevealedFor] = useState<string | null>(null)

  const keysOnly = modelStatus !== 'ready' || cameraStatus === 'denied' || cameraStatus === 'error'

  const { word, reading, hits, pulse, skip } = useSignRound({
    videoRef,
    canvasRef,
    detector,
    keysOnly,
    bank: WORD_BANK,
    pass: RUSH_PASS,
    seconds: RUSH_SECONDS,
    enabled: modelStatus !== 'loading' && cameraStatus !== 'starting',
    onComplete,
  })

  const revealed = word !== null && revealedFor === word.phrase

  return (
    <GameShell {...TITLE}>
      <div className="stage two">
        <div>
          <CameraView
            videoRef={videoRef}
            canvasRef={canvasRef}
            status={cameraStatus}
            badge={`${RUSH_SECONDS} SECONDS`}
            keysOnly={keysOnly}
          />
        </div>

        <div>
          <div className="panel">
            <p className="eyebrow">Sign this phrase</p>
            <p className={`taskline${word ? '' : ' waiting'}`}>
              {word ? `“${word.phrase}”` : 'Getting ready…'}
            </p>

            {revealed && word && (
              <div className="teach" style={{ marginTop: 14 }}>
                <div className="handbox handbox--sm">
                  <HandPictogram gesture={word.gesture} size="sm" />
                </div>
                <div className="teachcopy">
                  <p className="howto">{word.tip}</p>
                </div>
              </div>
            )}

            <Meter
              label="Match"
              value={`${Math.round(reading.rolling * 100)}%`}
              fraction={reading.rolling}
              good={reading.rolling >= RUSH_PASS}
            />

            <div className="gamestats">
              <div>
                <p className="k">Time left</p>
                <p className="v">{reading.remaining.toFixed(1)}s</p>
              </div>
              <div>
                <p className="k">Cleared</p>
                <p className={`v${pulse > 0 ? ' hitflash' : ''}`} key={pulse}>
                  {hits}
                </p>
              </div>
            </div>

            <div className="btnrow">
              <button
                className="btn btn-outline"
                onClick={() => setRevealedFor(word?.phrase ?? null)}
                disabled={revealed || !word}
              >
                Show the sign
              </button>
              <button className="btn btn-outline" onClick={skip}>
                Skip →
              </button>
            </div>

            {keysOnly ? (
              <PracticeNotice />
            ) : (
              <ModelReadout label={reading.label} mScore={reading.mScore} gScore={reading.gScore} />
            )}
          </div>
        </div>
      </div>
    </GameShell>
  )
}

function RushResultView({ outcome, onAgain }: { outcome: Outcome; onAgain: () => void }) {
  const { round: result, previousBest, previousRuns } = outcome
  // "New best" has to mean beating an *earlier* attempt, so it is measured against the
  // record as it stood before this run rather than against the run itself.
  const isBest = previousRuns > 0 && result.hits > previousBest

  return (
    <GameShell title="Rush hour" sub="60 seconds">
      <div className="result">
        <p className="eyebrow">Rush hour — {RUSH_SECONDS} seconds</p>
        <div className="bigscore pass">{result.hits}</div>
        <p className="verdict">{result.hits === 1 ? 'sign cleared' : 'signs cleared'}</p>
        <p className="howto">
          {isBest ? (
            <>
              <b style={{ color: 'var(--type)' }}>New best.</b>{' '}
            </>
          ) : (
            <>
              Best this session:{' '}
              <b style={{ color: 'var(--type)' }}>{Math.max(previousBest, result.hits)}</b>.{' '}
            </>
          )}
          {result.skips ? `${result.skips} skipped.` : 'Nothing skipped.'} No gate here — the only
          score to beat is your own.
        </p>
        <div className="btnrow" style={{ justifyContent: 'center' }}>
          <button className="btn btn-primary" onClick={onAgain}>
            Go again
          </button>
          <Link className="btn btn-outline" to="/learn">
            All games
          </Link>
        </div>
      </div>
    </GameShell>
  )
}
