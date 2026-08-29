import type { ReactNode } from 'react'

/** A labelled progress bar: match confidence, time remaining, and so on. */
export function Meter({
  label,
  value,
  fraction,
  good = false,
  dim = false,
}: {
  label: string
  /** Right-hand readout, already formatted. */
  value: ReactNode
  /** 0..1. */
  fraction: number
  /** Flips the fill to the pass colour. */
  good?: boolean
  /** Muted fill, for bars that aren't a score. */
  dim?: boolean
}) {
  const pct = `${Math.round(Math.min(1, Math.max(0, fraction)) * 100)}%`
  return (
    <div className="meter">
      <div className="meterrow">
        <span>{label}</span>
        <span className="val">{value}</span>
      </div>
      <div className="bar">
        <i
          className={`fill${good ? ' good' : ''}`}
          style={{ display: 'block', width: pct, ...(dim ? { background: 'var(--type-dim)' } : {}) }}
        />
      </div>
    </div>
  )
}

/** A bare label/value row, for counters with no bar of their own. */
export function Readout({
  label,
  value,
  flash = false,
}: {
  label: string
  value: ReactNode
  flash?: boolean
}) {
  return (
    <div className="meterrow" style={{ marginTop: 16 }}>
      <span>{label}</span>
      <span className={`val${flash ? ' hitflash' : ''}`}>{value}</span>
    </div>
  )
}
