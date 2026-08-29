import { use } from 'react'
import { DetectorContext, type DetectorState } from './detectorContext'

/** The app-wide recognizer state: loading, ready, or failed over to practice mode. */
export function useDetector(): DetectorState {
  return use(DetectorContext)
}
