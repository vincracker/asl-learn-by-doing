/**
 * Shown when the model or the camera is unavailable and keys 1–6 stand in for a hand.
 *
 * It reads as a notice rather than fine print: without a camera this is the only thing
 * telling the player the game is still playable.
 */
export function PracticeNotice() {
  return (
    <p className="notice">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <circle cx="12" cy="12" r="9" />
        <path d="M12 11v5M12 7.5v.01" strokeLinecap="round" />
      </svg>
      <span>
        <b>Practice mode.</b> No camera, so keys <b>1</b>–<b>6</b> each stand in for one hand shape.
      </span>
    </p>
  )
}
