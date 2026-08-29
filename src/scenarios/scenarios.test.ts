import { describe, it, expect } from 'vitest'
import { SCENARIOS, scenarioById } from './index'
import { SIGN_BY_ID, SIGN_CATALOG } from '../signs/catalog'

describe('scenario integrity', () => {
  it('every sign beat references a sign that exists', () => {
    // Catalog and scenarios are edited independently; a typo'd id would otherwise only
    // surface as a runtime throw mid-demo.
    const missing = SCENARIOS.flatMap((s) =>
      s.beats
        .filter((b) => b.kind === 'sign' && !SIGN_BY_ID.has(b.signId))
        .map((b) => `${s.id}: ${b.kind === 'sign' ? b.signId : ''}`),
    )
    expect(missing).toEqual([])
  })

  it('covers the whole catalog across all scenarios', () => {
    const used = new Set(
      SCENARIOS.flatMap((s) => s.beats.flatMap((b) => (b.kind === 'sign' ? [b.signId] : []))),
    )
    const unused = SIGN_CATALOG.filter((s) => !used.has(s.id)).map((s) => s.id)
    expect(unused).toEqual([])
  })

  it('has unique scenario ids that resolve', () => {
    const ids = SCENARIOS.map((s) => s.id)
    expect(new Set(ids).size).toBe(ids.length)
    for (const id of ids) expect(scenarioById(id)?.id).toBe(id)
  })

  it('opens and closes each scenario with dialogue, not a bare prompt', () => {
    for (const s of SCENARIOS) {
      expect(s.beats.at(0)?.kind).toBe('npc')
      expect(s.beats.at(-1)?.kind).toBe('npc')
    }
  })
})

describe('sign catalog integrity', () => {
  it('has unique ids', () => {
    const ids = SIGN_CATALOG.map((s) => s.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('uses url-safe ids, since they become filenames and routes', () => {
    for (const s of SIGN_CATALOG) expect(s.id).toMatch(/^[a-z0-9-]+$/)
  })

  it('describes how to form every sign', () => {
    for (const s of SIGN_CATALOG) expect(s.how.length).toBeGreaterThan(20)
  })
})
