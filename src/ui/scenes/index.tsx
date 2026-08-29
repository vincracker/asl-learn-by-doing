import type { ReactElement } from 'react'
import { AirportScene } from './AirportScene'
import { BusScene } from './BusScene'
import { DuelScene, GuessScene, RushScene, SixSevenScene, SoonScene } from './BonusScenes'

export type SceneArtId = 'airport' | 'bus' | 'guess' | 'rush' | 'duel' | 'sixseven' | 'soon'

const SCENE_ART: Record<SceneArtId, () => ReactElement> = {
  airport: AirportScene,
  bus: BusScene,
  guess: GuessScene,
  rush: RushScene,
  duel: DuelScene,
  sixseven: SixSevenScene,
  soon: SoonScene,
}

/** Looks up a scene illustration by id, so content data can name its own art. */
export function SceneArt({ id }: { id: SceneArtId }) {
  const Art = SCENE_ART[id]
  return <Art />
}
