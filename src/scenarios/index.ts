import { greetingScenario } from './greeting'
import { cafeScenario } from './cafe'
import type { Scenario } from './types'

export const SCENARIOS: Scenario[] = [greetingScenario, cafeScenario]

export function scenarioById(id: string): Scenario | undefined {
  return SCENARIOS.find((s) => s.id === id)
}

export type { Scenario, Beat } from './types'
