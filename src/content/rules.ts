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
