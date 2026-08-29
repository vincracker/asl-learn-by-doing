import { useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { GESTURES, GESTURE_IDS } from '../content/gestures'
import { GUESS_SECONDS } from '../content/rules'
import type { Word } from '../content/scenarios'
import { useSignRound, type RoundResult } from '../engine/useSignRound'
import { CameraView } from '../ui/CameraView'
import { GameShell } from '../ui/GameShell'
import { HandPictogram } from '../ui/HandPictogram'
import { PracticeNotice } from '../ui/PracticeNotice'
import { Meter } from '../ui/Meter'
import { useDetector } from '../vision/useDetector'
import { useCamera } from '../vision/useCamera'

const TITLE = { title: 'AI guess', sub: 'free play' }

/** A confident lock, higher than a scenario's bar — this mode is about speed, not proof. */
const GUESS_PASS = 0.85

/**
 * Free play: the shape itself is the prompt, so the "phrase" is just its name and the
 * pictogram is always visible.
 */
const SHAPE_BANK: Word[] = GESTURE_IDS.map((gesture) => ({
  phrase: GESTURES[gesture].label,
  gesture,
  tip: '',
}))

export function AiGuess() {
  const [started, setStarted] = useState(false)
  const [result, setResult] = useState<RoundResult | null>(null)
  const [runId, setRunId] = useState(0)

  if (result) {
    return (
      <GuessResultView
        result={result}
        onAgain={() => {
          setResult(null)
          setRunId((n) => n + 1)
        }}
      />
    )
  }

  if (!started) return <GuessStart onStart={() => setStarted(true)} />

  return <GuessRun key={runId} onComplete={setResult} />
}

/** The live recognizer is only mounted after the learner chooses to begin. */
function GuessStart({ onStart }: { onStart: () => void }) {
  return (
    <GameShell {...TITLE}>
      <div className="result">
        <p className="eyebrow">On-device recognition</p>
        <p className="taskline">{GUESS_SECONDS} seconds</p>
        <p className="howto">
          Copy each hand shape and see what the model reads. Your camera stays off until
          you start, and no video leaves this device.
        </p>
        <div className="btnrow" style={{ justifyContent: 'center' }}>
          <button className="btn" onClick={onStart} autoFocus>
            Start AI guess
          </button>
        </div>
      </div>
    </GameShell>
  )
}

function GuessRun({ onComplete }: { onComplete: (r: RoundResult) => void }) {
  const { detector, status: modelStatus } = useDetector()
  const { videoRef, status: cameraStatus } = useCamera()
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  const keysOnly = modelStatus !== 'ready' || cameraStatus === 'denied' || cameraStatus === 'error'
  const bank = useMemo(() => SHAPE_BANK, [])

  const { word, reading, hits, pulse } = useSignRound({
    videoRef,
    canvasRef,
    detector,
    keysOnly,
    bank,
    pass: GUESS_PASS,
    seconds: GUESS_SECONDS,
    enabled: modelStatus !== 'loading' && cameraStatus !== 'starting',
    onComplete,
  })

  const guess = reading.label === 'None' || reading.label === '—' ? '—' : displayLabel(reading.label)

  return (
    <GameShell {...TITLE}>
      <div className="stage two">
        <div>
          <CameraView
            videoRef={videoRef}
            canvasRef={canvasRef}
            status={cameraStatus}
            badge="LIVE"
            keysOnly={keysOnly}
          />
        </div>

        <div>
          <div className="panel">
            <p className="eyebrow">Make this sign</p>
            <p className={`taskline${word ? '' : ' waiting'}`}>
              {word?.phrase ?? 'Getting ready…'}
            </p>
            {word && (
              <div className="handbox" style={{ marginTop: 16 }}>
                <HandPictogram gesture={word.gesture} />
              </div>
            )}

            <Meter
              label="Model's guess"
              value={guess === '—' ? <span className="dim">waiting for a hand</span> : guess}
              fraction={reading.rolling}
              good={reading.rolling >= GUESS_PASS}
            />

            <div className="gamestats">
              <div>
                <p className="k">Time left</p>
                <p className="v">{reading.remaining.toFixed(1)}s</p>
              </div>
              <div>
                <p className="k">Hits</p>
                <p className={`v${pulse > 0 ? ' hitflash' : ''}`} key={pulse}>
                  {hits}
                </p>
              </div>
            </div>

            {keysOnly ? (
              <PracticeNotice />
            ) : (
              <p className="readout">Any hand shape is read live — nothing is uploaded.</p>
            )}
          </div>
        </div>
      </div>
    </GameShell>
  )
}

function displayLabel(name: string) {
  return GESTURES[name as keyof typeof GESTURES]?.label ?? name
}

function GuessResultView({ result, onAgain }: { result: RoundResult; onAgain: () => void }) {
  return (
    <GameShell {...TITLE}>
      <div className="result">
        <p className="eyebrow">AI guess — {GUESS_SECONDS} seconds</p>
        <div className="bigscore pass">{result.hits}</div>
        <p className="verdict">Signs recognised</p>
        <p className="howto">No gate here, no score to beat but your own.</p>
        <div className="btnrow" style={{ justifyContent: 'center' }}>
          <button className="btn btn-outline" onClick={onAgain}>
            Go again
          </button>
          <Link className="btn btn-primary" to="/learn">
            All games
          </Link>
        </div>
      </div>
    </GameShell>
  )
}
