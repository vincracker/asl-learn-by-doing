import { createContext } from 'react'
import type { Detector } from './recognizer'

export type DetectorState =
  | { status: 'loading'; detector: null; message: string }
  | { status: 'ready'; detector: Detector; message: string }
  | { status: 'error'; detector: null; message: string }

export const LOADING: DetectorState = {
  status: 'loading',
  detector: null,
  message: 'Starting the gesture model…',
}

export const DetectorContext = createContext<DetectorState>(LOADING)
