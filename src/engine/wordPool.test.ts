import { describe, expect, it } from 'vitest'
import { pickNextWord } from './wordPool'
import { WORD_BANK, type Word } from '../content/scenarios'

const word = (phrase: string, gesture: Word['gesture']): Word => ({ phrase, gesture, tip: '' })

describe('pickNextWord', () => {
  it('never repeats the hand shape the player is already holding', () => {
    const current = WORD_BANK[0]
    for (let i = 0; i < 200; i++) {
      expect(pickNextWord(WORD_BANK, current).gesture).not.toBe(current.gesture)
    }
  })

  it('draws from the whole bank when there is no current word', () => {
    const seen = new Set<string>()
    for (let i = 0; i < 500; i++) seen.add(pickNextWord(WORD_BANK, null).phrase)
    expect(seen.size).toBe(WORD_BANK.length)
  })

  it('reaches every other phrase in the bank', () => {
    const current = WORD_BANK[0]
    const seen = new Set<string>()
    for (let i = 0; i < 500; i++) seen.add(pickNextWord(WORD_BANK, current).phrase)
    expect(seen.size).toBe(WORD_BANK.length - 1)
  })

  it('falls back to the bank when every entry shares the current shape', () => {
    const bank = [word('a', 'Victory'), word('b', 'Victory')]
    expect(pickNextWord(bank, bank[0]).gesture).toBe('Victory')
  })

  it('uses the injected random source', () => {
    const bank = [word('a', 'Victory'), word('b', 'Thumb_Up'), word('c', 'Open_Palm')]
    expect(pickNextWord(bank, null, () => 0).phrase).toBe('a')
    expect(pickNextWord(bank, null, () => 0.99).phrase).toBe('c')
  })
})
