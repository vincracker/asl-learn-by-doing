import { createContext } from 'react'
import type { SceneId } from '../content/scenarios'

export type ProgressState = {
  getScore: (id: SceneId) => number | null
  /** Records a run, keeping the learner's best rather than their latest. */
  setScore: (id: SceneId, value: number) => void
  isUnlocked: (id: SceneId) => boolean
  rushBest: number
  rushRuns: number
  recordRush: (hits: number) => void
}

export const ProgressContext = createContext<ProgressState | null>(null)
