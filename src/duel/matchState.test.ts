import { describe, expect, it } from 'vitest'
import {
  applyTurn,
  averageMs,
  otherPlayer,
  startMatch,
  type Match,
  type TurnResult,
} from './matchState'
import { DUEL_MISTAKE_LIMIT } from '../content/rules'
import { WORD_BANK, type Word } from '../content/scenarios'

const WORD = WORD_BANK[0]
const OTHER: Word = { phrase: 'next', gesture: 'Victory', tip: '' }
const RUNNING = { pickWord: () => OTHER, timeRemains: true }
const EXPIRED = { pickWord: () => OTHER, timeRemains: false }

const clear = (ms: number): TurnResult => ({ kind: 'clear', ms })
const miss: TurnResult = { kind: 'miss' }

/** Plays a list of turns in order, starting from a fresh match. */
function play(turns: TurnResult[], ctx = RUNNING): Match {
  return turns.reduce((m, t) => applyTurn(m, t, ctx), startMatch(WORD))
}

/** Plays every turn on a running clock, then the last round with the clock expired. */
function playThenExpire(turns: TurnResult[], final: TurnResult[]): Match {
  return final.reduce((m, t) => applyTurn(m, t, EXPIRED), play(turns))
}

/** Both players take the same result, completing one round. */
const round = (a: TurnResult, b: TurnResult): TurnResult[] => [a, b]

describe('turn order', () => {
  it('starts with player 1 in round 1', () => {
    const m = startMatch(WORD)
    expect(m.turn).toBe(0)
    expect(m.round).toBe(1)
    expect(m.outcome).toBeNull()
  })

  it('hands over to player 2 without advancing the round', () => {
    const m = play([clear(900)])
    expect(m.turn).toBe(1)
    expect(m.round).toBe(1)
  })

  it('advances the round once both players have gone', () => {
    const m = play(round(clear(900), clear(800)))
    expect(m.turn).toBe(0)
    expect(m.round).toBe(2)
  })

  it('draws a fresh phrase for every turn, not just every round', () => {
    expect(play([clear(900)]).word).toBe(OTHER)
    expect(play(round(clear(900), clear(800))).word).toBe(OTHER)
  })

  it('does not draw a phrase for a turn that will never be played', () => {
    // The stub picker always returns the same word, so counting its calls is the only
    // way to tell "kept the phrase" apart from "drew the same one again".
    let draws = 0
    const counting = { pickWord: () => (draws++, OTHER), timeRemains: true }
    const expiring = { ...counting, timeRemains: false }

    const opening = round(clear(900), miss).reduce(
      (m, t) => applyTurn(m, t, counting),
      startMatch(WORD),
    )
    expect(draws).toBe(2) // one per turn

    const done = applyTurn(applyTurn(opening, clear(900), expiring), miss, expiring)
    expect(done.outcome).not.toBeNull()
    expect(draws).toBe(3) // player 1's turn drew; the match-ending turn did not
  })

  it('never mutates the match it was handed', () => {
    const before = startMatch(WORD)
    applyTurn(before, clear(900), RUNNING)
    expect(before.turn).toBe(0)
    expect(before.players[0].clears).toBe(0)
  })
})

describe('scoring a turn', () => {
  it('banks a clear with its time', () => {
    const m = play([clear(1200)])
    expect(m.players[0]).toMatchObject({ clears: 1, mistakes: 0, totalMs: 1200, fastestMs: 1200 })
  })

  it('keeps the fastest clear, not the latest', () => {
    const m = play([...round(clear(2000), miss), clear(900)])
    expect(m.players[0].fastestMs).toBe(900)
    expect(m.players[0].totalMs).toBe(2900)
  })

  it('counts a miss as a mistake and adds no time', () => {
    const m = play([miss])
    expect(m.players[0]).toMatchObject({ clears: 0, mistakes: 1, totalMs: 0, fastestMs: null })
  })

  it('scores each player independently', () => {
    const m = play(round(clear(1000), miss))
    expect(m.players[0].clears).toBe(1)
    expect(m.players[1].mistakes).toBe(1)
  })
})

describe('the mistake limit', () => {
  it('knocks a player out on their fifth miss and hands the win over', () => {
    const turns = Array.from({ length: DUEL_MISTAKE_LIMIT }, () => round(miss, clear(900))).flat()
    const m = play(turns)
    expect(m.players[0].mistakes).toBe(DUEL_MISTAKE_LIMIT)
    expect(m.outcome).toEqual({ kind: 'winner', player: 1, reason: 'knockout' })
  })

  it('does not end the match one mistake short of the limit', () => {
    const turns = Array.from({ length: DUEL_MISTAKE_LIMIT - 1 }, () => round(miss, miss)).flat()
    expect(play(turns).outcome).toBeNull()
  })

  it('falls back to the score when both players are knocked out in the same round', () => {
    const turns = Array.from({ length: DUEL_MISTAKE_LIMIT }, () => round(miss, miss)).flat()
    // Level on clears and on time, with nothing else to separate them.
    expect(play(turns).outcome).toEqual({ kind: 'draw' })
  })
})

describe('the match clock', () => {
  it('keeps going while the clock has time, however long the players take', () => {
    const turns = Array.from({ length: 12 }, () => round(clear(900), clear(800))).flat()
    expect(play(turns).outcome).toBeNull()
  })

  it('ends when the clock runs out, and gives it to the higher score', () => {
    const m = playThenExpire(round(clear(900), miss), round(clear(900), miss))
    expect(m.outcome).toEqual({ kind: 'winner', player: 0, reason: 'clears' })
  })

  it('lets the round finish rather than cutting player 2 off when time expires', () => {
    // The clock is already out when player 1 takes their turn, but player 2 still
    // gets theirs — and takes the match with it.
    const started = play(round(clear(900), clear(900)))
    const afterP1 = applyTurn(started, miss, EXPIRED)
    expect(afterP1.outcome).toBeNull()
    expect(afterP1.turn).toBe(1)

    const afterP2 = applyTurn(afterP1, clear(900), EXPIRED)
    expect(afterP2.outcome).toEqual({ kind: 'winner', player: 1, reason: 'clears' })
  })

  it('decides a tie on clears by total time — the faster hand wins', () => {
    const m = playThenExpire(round(clear(1000), clear(800)), round(clear(1000), clear(800)))
    expect(m.outcome).toEqual({ kind: 'winner', player: 1, reason: 'speed' })
  })

  it('draws when the players are level on clears and on time', () => {
    const m = playThenExpire(round(clear(900), clear(900)), round(clear(900), clear(900)))
    expect(m.outcome).toEqual({ kind: 'draw' })
  })

  it('ends on a knockout even with time left on the clock', () => {
    const turns = Array.from({ length: DUEL_MISTAKE_LIMIT }, () => round(clear(900), miss)).flat()
    const m = play(turns)
    expect(m.players[1].mistakes).toBe(DUEL_MISTAKE_LIMIT)
    expect(m.outcome).toEqual({ kind: 'winner', player: 0, reason: 'knockout' })
  })

  it('ignores further turns once the match is over', () => {
    const done = playThenExpire(round(clear(900), miss), round(clear(900), miss))
    expect(applyTurn(done, clear(100), RUNNING)).toBe(done)
  })
})

describe('helpers', () => {
  it('averages only the cleared signs', () => {
    const m = play([...round(clear(1000), miss), clear(2000)])
    expect(averageMs(m.players[0])).toBe(1500)
  })

  it('has no average before a player clears anything', () => {
    expect(averageMs(play([miss]).players[0])).toBeNull()
  })

  it('swaps players', () => {
    expect(otherPlayer(0)).toBe(1)
    expect(otherPlayer(1)).toBe(0)
  })
})
