import { dtwDistance, resample, RESAMPLE_LEN, type Sequence } from './dtw'
import { mirrorFeature } from './normalize'

/** A recorded reference for one sign, produced by the /author tool. */
export type SignTemplate = {
  id: string
  gloss: string
  /** Medoid take, resampled to RESAMPLE_LEN and stored as plain arrays for JSON. */
  frames: number[][]
  /** Distance scale derived from take-to-take spread at authoring time. */
  tau: number
  /** Distance below which an attempt counts as correct. */
  passDistance: number
  /** How consistent the author's own takes were, 0..1. Low means re-record. */
  selfAgreement: number
  /** Closest already-recorded sign, if any were known at authoring time. */
  nearestOther?: { id: string; distance: number }
}

export type MatchResult = {
  id: string
  distance: number
  score: number
  passed: boolean
}

/** Floor/ceiling on the derived tau, so one sloppy authoring session can't break scoring. */
const TAU_MIN = 0.02
const TAU_MAX = 0.2

/** Attempts may be this much looser than the author's own take-to-take spread. */
const PASS_TOLERANCE = 1.8

/**
 * Hard ceiling on any pass threshold.
 *
 * Measured distance between two genuinely different one-handed signs is around 0.39, so
 * a threshold above roughly 0.3 stops discriminating and starts accepting anything. An
 * inconsistent recording session must never be able to widen the gate past this.
 */
export const PASS_DISTANCE_MAX = 0.28

/** A threshold may not exceed this fraction of the distance to the nearest other sign. */
const CONFUSABILITY_MARGIN = 0.45

export function templateToSequence(template: SignTemplate): Sequence {
  return template.frames.map((f) => Float32Array.from(f))
}

export function sequenceToFrames(seq: Sequence): number[][] {
  return resample(seq, RESAMPLE_LEN).map((f) => Array.from(f))
}

/**
 * Turns a raw DTW distance into a 0..1 score using the sign's own tau, so a sign that is
 * inherently hard to reproduce isn't unfairly penalised against an easy one.
 */
export function scoreFor(distance: number, tau: number): number {
  return Math.exp(-distance / Math.max(tau, TAU_MIN))
}

/** Scores an attempt against a single template. */
export function matchTemplate(
  attempt: Sequence,
  template: SignTemplate,
  leftHanded = false,
): MatchResult {
  let reference = templateToSequence(template)
  if (leftHanded) reference = reference.map(mirrorFeature)

  const distance = dtwDistance(attempt, reference)
  return {
    id: template.id,
    distance,
    score: scoreFor(distance, template.tau),
    passed: distance <= template.passDistance,
  }
}

/**
 * Scores an attempt against every known sign, best first.
 *
 * Ranking the whole set costs almost nothing and buys much better feedback: when a
 * learner fails, we can name the sign they actually produced instead of showing a bare
 * number.
 */
export function rankAll(
  attempt: Sequence,
  templates: SignTemplate[],
  leftHanded = false,
): MatchResult[] {
  return templates
    .map((t) => matchTemplate(attempt, t, leftHanded))
    .sort((a, b) => a.distance - b.distance)
}

/**
 * Derives a template from several takes of the same sign.
 *
 * The medoid take (the one closest to all the others) becomes the reference, and the
 * spread among takes sets tau and the pass threshold. This is what keeps thresholds from
 * becoming a pile of hand-tuned magic numbers — a sign performed inconsistently gets a
 * correspondingly forgiving threshold, and its low `selfAgreement` tells the author to
 * record it again.
 */
export function calibrate(
  id: string,
  gloss: string,
  takes: Sequence[],
  others: SignTemplate[] = [],
): SignTemplate {
  if (takes.length === 0) throw new Error(`cannot calibrate "${id}" with no takes`)

  const resampled = takes.map((t) => resample(t, RESAMPLE_LEN))

  if (resampled.length === 1) {
    const single = sequenceToFrames(resampled[0])
    return finish({
      id, gloss,
      frames: single,
      tau: 0.12,
      passDistance: 0.12 * PASS_TOLERANCE * 0.5,
      selfAgreement: 0,
    }, resampled[0], others)
  }

  // Pairwise distances: pick the medoid and measure the spread in one pass.
  const totals = new Array<number>(resampled.length).fill(0)
  const pairs: number[] = []
  for (let i = 0; i < resampled.length; i++) {
    for (let j = i + 1; j < resampled.length; j++) {
      const d = dtwDistance(resampled[i], resampled[j])
      totals[i] += d
      totals[j] += d
      pairs.push(d)
    }
  }

  const medoid = totals.indexOf(Math.min(...totals))
  const meanSpread = pairs.reduce((a, b) => a + b, 0) / pairs.length
  const tau = clamp(meanSpread, TAU_MIN, TAU_MAX)

  return finish({
    id,
    gloss,
    frames: sequenceToFrames(resampled[medoid]),
    tau,
    passDistance: tau * PASS_TOLERANCE,
    selfAgreement: scoreFor(meanSpread, tau),
  }, resampled[medoid], others)
}

/**
 * Re-derives every template's confusability cap against the whole set.
 *
 * `calibrate` can only see the signs recorded before it, which makes thresholds depend on
 * recording order — the first sign recorded never gets capped against its closest rival,
 * which is precisely the sign most likely to be confused with something. Running this
 * over the full set makes the gates a property of the vocabulary rather than of the order
 * someone happened to record it in.
 *
 * Applied once when templates are loaded, so stored files stay untouched.
 */
export function applyConfusabilityCaps(templates: SignTemplate[]): SignTemplate[] {
  if (templates.length < 2) return templates.map((t) => ({ ...t }))

  const sequences = new Map(templates.map((t) => [t.id, templateToSequence(t)]))

  return templates.map((template) => {
    const mine = sequences.get(template.id)!

    const nearest = templates.reduce<{ id: string; distance: number } | undefined>(
      (best, other) => {
        if (other.id === template.id) return best
        const distance = dtwDistance(mine, sequences.get(other.id)!)
        return !best || distance < best.distance ? { id: other.id, distance } : best
      },
      undefined,
    )

    const passDistance = nearest
      ? Math.min(template.passDistance, nearest.distance * CONFUSABILITY_MARGIN)
      : template.passDistance

    return { ...template, passDistance, nearestOther: nearest }
  })
}

/**
 * Applies the safety caps to a freshly derived template.
 *
 * Self-consistency alone is not enough to set a threshold: a sign recorded sloppily gets
 * a wide gate, and a wide gate will happily admit a *different* sign. So the gate is also
 * held below a fraction of the distance to the nearest sign already recorded, and below
 * an absolute ceiling. The cost is that an inconsistent recording becomes hard to pass —
 * which is the correct failure, and the author tool surfaces it as low take consistency.
 */
function finish(
  template: SignTemplate,
  reference: Sequence,
  others: SignTemplate[],
): SignTemplate {
  const rivals = others.filter((o) => o.id !== template.id)

  const nearest = rivals.reduce<{ id: string; distance: number } | undefined>((best, other) => {
    const distance = dtwDistance(reference, templateToSequence(other))
    return !best || distance < best.distance ? { id: other.id, distance } : best
  }, undefined)

  const caps = [template.passDistance, PASS_DISTANCE_MAX]
  if (nearest) caps.push(nearest.distance * CONFUSABILITY_MARGIN)

  return { ...template, passDistance: Math.min(...caps), nearestOther: nearest }
}

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v))
