type Props = {
  score: number
  passed: boolean
  label?: string
}

/** A 0..1 score bar. Colour tracks the verdict, not just the magnitude. */
export function ScoreMeter({ score, passed, label }: Props) {
  const pct = Math.round(Math.min(1, Math.max(0, score)) * 100)
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between text-sm opacity-60">
        <span>{label ?? 'Match'}</span>
        <span>{pct}%</span>
      </div>
      <progress
        className={`progress h-2 ${passed ? 'progress-success' : 'progress-warning'}`}
        value={pct}
        max={100}
      />
    </div>
  )
}
