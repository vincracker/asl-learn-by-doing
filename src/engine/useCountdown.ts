import { useEffect, useRef, useState } from 'react'

const TICK_MS = 100

export type Countdown = {
  /** Seconds left, for display. Updates ten times a second. */
  remaining: number
  /**
   * The precise deadline. Read this — not `remaining` — from inside a callback that has
   * to make a decision on the clock, since the displayed value can be up to a tick old.
   */
  deadline: React.RefObject<number>
}

/**
 * The match clock: one countdown that keeps running across turns and handoffs.
 *
 * It ticks ten times a second rather than every frame. Nothing here needs frame
 * accuracy, and the turn loop is already re-rendering this screen at 60fps.
 */
export function useCountdown(seconds: number, running: boolean): Countdown {
  const [remaining, setRemaining] = useState(seconds)
  const deadline = useRef(0)

  useEffect(() => {
    if (!running) return

    deadline.current = performance.now() + seconds * 1000
    const tick = () => setRemaining(Math.max(0, (deadline.current - performance.now()) / 1000))

    // Tick once straight away as well as on the interval. On a rematch the state still
    // holds the last match's 0.0, and waiting a whole tick to correct it shows the
    // players a zeroed clock at the exact moment they start.
    const first = setTimeout(tick, 0)
    const id = setInterval(tick, TICK_MS)

    return () => {
      clearTimeout(first)
      clearInterval(id)
    }
  }, [running, seconds])

  return { remaining, deadline }
}
