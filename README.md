# HandsUp — learn signs, scenario by scenario

**This block isn't missing. It's one-way.**

A bus, a pharmacy counter, an airport desk — those blocks all exist and work. What's
missing is the joint between them and a Deaf person: a shared language at the point of
contact. And that joint has only ever been built from one side. Deaf people learn to read
our language, write it, lip-read it. Hearing people build nothing back.

HandsUp adds material to the other side of that joint. It's a browser game that teaches
hearing people to sign, set in the places you'd actually need it. Your webcam watches your
hand and scores the shape in real time. No account, no install, no video leaves your
device.

Two scenarios of three signs each, plus three bonus games — including a local two-player
duel.

> **On the brief.** Almost all "connection technology" inserts itself *between* people —
> translation apps, captioning, text relay. They work, and they all leave the Deaf person
> dependent on your phone being charged. This is the opposite: **it removes itself.** You
> learn, and then you don't need it. The next conversation needs no technology at all.

```bash
pnpm install && pnpm fetch-models && pnpm dev
```

### For judges

| Criterion | Where to look |
|---|---|
| **Innovation** | [The idea, and what already exists](#the-idea-and-what-already-exists) |
| **Technical complexity** | [Under the hood](#under-the-hood) · [Four problems worth reading about](#four-problems-worth-reading-about) |
| **Practicality** | [Who this is for](#who-this-is-for) |
| **Elegance** | [Design, failure modes, robustness](#design-failure-modes-and-robustness) |

Which of the brief's prompts this answers, and the 4-minute spoken version:
[PITCH.md](PITCH.md).

**A 90-second tour.** Open the home screen and let the status bar go green (the model
loads locally, ~8 MB). Play **Airport** — three signs, camera scores each one, 80% opens
the Bus. Then **Rush hour** for the single-player minute, and **Head to head** if there
are two of you. No camera? Everything still plays on keys `1`–`6`.

---

## The idea, and what already exists

Sign-language learning software is not new, and it would be dishonest to claim otherwise.
What exists falls into three groups:

| | What they do | What they don't |
|---|---|---|
| **Video-lesson apps** (Lingvano, ASL Bloom, SignSchool) | Excellent vocabulary and grammar instruction | You watch and self-assess. Nothing checks your hands |
| **Quiz apps** | Test *recognition* — "which video means THANK YOU?" | Never test *production*. Recognising a sign and making one are different skills |
| **Camera-based research systems** (PopSign AI, SignAll) | Genuinely check production with ML — the closest comparable to this | Mobile app or dedicated hardware; installed, account-based, aimed at people already committed to learning |

**The difference that matters most:** every one of those teaches people who have already
decided to learn. None of them touches the *one-way joint* — the fact that the burden of
bridging each interaction falls on the Deaf person. That's the block this adds material to.

**And in the detail:**

1. **The direction is the point.** Almost all of this software is aimed at people who
   have already decided to learn a sign language. This is aimed at the person on the
   *other* side of the counter — the check-in agent, the bus driver, the barista who has
   never signed and has thirty seconds. Reducing the burden on Deaf people by moving a
   little of it onto hearing people is the whole thesis, and it shapes every decision
   below.

2. **Situated, not vocabulary lists.** You don't learn "HELLO"; you answer a ground agent
   at 06:40 who has just asked what you need. The sign arrives attached to the moment
   you'd use it, which is how phrasebooks work and flashcards don't.

3. **Zero activation energy.** Browser, no account, no download, no app store. The entire
   barrier is clicking a link and allowing the camera. That is a deliberate design
   constraint, not a shortcut — a tool for the merely curious has to be reachable in one
   click or it never gets reached.

4. **A local two-player duel.** Two people, one webcam, one minute, alternating turns.
   Turning sign practice into something social and competitive is the piece I have not
   seen elsewhere, and it is the mode that makes people who came for thirty seconds stay
   for five minutes.

5. **The scoring is shown, not hidden.** Under the camera you can read `model 12 · shape
   90` — the classifier's opinion and the geometry's opinion, separately. When a sign
   won't score you can see *why*, which turns a frustrating black box into something you
   can work with.

**Honest scope.** The six shapes are MediaPipe's pretrained gesture classes, not real ASL
or Auslan signs. See [limitations](#honest-limitations).

---

## Under the hood

Everything runs client-side: **MediaPipe Gesture Recognizer** (WASM + WebGL) on a
`requestAnimationFrame` loop, React 19, TypeScript, Vite. The model and WASM are vendored
into `public/`, so after first load there is no runtime network dependency and no frame
ever leaves the machine.

```
camera ─► GestureRecognizer ─┬─► canned classes ──► model score for the target
                             └─► 21 landmarks ────► geomScore()  ─► shape score
                                                          │
                                     conf = max(model, 0.92 × shape)
                                                          │
                                     pushSample() ── 800 ms rolling mean
                                                          │
                                            scenario:   best window over 8 s
                                            rush/guess: isHit() per frame
                                            duel:       isHit(), and the elapsed
                                                        time is the score
```

Three structural decisions:

- **Two independent readings, always combined.** The pretrained classifier and the raw
  landmark geometry are scored separately and the stronger evidence wins. Every mode
  funnels through one `scoreFrame`, so the live readout and the banked score can never
  disagree.
- **A score is a rolling mean, never a single frame.** `pushSample` keeps an 800 ms
  window, so a lucky frame can't carry an attempt and a steady hold is rewarded. It also
  bridges dropouts up to 260 ms so one bad frame mid-hold doesn't drag the mean down.
- **The logic is free of React.** Recognition, scoring and the duel's match rules are
  pure functions and pure state machines, unit-tested headless — no camera, no DOM, no
  timers. **62 tests** across 6 suites.

## Four problems worth reading about

These are the parts that took real diagnosis rather than real typing.

### 1. A gesture that never appeared in the results at all

`Thumb_Up` scored zero, always. Not "badly" — zero. The cause was two compounding bugs in
how MediaPipe's output was being read:

- The canned classifier **hides any category below 0.5** by default. `Thumb_Up`
  routinely sits at 0.3–0.45 while `Closed_Fist` takes the top slot, so it was being
  filtered out before the app ever saw it. Fixed with
  `cannedGesturesClassifierOptions: { scoreThreshold: 0.08 }`.
- The obvious read of the result — `res.gestures[0][0]` — takes only the *top* category
  of the *first* hand. That silently discards the score whenever the target comes second,
  which is precisely what happens to `Thumb_Up`. `scoreFrame` now searches every category
  of every hand.

Both fixes are one-liners. Finding them was not, and the second one is the kind of bug
that produces a working-looking app that is quietly wrong.

### 2. The classifier cannot tell a thumbs-up from a fist — so stop asking it

A thumbs-up *is* a closed fist plus one thumb, and the pretrained model genuinely
confuses them. Rather than fight it, `geomScore` reads the 21 landmarks directly:

```ts
// A finger is extended when its tip sits much further from the wrist than its
// middle joint. That ratio is rotation-invariant, unlike comparing y values.
const ext = [[8, 6], [12, 10], [16, 14], [20, 18]]
  .map(([tip, pip]) => clamp01((D(tip, 0) / D(pip, 0) - 1.05) / 0.42))
```

Per-shape formulas combine extension, thumb clearance and thumb elevation. Orientation
*nudges* the score but never zeroes it — a tilted thumbs-up is still a thumbs-up to
anyone watching, so it should still be to the app. Each of the six formulas is pinned by
a test asserting it outscores all five rivals on a matching hand, plus a rotation test
proving a hand tilted 40° still reads as extended.

### 3. A game loop that double-counted

In rush hour the naive design — restart the scoring loop when the word changes — makes a
player who is *still holding the shape from the last hit* instantly clear the next word
too. The fix is architectural: **one `requestAnimationFrame` loop for the whole round**,
where advancing to the next word is a state change rather than a restart, guarded by a
settled-window check and a 400 ms cooldown. The rule is extracted into `isHit()` and
tested independently, including the "one continuous hold cannot clear two words" case.

### 4. React 19 fighting a 60fps loop

Driving a real-time loop from React surfaces problems that don't exist in vanilla JS:

- **`useFrameSource` returns a lifetime-stable function.** It's a dependency of the game
  loops, so a fresh identity would restart an attempt — resetting the player's clock —
  every time the detector finished loading or the camera flipped to keys-only mid-round.
- **StrictMode double-invocation is a scoring bug, not a warning.** Applying a duel turn
  inside a `setState` updater counted the mistake twice. Turn results are now applied
  once, at the point the turn actually ends.
- Latest-ref callbacks throughout, so an inline arrow function in a parent can never
  restart a timed round.

`oxlint` is clean, `tsc` is clean, production bundle is **136 KB gzipped**.

---

## Who this is for

**The primary user is a hearing person with thirty seconds and no prior interest.**
Front-line staff who'll meet a Deaf customer and currently have nothing between them and
a written note: airport and transit staff, retail and hospitality, reception desks,
pharmacy counters. Secondarily: schools wanting a five-minute hook into a Deaf awareness
lesson, and anyone whose colleague, neighbour or in-law signs.

**The value is the first door, not the room behind it.** Nobody becomes a signer here.
What this changes is the moment a hearing person realises the gap is crossable — that
they *can* say hello with their hands, right now, without a course. That realisation is
the expensive part; vocabulary is cheap once someone wants it.

**Why it can realistically be deployed:** static files, no backend, no database, no
account system, no per-user cost. It can be dropped onto a training intranet, a QR code
at a staff induction, or a kiosk, and it works offline once cached. Extending it is a
data edit, not an engineering project — see [Adding content](#adding-content).

---

## Design, failure modes and robustness

**One design idea, carried through.** The whole product is dressed as transit
wayfinding — split-flap board, signal yellow, pictograms, near-square corners — because
that is literally where the lessons are set. The visual language and the content are the
same decision, so the interface explains itself before any copy is read.

**Nothing is ever a dead end.** This is where most camera apps fail, so each failure has
a designed path through it:

| What goes wrong | What happens |
|---|---|
| Model won't load (offline, blocked) | Status bar goes red and says so. **Keys `1`–`6` stand in for a hand** — every mode stays fully playable |
| Camera refused or unavailable | Same keyboard fallback, with copy explaining how to re-allow it |
| GPU/WebGL unavailable | Silently falls back to the CPU delegate rather than failing at init |
| A dropped frame mid-hold | Bridged for 260 ms, so it doesn't dent your score |
| Two hands in frame | `numHands: 2` — a second hand drifting in used to get tracked *instead of* the signing one |
| A sign that won't score | The readout splits model vs shape evidence, so you can see which is struggling |

**Details that carry the experience:**

- The pictogram is **articulated and animated from data**. Per-finger `curl` and `spread`
  drive the drawing; a `MotionAxis` picks a shared travel animation. A front-on view
  can't distinguish a side-to-side wave from a push forward, so travel is also drawn as a
  small top-down inset — the same information twice, one moving, one still.
- **Duel handoffs need no button.** An earlier build asked each player to press Go on
  their turn; two people ended up fighting over one keyboard between every sign. Now
  it's one press for the whole match, with a timed beat announcing the next player.
- Full `prefers-reduced-motion` support; typed dialogue and every animation collapse to
  their end state.
- Progress is **session-only by design** — nothing about you is stored, and a refresh
  starts you clean.

---

## Head to head (two players)

`/rush/duel` is rush hour for two people sharing one camera and one minute:

| | |
|---|---|
| **One press of Go**, then sixty continuous seconds | Turns hand over on their own |
| Players alternate, each turn drawing a **random phrase** | Never the shape just played, so the incoming player can't copy the one they watched |
| 5 seconds per turn; clear it and your time is banked, miss it and it's a mistake | Elapsed time *is* the score, so a turn stops the instant the sign reads |
| A short handoff beat announces the next player | Long enough to swap places. It runs on the match clock — the minute is the minute |
| 5 mistakes and you're out | `DUEL_MISTAKE_LIMIT` |
| Most cleared when the clock stops wins | Level on clears → lower total time |
| Judged only at the **end of a full round** | Both players always have equal turns, so going first is no advantage. It's also why the clock expiring mid-round doesn't cut player 2 off — the round always finishes |

The match is a pure state machine in `src/duel/matchState.ts`. `applyTurn` takes both the
word picker and the clock as arguments, so a whole match is deterministic and is replayed
turn by turn in `matchState.test.ts`. The screen owns the camera *and* the clock — not the
turn — so both stay live across a handoff instead of re-prompting for permission and
restarting the minute every time play changes hands.

## Adding content

Signs and scenarios are plain data in `src/content/`:

- `gestures.ts` — the six hand shapes. Ids map 1:1 to MediaPipe's canned class names. Per
  finger `curl` drives the articulated pictogram and `axis` picks one of five shared CSS
  travel animations, so a new shape gets a *moving* icon and its direction inset for free.
- `scenarios.ts` — dialogue, phrases and tips. `ORDER` sets the play order and the unlock
  chain; `WORD_BANK` is *derived* from the scenarios, so the rush-hour pool grows by
  itself the day Restaurant or Pharmacy get built.
- `bonus.ts`, `rules.ts` — the bonus-game cards, and every threshold in one place.

A new scenario needs an entry in `SCENARIOS`, its id in `ORDER`, and a scene illustration
registered in `src/ui/scenes/index.tsx`.

## Layout

```
src/content/      gestures, scenarios, bonus games, thresholds   (pure data)
src/recognition/  geometry · scoreFrame · rollingWindow          (pure, unit-tested)
src/engine/       the rAF game loops: useAttempt, useSignRound, useDuelTurn
src/duel/         two-player match rules                          (pure, unit-tested)
src/vision/       recognizer setup, camera, overlay, practice keys
src/progress/     session-only scores and the unlock gate
src/ui/           pictogram + axis inset, split-flap board, meters, cards, scene art
src/screens/      Home, ScenarioGame, RushHour, RushDuel, AiGuess
```

## Quick start

```bash
pnpm install          # also vendors the MediaPipe wasm into public/mp/wasm
pnpm fetch-models     # one-time: downloads gesture_recognizer.task (~8 MB)
pnpm dev              # http://localhost:5173
```

The camera needs a secure context. `localhost` counts; serving over a LAN IP does not —
use HTTPS (`vite --host` plus `@vitejs/plugin-basic-ssl`) if you demo from another device.

| | |
|---|---|
| `pnpm dev` | dev server |
| `pnpm test` | 62 unit tests — recognition, engine, duel rules |
| `pnpm build` | typecheck + production bundle |
| `pnpm lint` | oxlint |
| `pnpm fetch-models` | re-download the MediaPipe model |

## Tuning

Every threshold lives in `src/content/rules.ts`:

| | |
|---|---|
| `PASS` | scenario gate, and the bar for a "clean hold" (0.80) |
| `RUSH_PASS` | rush-hour bar — lower on purpose, since speed is that mode's pressure (0.70) |
| `RUSH_COOLDOWN` | grace after a hit, so one hold can't clear two words (400 ms) |
| `WINDOW_MS` | rolling-mean window (800 ms) |
| `DROPOUT_BRIDGE_MS` | how long a lost hand is coasted through (260 ms) |
| `ATTEMPT_SECONDS` | camera time per scenario sign (8 s) |
| `DUEL_MATCH_SECONDS` | the shared duel clock (60 s) |
| `DUEL_TURN_SECONDS` | one duel turn; running out is a mistake (5 s) |
| `DUEL_MISTAKE_LIMIT` | mistakes before a duel player is out (5) |
| `DUEL_HANDOFF_MS` | the beat between turns, for swapping places (1500 ms) |

If a shape scores badly, the live readout under the camera splits the two evidences —
`model 12 · shape 90` means the classifier is struggling, not your hand. The per-shape
formulas are in `geomScore` in `src/recognition/geometry.ts`.

## Honest limitations

- **These are not real signs.** They are MediaPipe's six pretrained gesture classes,
  mapped onto phrases. Real ASL and Auslan use two hands, movement, position relative to
  the body, and facial grammar that carries meaning. Treat this as a first door, not a
  dictionary — and learn from Deaf teachers and native signers.
- **Six shapes, six phrases.** The architecture scales by editing data, but the content
  is a demo's worth.
- **One webfont is fetched from Google Fonts.** The model, WASM and all other assets are
  vendored and work offline; the typeface falls back to system fonts if the CDN is
  unreachable. Vendoring it would make the offline story absolute.
- **No persistence.** Progress lives in the tab. That's a deliberate privacy stance, but
  it does mean a refresh costs you your unlocks. `src/progress/ProgressProvider.tsx` is
  the one file to change.
