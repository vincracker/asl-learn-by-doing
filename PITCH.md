# HandsUp — pitch

Two things in here: the **4-minute script** to deliver, and the **Q&A prep** for after.

---

# How this answers the brief

**The brief:** the world is built from interconnected blocks, and people get left behind
when those blocks are disconnected, inaccessible or missing.

**Our answer: this block isn't missing — it's one-way.**

A bus, a pharmacy counter, an airport desk. Every one of those blocks *exists* and works.
What's missing is the joint between them and a Deaf person: a shared language at the point
of contact. And that joint has only ever been built from one side. Deaf people learn to
read our language, write it, lip-read it. Hearing people build nothing back.

HandsUp adds material to the other side of that joint.

It lands on three of the four prompts:

| Prompt | How |
|---|---|
| **Genuine connection in a world where tech isolates us** | The primary answer — see below |
| **Accessibility to essential resources** | The scenarios *are* essential resources: transit, a service counter, a pharmacy. Not abstract vocabulary |
| **Connecting with other cultures** | Deaf culture is a culture with its own language, and this is a hearing person's first door into it |

**The strongest single point for this brief:** almost all "connection technology" inserts
itself *between* people. Translation apps, captioning, text relay — they work, and they all
mean the Deaf person is dependent on your phone being charged, your signal holding, your
subscription being live. **This is the opposite: it removes itself.** You learn, and then
you don't need it. The next conversation needs no technology at all.

---

# The 4-minute script

**542 spoken words** plus three live demo beats (~20s of unavoidable silence):

| Your pace | Total |
|---|---|
| 140 wpm — measured, deliberate | 4:12 — take one cut |
| 150 wpm — normal presenting | **3:56** |
| 160 wpm — where nerves put most people | **3:43** |

Comfortable at any normal pace, with the cut list below as slack. **Time yourself out loud
once** before trusting any of these numbers.

Talk *over* the demos. Don't stop and watch them with the room.

| Time | Beat | Serves |
|---|---|---|
| 0:00 | The one-way block | **The brief** + Innovation |
| 0:30 | What it is + live scoring | Innovation |
| 1:10 | Who it's for | Practicality |
| 1:50 | Two things the model got wrong | Technical |
| 2:55 | Deny the camera | Elegance |
| 3:15 | What this isn't | Credibility |
| 3:30 | Technology that removes itself | **The brief** |

---

### 0:00 — The one-way block *(no screen, just you)*

> The brief says our world is built from blocks, and people get left behind when those
> blocks are disconnected.
>
> I want to show you one that isn't missing. It's **one-way**.
>
> Every day, Deaf people learn to read our language. Write it. Lip-read it. Most of us
> never learn one word of theirs.
>
> The connection still gets made. It just always costs the same person.

### 0:30 — What it is *(open the site)*

> This is HandsUp. A browser tab. No account, no download.
>
> And it doesn't teach a vocabulary list. It puts you at an airport check-in desk.

*[click **Airport**]*

> The agent asks what you need. You answer her — with your hands.

### 0:50 — First demo *(camera on, sign Open Palm)*

> That's my webcam, scoring the shape of my hand sixty times a second. Nothing leaves this
> laptop — no upload, no server. Entirely client-side.

*[let the score land]*

> Hit 80% and the next scenario unlocks. Airport, then a bus. Next one I'm building is a
> pharmacy counter.

### 1:10 — Who it's for

> Not people already learning to sign — they have better tools than mine.
>
> It's for the person on the *other* side of that counter. The check-in agent. The bus
> driver. The pharmacist.
>
> Nobody becomes a signer in five minutes — that isn't the goal. The goal is the moment
> someone realises the gap is *crossable*. That realisation is the expensive part;
> vocabulary is cheap once somebody wants it.
>
> And it's static files. No backend, no per-user cost. A QR code at a staff induction.

### 1:50 — The technical part

> I'll be straight with you: I didn't train a model. Hand detection is MediaPipe's
> pretrained recognizer. The engineering is everything around it — because that model is
> wrong in two specific ways.
>
> The first nearly killed the project. Thumbs-up scored zero. Not badly — *exactly* zero,
> every time. Nothing crashed. Turns out MediaPipe hides any gesture scoring under 0.5 by
> default, and thumbs-up sits around 0.4, because "closed fist" outranks it. It was being
> deleted before I ever saw it.
>
> The second one I couldn't fix with settings. A thumbs-up *is* a closed fist plus a
> thumb. The model genuinely can't separate them.
>
> So I stopped asking it. I score the twenty-one hand landmarks myself and take whichever
> answer is stronger. The trick is measuring each finger as a **ratio** — tip-to-wrist over
> knuckle-to-wrist — because a ratio doesn't care how your hand is tilted.

*[hold a deliberately tilted thumbs-up]*

> Model's confidence is low. Geometry says ninety. It scores.

### 2:55 — Deny the camera

> One more. Camera apps fail. So —

*[deny camera permission]*

> — I've just blocked camera access. The game still plays. Keys one to six stand in for a
> hand. No model, no WebGL, no camera: every mode stays playable. Never a dead end.

### 3:15 — What this isn't

> Honest about the limits: six pretrained hand shapes, not real ASL. Real signs use two
> hands, movement, position, and facial grammar that carries meaning. A first door, not a
> dictionary — and the app says so on its front page.

### 3:30 — Close: technology that removes itself

> Last thought. Most connection technology puts itself *between* people. Translation apps,
> captioning, text relay — they all work, and they all mean the Deaf person depends on your
> phone being charged.
>
> This does the opposite. You learn it, and then you don't need it. The next conversation
> needs no technology at all.
>
> That's the block I wanted to add. Not another intermediary — just some material on the
> side of the joint that never gets built.
>
> HandsUp. Thank you.

---

## Delivery notes

**If you're running long, cut in this order** — each is self-contained, so nothing breaks:

1. *"Airport, then a bus. Next one I'm building is a pharmacy counter."* at 0:50 *(−8s)*
2. *"And it's static files — no backend, no per-user cost. A QR code at a staff
   induction."* at 1:10 *(−11s)*
3. The MediaPipe threshold explanation at 1:50 — keep *"thumbs-up scored exactly zero"*
   and jump straight to the fist/thumb problem *(−18s)*

**Never cut:** the one-way-block opening, the live scoring demo, the camera denial, or the
close. Those four carry the brief, Innovation, Elegance and the brief again — and the
opening and close are the pair that make this an answer to *this* hackathon rather than a
generic accessibility demo.

**If you're running short**, add the duel: *"and because practising alone is boring —
it's also a two-player game. Sixty seconds, one webcam, turns hand over automatically."*
Show it for ten seconds. Don't play a full round.

**Demo safety.**

- Rehearse in **the room's lighting** if you possibly can. Hand tracking degrades badly
  in dim or heavily backlit rooms, and that is the failure most likely to bite you.
- Have the site **already loaded** in a tab before you start. The model is 8 MB; loading
  it live in front of judges wastes fifteen seconds of your four minutes.
- **Deny the camera *last*.** Once denied, most browsers won't re-prompt without a page
  reload, so it can't wreck an earlier beat.
- If live scoring fails entirely, the recovery line is already true: *"and this is exactly
  why keys one to six exist"* — then finish the demo on the keyboard. **A failure you
  planned for reads as competence, not an accident.**

**Where to slow down.** Two moments carry the pitch — *"exactly zero, every time"*, and
the beat right after you deny the camera. Pause after both. Let them land.

---

# Q&A prep

**The frame to hold onto: you did not train a model, and you should say so early.**
Everything worth pointing at is the layer built around MediaPipe — compensating for what
it gets wrong, turning per-frame guesses into a fair score, and running it in a game loop.
Volunteering the limitation buys credibility for everything else.

## The 30-second architecture answer

> "Entirely client-side. MediaPipe's Gesture Recognizer runs in the browser on
> WebAssembly with a WebGL backend, on a requestAnimationFrame loop. No backend, no
> upload — frames are read and discarded. The model and WASM are vendored into the app,
> so it works offline after first load."

Numbers to have ready: **8 MB model**, **136 KB gzipped bundle**, **62 unit tests**,
**6 hand shapes**, GPU delegate with automatic **CPU fallback** at init.

## The four problems

Tell each **symptom → why it was non-obvious → what you did**. Symptom-first is what makes
these stories instead of a feature list. Problems 1 and 2 are in the script; 3 and 4 are
held back for questions.

### 1. The gesture that scored exactly zero

**Symptom.** Thumbs-up never scored — *exactly zero*, every attempt, while the other five
shapes worked. Nothing crashed, nothing in the console.

**Two compounding causes, both upstream of anything obvious:**

- MediaPipe's canned classifier **hides any category below 0.5 by default**. `Thumb_Up`
  routinely sits at 0.3–0.45 because `Closed_Fist` takes the top slot — filtered out
  before our code ever saw it.
- Even after lowering that, the obvious read — `result.gestures[0][0]` — takes the **top**
  category of the **first** hand. `Thumb_Up` comes *second*. Still discarded.

**Fix.** `cannedGesturesClassifierOptions: { scoreThreshold: 0.08 }`, and `scoreFrame`
iterates every category of every hand.

**Why it's the best story.** A bug that produces a *working-looking* app that is silently
wrong — no exception, no stack trace. Finding it meant reasoning about the shape of the
model's output. The "library defaults are hiding your data" class of bug.

### 2. The model can't tell a thumbs-up from a fist

**Unfixable by configuration.** A thumbs-up *is* a closed fist plus one thumb.

**So we score the raw landmarks ourselves** and take whichever evidence is stronger:

```
conf = max(modelScore, 0.92 × shapeScore)
```

A finger is extended when its **tip sits much further from the wrist than its middle
joint** — a *ratio*, so it's rotation-invariant. The naive test (is the tip higher up the
screen than the knuckle?) falls apart the moment you tilt your hand.

If they want more:
- The `0.92` weights geometry just below the model, so the model wins ties.
- Orientation *nudges* the score but never zeroes it — a tilted thumbs-up is still a
  thumbs-up to anyone watching, so it should still be to us.

**Proof.** Each of the six formulas has a test asserting it outscores all five rivals on a
matching hand, plus a test rotating a hand 40° and checking it still reads.

### 3. Scoring in time, not in frames

**Naive:** score every frame, keep the best. **Flaw:** one lucky frame carries the
attempt — you could flail at the camera and pass.

- **800 ms rolling mean.** Your score is the best 800 ms window, so a steady hold is
  rewarded and a fluke isn't.
- **260 ms dropout bridge.** Tracking drops out constantly — motion blur, hand half out of
  frame. A dropout coasts on 80% of its last good confidence rather than recording a zero
  mid-hold.
- **A "settled" check.** A window needs 75% of its duration behind it, or the first frame
  after a new word scores off a mean of one sample.

Pure functions, copy-on-write — an attempt replays frame by frame in a test with no
camera, no DOM and **no timers**.

### 4. A game loop that gave away free points

**Symptom.** In rush hour, players cleared words they hadn't signed.

**Cause.** The obvious design restarts the scoring loop when the word changes — but the
player is **still holding the shape from the last hit**, so their unchanged hand instantly
clears the new one.

**Fix is architectural.** **One `requestAnimationFrame` loop for the entire round.**
Advancing is a *state change*, never a restart — guarded by the settled check plus a
**400 ms cooldown**. Extracted into a pure `isHit()` and tested on its own, including the
"one continuous hold cannot clear two words" case.

## If they ask about React

- **`useFrameSource` returns a lifetime-stable function.** It's a dependency of the game
  loops, so a fresh identity restarts an attempt — *resetting the player's clock*. It would
  have fired every time the model finished loading or the camera flipped to keys-only
  mid-round.
- **StrictMode double-invocation was a scoring bug, not a warning.** Applying a duel turn
  inside a `setState` updater counted the mistake **twice**.
- **DrawingUtils is cached against its canvas context** — building one per frame allocates
  a WebGL-backed helper sixty times a second for nothing.

## If they ask about testing

> "Recognition, scoring and the duel's match rules are pure functions and pure state
> machines — no React, no camera, no DOM, no timers. 62 tests. `applyTurn` takes the word
> picker *and* the clock as arguments, so an entire 60-second two-player match replays
> deterministically in milliseconds."

The strongest single claim about code quality in the project.

## Have an answer ready for

| Question | Answer |
|---|---|
| **"What was the hardest part?"** | Problem 1 — silent, non-crashing, required reasoning about the model's output shape. |
| **"Did you train the model?"** | No. MediaPipe's pretrained recognizer. Say it early and unprompted. |
| **"Why not just use the classifier output?"** | Problem 2 — it can't separate a thumbs-up from a fist, and no parameter fixes that. |
| **"Is this real ASL?"** | No, and the app says so. Six pretrained gesture classes mapped to phrases. |
| **"What's next technically?"** | A sequence model over landmark trajectories, not a per-frame classifier. Honest, and a much bigger job. |
| **"Isn't this just a MediaPipe demo?"** | The demo scores `gestures[0][0]` and gets thumbs-up wrong. Everything here exists because that isn't good enough to grade someone on. |

**The trap:** don't let *"we used MediaPipe"* become the headline. The headline is *"the
pretrained model was wrong in two specific, diagnosable ways, and here's what I built to
compensate."*

---

## Before you present

| Claim | Where |
|---|---|
| `scoreThreshold: 0.08`, `numHands: 2`, GPU→CPU fallback | `src/vision/recognizer.ts` |
| Searches every category of every hand | `src/recognition/scoreFrame.ts` |
| `max(model, 0.92 × shape)` | same file, return statement |
| Rotation-invariant ratio, 40° test | `src/recognition/geometry.ts` · `geometry.test.ts` |
| 800 ms window, 260 ms bridge, 75% settled | `src/recognition/rollingWindow.ts` |
| 400 ms cooldown, one hold ≠ two words | `src/engine/hitRule.ts` · `hitRule.test.ts` |
| Deterministic match replay | `src/duel/matchState.test.ts` |
| 62 tests | `pnpm test` |
| 136 KB gzipped | `pnpm build` |
