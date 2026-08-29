/** One step in a scenario: either dialogue to read, or a sign the learner must produce. */
export type Beat =
  | { kind: 'npc'; speaker: string; text: string }
  | { kind: 'sign'; signId: string; prompt: string; hint?: string }

export type Scenario = {
  id: string
  title: string
  blurb: string
  emoji: string
  beats: Beat[]
}
