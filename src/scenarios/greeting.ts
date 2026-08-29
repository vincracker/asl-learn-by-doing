import type { Scenario } from './types'

export const greetingScenario: Scenario = {
  id: 'greeting',
  title: 'Meeting someone',
  blurb: 'Say hello, ask how someone is, and take your leave politely.',
  emoji: '👋',
  beats: [
    { kind: 'npc', speaker: 'Sam', text: '*waves at you from across the room*' },
    { kind: 'sign', signId: 'hello', prompt: 'Greet them back.', hint: 'Flat hand at the temple, out in a salute.' },
    { kind: 'npc', speaker: 'Sam', text: 'Hello! Good to see you here.' },
    { kind: 'sign', signId: 'how-are-you', prompt: 'Ask how they are.', hint: 'HOW — knuckles together, roll forward. Then point at them.' },
    { kind: 'npc', speaker: 'Sam', text: "I'm doing well, thanks. Are you enjoying the class?" },
    { kind: 'sign', signId: 'like', prompt: 'Tell them you like it.', hint: 'Thumb and middle finger pull out from the chest, closing together.' },
    { kind: 'npc', speaker: 'Sam', text: 'Me too. It took me a while to get comfortable signing.' },
    { kind: 'sign', signId: 'thank-you', prompt: 'Thank them for the encouragement.', hint: 'Flat hand from the chin, forward and down.' },
    { kind: 'npc', speaker: 'Sam', text: 'Of course. I should head to my next class.' },
    { kind: 'sign', signId: 'go', prompt: 'Say you have to go too.', hint: 'Both index fingers point, then move away from you.' },
    { kind: 'npc', speaker: 'Sam', text: 'See you next week!' },
  ],
}
