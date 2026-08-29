import { applyConfusabilityCaps, type SignTemplate } from '../recognition/matcher'
import { SIGN_CATALOG, type SignMeta } from './catalog'

/**
 * Templates recorded by the /author tool land in this directory as JSON. Globbing them
 * means a freshly recorded sign is picked up on the next reload with no import to add.
 */
const modules = import.meta.glob<{ default: SignTemplate }>('./templates/*.json', {
  eager: true,
})

// Thresholds are re-capped against the whole loaded set, so a sign's gate does not
// depend on the order the templates happened to be recorded in.
const templates = new Map<string, SignTemplate>(
  applyConfusabilityCaps(Object.values(modules).map((m) => m.default)).map((t) => [t.id, t]),
)

export type LoadedSign = SignMeta & {
  template: SignTemplate | null
  clipUrl: string
}

/** Every catalogued sign, whether or not it has been recorded yet. */
export function allSigns(): LoadedSign[] {
  return SIGN_CATALOG.map((meta) => ({
    ...meta,
    template: templates.get(meta.id) ?? null,
    clipUrl: `/clips/${meta.id}.webm`,
  }))
}

/** Only the signs that actually have a template — the ones we can score against. */
export function playableSigns(): LoadedSign[] {
  return allSigns().filter((s) => s.template !== null)
}

export function signById(id: string): LoadedSign | undefined {
  return allSigns().find((s) => s.id === id)
}

/** Templates for whole-catalog ranking ("that looked more like WHERE"). */
export function allTemplates(): SignTemplate[] {
  return [...templates.values()]
}

export function hasTemplate(id: string): boolean {
  return templates.has(id)
}
