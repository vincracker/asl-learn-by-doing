# SIGNPORT — learn signs, scenario by scenario

A browser game for learning simple hand signs, played in the places you'd actually need
them: an airport check-in desk, a bus door. Your webcam watches your hand and scores how
close the shape was. No account, no download.

Two scenarios of three signs each, plus three bonus games — including a two-player duel.
Everything runs locally: no video is uploaded, and after the first load the app needs no
network at all.

> **What this is and isn't.** These are simplified single-hand shapes drawn from
> MediaPipe's six pretrained gesture classes — not full ASL or Auslan. Real signs use two
> hands, movement, position and face. Treat this as a first door, not a dictionary, and
> learn from Deaf teachers and native signers.

## Quick start

```bash
pnpm install          # also vendors the MediaPipe wasm into public/mp/wasm
pnpm fetch-models     # one-time: downloads gesture_recognizer.task (~8 MB)
pnpm dev              # http://localhost:5173
```

The camera needs a secure context. `localhost` counts; serving over a LAN IP does not —
use HTTPS (`vite --host` plus `@vitejs/plugin-basic-ssl`) if you demo from another device.

If the model fails to load or the camera is refused, every mode falls back to **practice
mode**: keys `1`–`6` each stand in for one hand shape, so the whole app stays playable.

## How recognition works

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

Three design notes worth knowing before you change anything:

- **Two independent readings, always combined.** The canned classifier confuses
  `Thumb_Up` with `Closed_Fist`, because a thumbs-up *is* a fist plus a thumb. The
  landmarks are unambiguous, so `geomScore` scores the shape directly and the stronger
  evidence wins. Every mode funnels through `scoreFrame`, so the live readout and the
  banked score can never disagree.
- **A score is a rolling mean, never a single frame.** `pushSample` keeps an 800 ms
  window, so one lucky frame can't carry an attempt and a steady hold is rewarded. It
  also bridges dropouts up to 260 ms, so a single bad frame mid-hold doesn't drag the
  mean down.
- **The recognition modules are free of React** and pure where it counts, so they're
  tested headless with no camera, no DOM and no timers.

Two settings on the recognizer exist for specific reasons, both documented in
`src/vision/recognizer.ts`: `numHands: 2` (a second hand drifting into frame used to get
tracked instead of the signing one) and a `scoreThreshold` of `0.08` (at MediaPipe's
default of 0.5, `Thumb_Up` never appeared in the results at all).

## Head to head (two players)

`/rush/duel` is rush hour for two people sharing one camera and one minute. The rules,
and why:

| | |
|---|---|
| **One press of Go**, then sixty continuous seconds | Turns hand over on their own. A press per turn had two people fighting over one keyboard between every sign |
| Players alternate, each turn drawing a **random phrase** | Never the shape just played, so the incoming player can't copy the one they watched |
| 5 seconds per turn; clear it and your time is banked, miss it and it's a mistake | Elapsed time *is* the score, so a turn stops the instant the sign reads |
| A short handoff beat announces the next player | Long enough to swap in front of the camera. It runs on the match clock like everything else — the minute is the minute |
| 5 mistakes and you're out | `DUEL_MISTAKE_LIMIT` |
| Most cleared when the clock stops wins | Level on clears → lower total time, the literal "who is faster" tiebreak |
| Judged only at the **end of a full round** | Both players always have equal turns, so going first is no advantage. It is also why the clock expiring mid-round doesn't cut player 2 off — the round always finishes |

Because the phrases differ from turn to turn, the time tiebreak compares unlike signs —
it only comes into play when the two players are dead level on clears, so it decides
close matches rather than shaping them.

The match is a pure state machine in `src/duel/matchState.ts`. `applyTurn` takes both the
word picker and the clock as arguments, so a whole match is deterministic and is replayed
turn by turn in `matchState.test.ts`. The screen owns the camera *and* the clock — not the
turn — so both stay live across a handoff instead of re-prompting for permission and
restarting the minute every time play changes hands.

## Adding content

Signs and scenarios are plain data in `src/content/`:

- `gestures.ts` — the six hand shapes. Ids map 1:1 to MediaPipe's canned class names, and
  the `fingers` flags drive the pictogram, so a new shape gets its icon for free.
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
src/ui/           pictogram, split-flap board, meters, cards, scene art
src/screens/      Home, ScenarioGame, RushHour, RushDuel, AiGuess
```

`useSignRound` is one rAF loop for a whole round — moving to the next word is a state
change, never a restart. Restarting the loop from inside a frame callback is what makes a
round double-count a hold that's still in front of the camera.

Progress is session-only by design: nothing about you is stored, and a refresh starts you
clean. To persist it, back `scores` in `src/progress/ProgressProvider.tsx` with
localStorage — nothing else has to change.

## Scripts

| | |
|---|---|
| `pnpm dev` | dev server |
| `pnpm test` | recognition + engine unit tests |
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
formulas are in `geomScore` in `src/recognition/geometry.ts`, and each is pinned by a
test asserting it outscores all five rivals on a matching hand.
