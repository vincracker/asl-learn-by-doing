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
