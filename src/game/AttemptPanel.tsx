import type { MatchResult } from '../recognition/matcher'
import { signMeta } from '../signs/catalog'
import { ScoreMeter } from '../ui/ScoreMeter'

export type Attempt = {
  best: MatchResult
  expected: MatchResult
}

/**
 * Feedback for one attempt.
 *
 * When the learner misses, we name the sign their hands actually resembled — far more
 * useful than a bare percentage, and it comes free from ranking every template.
 */
export function AttemptPanel({ attempt }: { attempt: Attempt | null }) {
  if (!attempt) {
    return (
      <p className="text-sm opacity-60">
        Sign when you're ready — your attempt is scored automatically.
      </p>
    )
  }

  const { expected, best } = attempt
  const confused = !expected.passed && best.id !== expected.id && best.score > 0.25

  return (
    <div className="flex flex-col gap-2.5">
      <span className={`font-semibold ${expected.passed ? 'text-success' : 'text-warning'}`}>
        {expected.passed ? 'Nice — that reads clearly.' : 'Not quite yet.'}
      </span>
      <ScoreMeter score={expected.score} passed={expected.passed} label={signMeta(expected.id).gloss} />
      {confused && (
        <p className="text-sm opacity-60">
          That looked closer to <strong>{signMeta(best.id).gloss}</strong>. Check your
          handshape and where your hands sit relative to your face.
        </p>
      )}
      {!expected.passed && !confused && (
        <p className="text-sm opacity-60">
          Try a slower, more deliberate movement, and keep both hands in frame.
        </p>
      )}
    </div>
  )
}
