import type { Scenario } from './types'

export const cafeScenario: Scenario = {
  id: 'cafe',
  title: 'At the café',
  blurb: 'Order politely, ask for more, and sort out a small problem.',
  emoji: '☕',
  beats: [
    { kind: 'npc', speaker: 'Barista', text: '*looks up and smiles*' },
    { kind: 'sign', signId: 'hello', prompt: 'Greet the barista.', hint: 'Flat hand at the temple, out in a salute.' },
    { kind: 'npc', speaker: 'Barista', text: 'Hi there! What can I get started for you?' },
    { kind: 'sign', signId: 'please', prompt: 'Order, politely.', hint: 'Flat hand circling on your chest.' },
    { kind: 'npc', speaker: 'Barista', text: 'One coffee coming up. Room for milk?' },
    { kind: 'sign', signId: 'more', prompt: 'Ask for more.', hint: 'Both hands in a flat "O", tap the fingertips together.' },
    { kind: 'npc', speaker: 'Barista', text: 'Extra milk, got it. Anything to eat?' },
    { kind: 'sign', signId: 'no', prompt: 'Decline.', hint: 'Index and middle fingers snap onto the thumb.' },
    { kind: 'npc', speaker: 'Barista', text: "That's four fifty, whenever you're ready." },
    { kind: 'sign', signId: 'forget', prompt: 'You left your wallet — tell them you forgot.', hint: 'Flat hand wipes across the forehead, closing to a fist.' },
    { kind: 'npc', speaker: 'Barista', text: 'Ah, no worries. Happens to everyone.' },
    { kind: 'sign', signId: 'help', prompt: 'Ask a friend for help.', hint: 'Fist on your flat palm, lift both together.' },
    { kind: 'npc', speaker: 'Friend', text: '*taps their card on the reader for you*' },
    { kind: 'sign', signId: 'thank-you', prompt: 'Thank them.', hint: 'Flat hand from the chin, forward and down.' },
    { kind: 'npc', speaker: 'Friend', text: 'Any time. You can get the next one.' },
  ],
}
