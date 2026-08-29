type Props = {
  score: number
  passed: boolean
  label?: string
}

/** A 0..1 score bar. Colour tracks the verdict, not just the magnitude. */
export function ScoreMeter({ score, passed, label }: Props) {
  const pct = Math.round(Math.min(1, Math.max(0, score)) * 100)
  return (
    <div className="stack" style={{ gap: 6 }}>
      <div className="row" style={{ justifyContent: 'space-between' }}>
        <span className="muted">{label ?? 'Match'}</span>
        <span className="muted">{pct}%</span>
      </div>
      <div className="meter">
        <div
          className="meter__fill"
          style={{ width: `${pct}%`, background: passed ? 'var(--accent)' : 'var(--warn)' }}
        />
      </div>
    </div>
  )
}
