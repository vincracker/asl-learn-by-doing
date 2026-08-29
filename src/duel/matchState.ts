import { DUEL_MISTAKE_LIMIT } from '../content/rules'
import type { Word } from '../content/scenarios'

export type PlayerId = 0 | 1

export const PLAYER_IDS = [0, 1] as const
export const otherPlayer = (p: PlayerId): PlayerId => (p === 0 ? 1 : 0)
export const playerName = (p: PlayerId) => `Player ${p + 1}`

export type PlayerState = {
  clears: number
  mistakes: number
  /** Time across cleared signs. This is the head-to-head speed measure. */
  totalMs: number
  fastestMs: number | null
}

export type TurnResult = { kind: 'clear'; ms: number } | { kind: 'miss' }

export type Outcome =
  | { kind: 'winner'; player: PlayerId; reason: 'knockout' | 'clears' | 'speed' }
  | { kind: 'draw' }

export type Match = {
  players: readonly [PlayerState, PlayerState]
  /** The phrase for the turn about to be played. Every turn draws its own. */
  word: Word
  turn: PlayerId
  /** 1-based. One round is one turn each. */
  round: number
  outcome: Outcome | null
}

const FRESH: PlayerState = { clears: 0, mistakes: 0, totalMs: 0, fastestMs: null }

export function startMatch(word: Word): Match {
  return { players: [FRESH, FRESH], word, turn: 0, round: 1, outcome: null }
}

function withResult(p: PlayerState, result: TurnResult): PlayerState {
  if (result.kind === 'miss') return { ...p, mistakes: p.mistakes + 1 }
  return {
    ...p,
    clears: p.clears + 1,
    totalMs: p.totalMs + result.ms,
    fastestMs: p.fastestMs === null ? result.ms : Math.min(p.fastestMs, result.ms),
  }
}

export type TurnContext = {
  pickWord: (previous: Word) => Word
  /** Whether the match clock still has time for another round. */
  timeRemains: boolean
}

/**
 * Banks one turn and hands play to the next player, with a fresh phrase drawn for them.
 *
 * `pickWord` never returns the shape that was just played, which matters more here than
 * in single player: the incoming player has been watching the outgoing one, and would
 * otherwise be able to copy the shape rather than recall it.
 *
 * Both the word picker and the clock are passed in rather than read from the outside,
 * so a whole match is deterministic and can be replayed turn by turn in a test.
 */
export function applyTurn(match: Match, result: TurnResult, ctx: TurnContext): Match {
  if (match.outcome) return match

  const players: [PlayerState, PlayerState] = [...match.players]
  players[match.turn] = withResult(players[match.turn], result)

  // Player 1 has only just gone; the round isn't over yet.
  if (match.turn === 0) {
    return { ...match, players, turn: 1, word: ctx.pickWord(match.word) }
  }

  // The match is judged only at the end of a full round, so the players have always had
  // the same number of turns when a winner is declared. That is also why the clock
  // running out mid-round doesn't cut player 2 off — the round always finishes.
  const outcome = judge(players, ctx.timeRemains)
  return {
    ...match,
    players,
    turn: 0,
    round: match.round + 1,
    word: outcome ? match.word : ctx.pickWord(match.word),
    outcome,
  }
}

function judge(
  players: readonly [PlayerState, PlayerState],
  timeRemains: boolean,
): Outcome | null {
  const [a, b] = players
  const aOut = a.mistakes >= DUEL_MISTAKE_LIMIT
  const bOut = b.mistakes >= DUEL_MISTAKE_LIMIT

  if (aOut !== bOut) return { kind: 'winner', player: aOut ? 1 : 0, reason: 'knockout' }
  if (aOut && bOut) return decide(players)
  if (!timeRemains) return decide(players)
  return null
}

/** Most cleared takes it; level on clears, the faster hand takes it. */
function decide([a, b]: readonly [PlayerState, PlayerState]): Outcome {
  if (a.clears !== b.clears) {
    return { kind: 'winner', player: a.clears > b.clears ? 0 : 1, reason: 'clears' }
  }
  if (a.totalMs !== b.totalMs) {
    return { kind: 'winner', player: a.totalMs < b.totalMs ? 0 : 1, reason: 'speed' }
  }
  return { kind: 'draw' }
}

/** Mean time per cleared sign, or null before a player has cleared anything. */
export function averageMs(p: PlayerState): number | null {
  return p.clears ? p.totalMs / p.clears : null
}

export const formatSeconds = (ms: number) => `${(ms / 1000).toFixed(2)}s`
