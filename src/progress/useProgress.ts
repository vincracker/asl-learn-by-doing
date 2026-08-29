import { use } from 'react'
import { ProgressContext, type ProgressState } from './progressContext'

/** Session progress: scenario bests, the unlock gate, and the rush-hour record. */
export function useProgress(): ProgressState {
  const ctx = use(ProgressContext)
  if (!ctx) throw new Error('useProgress must be used inside <ProgressProvider>')
  return ctx
}
