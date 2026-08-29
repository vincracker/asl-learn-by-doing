import { useCallback, useMemo, useState, type ReactNode } from 'react'
import { ORDER, type SceneId } from '../content/scenarios'
import { PASS } from '../content/rules'
import { ProgressContext } from './progressContext'

type Scores = Partial<Record<SceneId, number>>

/**
 * Session-only progress. No login, no storage — refresh and you start clean.
 *
 * To persist across visits, back `scores` with localStorage; nothing else has to change.
 */
export function ProgressProvider({ children }: { children: ReactNode }) {
  const [scores, setScores] = useState<Scores>({})
  const [rush, setRush] = useState({ best: 0, runs: 0 })
  const [sixSeven, setSixSeven] = useState({ best: 0, runs: 0 })

  const getScore = useCallback((id: SceneId) => scores[id] ?? null, [scores])

  const setScore = useCallback((id: SceneId, value: number) => {
    setScores((prev) => ({ ...prev, [id]: Math.max(prev[id] ?? 0, value) }))
  }, [])

  const isUnlocked = useCallback(
    (id: SceneId) => {
      const i = ORDER.indexOf(id)
      if (i <= 0) return true
      return (scores[ORDER[i - 1]] ?? 0) >= PASS
    },
    [scores],
  )

  const recordRush = useCallback((hits: number) => {
    setRush((prev) => ({ best: Math.max(prev.best, hits), runs: prev.runs + 1 }))
  }, [])

  const recordSixSeven = useCallback((reps: number) => {
    setSixSeven((prev) => ({ best: Math.max(prev.best, reps), runs: prev.runs + 1 }))
  }, [])

  const value = useMemo(
    () => ({
      getScore,
      setScore,
      isUnlocked,
      rushBest: rush.best,
      rushRuns: rush.runs,
      recordRush,
      sixSevenBest: sixSeven.best,
      sixSevenRuns: sixSeven.runs,
      recordSixSeven,
    }),
    [
      getScore,
      setScore,
      isUnlocked,
      rush.best,
      rush.runs,
      recordRush,
      sixSeven.best,
      sixSeven.runs,
      recordSixSeven,
    ],
  )

  return <ProgressContext value={value}>{children}</ProgressContext>
}
