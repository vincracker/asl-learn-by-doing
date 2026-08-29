import { gestureLabel } from '../content/gestures'

/**
 * The live "what the model sees" line.
 *
 * Both evidence numbers are shown on purpose: when a sign won't score, seeing that the
 * shape reads 90 but the model reads 12 tells the learner it's the classifier
 * struggling, not their hand.
 */
export function ModelReadout({
  label,
  mScore,
  gScore,
}: {
  label: string
  mScore: number
  gScore: number
}) {
  return (
    <p className="readout">
      Model sees: {gestureLabel(label)}{' '}
      <span className="dim">
        · model {Math.round(mScore * 100)} · shape {Math.round(gScore * 100)}
      </span>
    </p>
  )
}
