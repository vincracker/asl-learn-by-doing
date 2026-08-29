/**
 * Shown wherever the app scores a learner. Hand tracking cannot see facial grammar or
 * judge fluency, so we are explicit that this is practice feedback and not assessment.
 */
export function Disclaimer() {
  return (
    <p className="disclaimer">
      This checks your handshape, position and movement — it can't see facial grammar,
      which carries real meaning in ASL. Treat it as practice feedback, not assessment,
      and learn from Deaf teachers and native signers. Video never leaves your device.
    </p>
  )
}
