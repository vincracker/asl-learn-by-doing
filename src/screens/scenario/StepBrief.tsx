import { GESTURES, type GestureId } from '../../content/gestures'
import type { Scenario, Step } from '../../content/scenarios'
import { HandPictogram } from '../../ui/HandPictogram'
import { PracticeNotice } from '../../ui/PracticeNotice'
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
        {/* The stage the camera will occupy: framed now, filled once it's on. */}
        <div className="scene">
          <div className="brackets" aria-hidden="true">
            <i />
            <i />
            <i />
            <i />
          </div>
          <p className="stagelabel">{scenario.tagline}</p>
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
            <button className="btn btn-primary" onClick={onStart}>
              Turn on the camera
            </button>
          </div>
          {keysOnly && <PracticeNotice />}
        </div>
      </div>
    </div>
  )
}

function GestureTeach({ gesture, tip }: { gesture: GestureId; tip: string }) {
  return (
    <div className="teach">
      <div className="handbox">
        <HandPictogram gesture={gesture} />
      </div>
      <div className="teachcopy">
        <p className="label">{GESTURES[gesture].label}</p>
        <p className="howto">{tip}</p>
      </div>
    </div>
  )
}
