# SIGNPORT — learn signs, scenario by scenario

A browser game for learning simple hand signs, played in the places you'd actually need
them: an airport check-in desk, a bus door. Your webcam watches your hand and scores how
close the shape was. No account, no download.

Two scenarios of three signs each, plus three bonus games. Everything runs locally: no
video is uploaded, and after the first load the app needs no network at all.

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
mode**: keys `1`–`6` each stand in for one hand shape, so the whole app stays playable. In
6-7, which reads a movement rather than a shape, `6` and `7` throw the pair of hands one
way and the other instead.

## How recognition works

```
camera ─► GestureRecognizer ─┬─► canned classes ──► model score for the target
                             └─► 21 landmarks ────► geomScore()  ─► shape score
                                                          │
                                     conf = max(model, 0.92 × shape)
                                                          │
                                     pushSample() ── 800 ms rolling mean
                                                          │
                                            scenario: best window over 8 s
                                            rush/guess: isHit() per frame
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

### 6-7 is the exception: a motion, not a shape

`src/recognition/sixSeven.ts` does not use `scoreFrame` at all, because no single frame
can contain the gesture it is judging. It splits the job instead:

```
21 landmarks × 2 hands ─► readPose()  ─► valid? form, tilt (in palm-widths)
                                              │
                                        stepRep() ── a small state machine
                                              │
                             tilt past +T ──► pole +1 ─┐
                             tilt past −T ──► pole −1 ─┴─ a flip is one beat
                                              │
                                    two beats in rhythm = one 6-7
```

The strictness the mode advertises is four separate conditions, each of which can fail
on its own and each of which the screen coaches for by name: exactly two hands, both
flat, held apart, and crossing over in tempo. Three details are load-bearing:

- **The hands are ordered by screen x, not by the model's handedness.** That needs no
  extra model output and survives the mirrored preview, since both hands mirror
  together. It has one failure mode — hands stacked in a single column swap order frame
  to frame, which would read as a storm of free beats — and `SIXSEVEN_SPREAD` is the
  guard that makes it unreachable.
- **Tilt is measured in palm-widths, not pixels**, so standing further from the camera
  doesn't quietly raise the bar. There is a test pinning that.
- **A pole only flips outside the deadband, and only in rhythm.** Between `−TILT` and
  `+TILT` the pair keeps whichever side it was on, so trembling at level scores nothing;
  and a crossing faster than `SIXSEVEN_MIN_BEAT_MS` or slower than
  `SIXSEVEN_MAX_BEAT_MS` restarts the run instead of banking it. Flailing and drifting
  both come out as zero, which is the point.

The counter is pure and copy-on-write like `pushSample`, so `sixSeven.test.ts` replays
whole rounds — including dropouts and out-of-tempo swaps — frame by frame with no camera
and no timers.

Two settings on the recognizer exist for specific reasons, both documented in
`src/vision/recognizer.ts`: `numHands: 2` (a second hand drifting into frame used to get
tracked instead of the signing one) and a `scoreThreshold` of `0.08` (at MediaPipe's
default of 0.5, `Thumb_Up` never appeared in the results at all).

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
src/recognition/  geometry · scoreFrame · rollingWindow · sixSeven (pure, unit-tested)
src/engine/       the rAF game loops: useAttempt, useSignRound
src/vision/       recognizer setup, camera, overlay, practice keys
src/progress/     session-only scores and the unlock gate
src/ui/           pictogram, split-flap board, meters, cards, scene art
src/screens/      Home, ScenarioGame, RushHour, AiGuess, SixSeven
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
| `SIXSEVEN_OPEN` | how flat both palms must be in 6-7 (0.55) |
| `SIXSEVEN_SPREAD` | how far apart the hands must sit, in palm-widths (0.9) |
| `SIXSEVEN_TILT` | how far one hand must ride above the other to commit a beat (0.55) |
| `SIXSEVEN_MIN_BEAT_MS` / `_MAX_` | the rhythm window a swap has to land in (120–1600 ms) |

If a shape scores badly, the live readout under the camera splits the two evidences —
`model 12 · shape 90` means the classifier is struggling, not your hand. The per-shape
formulas are in `geomScore` in `src/recognition/geometry.ts`, and each is pinned by a
test asserting it outscores all five rivals on a matching hand.
