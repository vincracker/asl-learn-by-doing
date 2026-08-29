/** Scenario gate: score this or better and the next scenario opens. */
export const PASS = 0.8

/**
 * Rush hour. The bar is lower than a scenario's on purpose — speed is the
 * pressure in that mode, not precision.
 */
export const RUSH_SECONDS = 60
export const RUSH_PASS = 0.7
/** ms of grace after a hit, so one continuous hold can't score twice. */
export const RUSH_COOLDOWN = 400

/** Seconds of camera time per scenario sign attempt. */
export const ATTEMPT_SECONDS = 8
/** Seconds for one AI-guess round. */
export const GUESS_SECONDS = 30

/** Rolling-mean window, in ms. A lucky single frame must not carry an attempt. */
export const WINDOW_MS = 800
/** Dropout bridge: one bad frame mid-hold shouldn't drag the mean down. */
export const DROPOUT_BRIDGE_MS = 260

/**
 * Two-player rush. Both players sign the same phrase each round, so the comparison is
 * like for like rather than luck of the draw.
 */

/** The same minute the single-player mode runs, shared between the two players. */
export const DUEL_MATCH_SECONDS = RUSH_SECONDS
/** One player's window to produce a sign. Running out is a mistake. */
export const DUEL_TURN_SECONDS = 5
/** Miss this many turns and you're out. */
export const DUEL_MISTAKE_LIMIT = 5
/**
 * The beat between turns, so the players can swap in front of the camera. It runs on
 * the match clock like everything else — the minute is the minute.
 */
export const DUEL_HANDOFF_MS = 1500

/* ── 6-7 ────────────────────────────────────────────────────────────────────
   The meme is a motion, not a shape, so its rules are about geometry over time:
   two flat palms held apart, alternating up and down at a steady clip. Every
   one of these is a strictness dial — raise them and the count gets meaner. */

/** Seconds in a 6-7 round. */
export const SIXSEVEN_SECONDS = 60

/** Every finger of BOTH hands has to read at least this extended. */
export const SIXSEVEN_OPEN = 0.55

/**
 * Minimum horizontal gap between the palms, in palm-widths. Also the guard that
 * keeps the two hands tellable apart: they are ordered left-to-right by x, and
 * hands stacked in one column would swap order frame to frame.
 */
export const SIXSEVEN_SPREAD = 0.9

/**
 * Vertical offset that commits the pair to a beat, in palm-widths. Between
 * -TILT and +TILT the pose keeps whichever beat it was already on, so a hand
 * trembling around level can't rattle off beats.
 */
export const SIXSEVEN_TILT = 0.55

/** Faster than this is a flail, not a swap. */
export const SIXSEVEN_MIN_BEAT_MS = 120
/** Slower than this isn't the meme's rhythm — the chain starts over. */
export const SIXSEVEN_MAX_BEAT_MS = 1600
