/**
 * The departure-board wordmark. Each letter flips in on its own delay, and the first
 * `lit` characters stay in signage yellow.
 */
export function SplitFlap({ word, lit = 4 }: { word: string; lit?: number }) {
  return (
    <div className="board" aria-label={word}>
      {[...word].map((char, i) => (
        <span
          key={`${char}-${i}`}
          className={`flap${i < lit ? ' on' : ''}`}
          style={{ animationDelay: `${i * 70}ms` }}
          aria-hidden="true"
        >
          {char}
        </span>
      ))}
    </div>
  )
}
