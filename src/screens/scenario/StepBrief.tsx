import { GESTURES, type GestureId } from '../../content/gestures'
import type { Scenario, Step } from '../../content/scenarios'
import { HandPictogram } from '../../ui/HandPictogram'
import { SceneArt } from '../../ui/scenes'
import { TypeLine } from '../../ui/TypeLine'

/** The teaching beat: the other person speaks, and you're shown the shape to reply with. */
export function StepBrief({
  scenario,
  step,
  index,
  total,
  keysOnly,
  onStart,
}: {
  scenario: Scenario
  step: Step
  index: number
  total: number
  keysOnly: boolean
  onStart: () => void
}) {
  return (
    <div className="stage two">
      <div>
        <div className="scene">
          <SceneArt id={scenario.id} />
          <div className="bubble">
            <span className="who">{step.who}</span>
            <TypeLine key={step.npc} text={step.npc} />
          </div>
        </div>
      </div>

      <div>
        <div className="panel">
          <p className="eyebrow">
            Sign {index + 1} of {total} — you reply
          </p>
          <p className="taskline">“{step.phrase}”</p>
          <GestureTeach gesture={step.gesture} tip={step.tip} />
          <div className="btnrow">
            <button className="btn" onClick={onStart}>
              Turn on camera
            </button>
          </div>
          <p className="readout">
            {keysOnly ? 'Practice mode: press keys 1–6 to stand in for a hand.' : ''}
          </p>
        </div>
      </div>
    </div>
  )
}

function GestureTeach({ gesture, tip }: { gesture: GestureId; tip: string }) {
  return (
    <div className="teach" style={{ marginTop: 16 }}>
      <div className="handbox">
        <HandPictogram gesture={gesture} />
      </div>
      <div style={{ flex: 1, minWidth: 190 }}>
        <p className="eyebrow" style={{ color: 'var(--cyan)' }}>
          {GESTURES[gesture].label}
        </p>
        <p className="howto">{tip}</p>
        <p className="howto" style={{ marginTop: 8, fontSize: 12.5 }}>
          The shape is what gets scored — the arrow shows how the sign really travels.
        </p>
      </div>
    </div>
  )
}
