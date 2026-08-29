import { describe, expect, it } from 'vitest'
import { NO_LABEL, scoreFrame } from './scoreFrame'
import { HANDS } from './testUtils'

describe('scoreFrame', () => {
  it('finds the target even when it is not the top category', () => {
    const res = {
      gestures: [[
        { categoryName: 'Closed_Fist', score: 0.8 },
        { categoryName: 'Thumb_Up', score: 0.42 },
      ]],
    }
    const { mScore, label } = scoreFrame(res, 'Thumb_Up')
    expect(mScore).toBeCloseTo(0.42)
    expect(label).toBe('Closed_Fist')
  })

  it('searches every hand, not just the first', () => {
    const res = {
      gestures: [
        [{ categoryName: 'Open_Palm', score: 0.9 }],
        [{ categoryName: 'Victory', score: 0.77 }],
      ],
    }
    expect(scoreFrame(res, 'Victory').mScore).toBeCloseTo(0.77)
  })

  it('takes the geometry score when the classifier under-reports', () => {
    const res = {
      gestures: [[{ categoryName: 'Closed_Fist', score: 0.9 }, { categoryName: 'Thumb_Up', score: 0.1 }]],
      landmarks: [HANDS.thumbUp()],
    }
    const { conf, gScore } = scoreFrame(res, 'Thumb_Up')
    expect(gScore).toBeGreaterThan(0.5)
    expect(conf).toBeCloseTo(0.92 * gScore)
  })

  it('keeps the classifier score when it is the stronger evidence', () => {
    const res = {
      gestures: [[{ categoryName: 'Open_Palm', score: 0.95 }]],
      landmarks: [HANDS.openPalm()],
    }
    const { conf } = scoreFrame(res, 'Open_Palm')
    expect(conf).toBeCloseTo(0.95)
  })

  it('names the shape when the classifier abstains but the geometry is unmistakable', () => {
    const res = {
      gestures: [[{ categoryName: 'None', score: 0.6 }]],
      landmarks: [HANDS.victory()],
    }
    expect(scoreFrame(res, 'Victory').label).toBe('Victory')
  })

  it('leaves the label alone when the geometry is also weak', () => {
    const res = { gestures: [[{ categoryName: 'None', score: 0.6 }]], landmarks: [HANDS.fist()] }
    expect(scoreFrame(res, 'Victory').label).toBe('None')
  })

  it('scores an empty result at zero without throwing', () => {
    const { conf, label } = scoreFrame({}, 'Open_Palm')
    expect(conf).toBe(0)
    expect(label).toBe(NO_LABEL)
  })
})
