import { useEffect, useState } from 'react'

const CHAR_MS = 28

/**
 * Types a line of dialogue out one character at a time.
 *
 * Honours prefers-reduced-motion by showing the whole line at once — the animation is
 * decoration, and the text is the content.
 *
 * Give it a `key` of the line when the text can change: remounting is how it resets,
 * so it never has to reach back and clear its own state mid-effect.
 */
export function TypeLine({ text }: { text: string }) {
  const [shown, setShown] = useState(() => (prefersReducedMotion() ? text.length : 0))

  useEffect(() => {
    if (prefersReducedMotion()) return
    let i = 0
    const tick = setInterval(() => {
      i += 1
      setShown(i)
      if (i >= text.length) clearInterval(tick)
    }, CHAR_MS)
    return () => clearInterval(tick)
  }, [text])

  return (
    <span>
      {text.slice(0, shown)}
      {shown < text.length && <span className="caret" />}
    </span>
  )
}

function prefersReducedMotion() {
  return typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches
}
