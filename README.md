# Signpost — practise everyday ASL

A browser game for learning basic American Sign Language through everyday scenarios.
Your webcam watches your hands and scores how close your sign was.

Ten everyday signs — HELLO, HOW ARE YOU, PLEASE, THANK YOU, MORE, HELP, NO, LIKE, GO,
FORGET — across two scenes: meeting someone, and ordering at a café.

Everything runs locally: no video is uploaded, and after the first load the app needs no
network at all.

> **What this is and isn't.** The app checks handshape, position relative to your face,
> palm orientation and movement. It cannot see facial grammar, which carries real
> meaning in ASL. Treat it as practice feedback, not assessment, and learn from Deaf
> teachers and native signers. Sign descriptions are transcribed from standard
> references (Lifeprint / HandSpeak); regional variation is real.

## Quick start

```bash
pnpm install          # also vendors the MediaPipe wasm into public/mp/wasm
pnpm fetch-models     # one-time: downloads the two .task/.tflite models
pnpm dev              # http://localhost:5173
```

The camera needs a secure context. `localhost` counts; serving over a LAN IP does not —
use HTTPS (`vite --host` plus `@vitejs/plugin-basic-ssl`) if you demo from another device.

## How recognition works

```
camera ─► HandLandmarker (21 landmarks × 2 hands) ─┐
          FaceDetector (body anchor) ──────────────┴─► Frame
                                                        │
                        normalize.ts ───────────────────┘
                        · handshape  63  translation/scale/rotation invariant
                        · location    3  measured in face-widths from the face
                        · orientation 3  palm normal
                                                        │
                        segment.ts ─── motion gate ─────┤
                                                        ▼
                        dtw.ts ─── banded DTW vs stored template ─► score 0..1
```

Three design notes worth knowing before you change anything:

- **Location is a first-class feature.** The same handshape at the forehead and at the
  chest are different signs, so hand position is measured relative to the detected face
  and expressed in face-widths. That's what `FaceDetector` is for.
- **Thresholds are self-calibrating.** Recording three takes of a sign yields its own
  pass threshold from the take-to-take spread — no per-sign magic numbers. A sign you
  performed inconsistently gets a correspondingly forgiving threshold, and its low
  "take consistency" score tells you to re-record.
- **Mirroring is a display concern only.** The preview is flipped with CSS; MediaPipe
  always receives the raw frame. See the note at the top of `src/recognition/normalize.ts`
  before touching coordinates.

## Recording signs

Signs live in two halves: metadata in `src/signs/catalog.ts` (committed, describes every
sign the app knows about) and recorded templates in `src/signs/templates/*.json`
(generated). A sign without a template still appears in the UI, marked "not recorded",
and scenario beats using it can be skipped.

To record one, run `pnpm dev` and open **/author** (dev builds only):

1. Pick the sign and read its description.
2. Tap **Tap to sign** (or hit space), get into position at your own pace, then sign.
   Recording starts on your first real movement and stops by itself when you go still,
   so there is no release to time. Do this three times, performing the sign the same way
   each take — consistency matters more than perfection.
3. Check the **take consistency** meter. Low means your three takes disagree; re-record
   rather than saving. The tool also names the closest already-recorded sign, so you can
   spot a confusable pair (HELLO/FORGET both start at the forehead; PLEASE/LIKE both sit
   at the chest) while you can still do something about it.
4. Save. A dev-only Vite middleware writes `src/signs/templates/<id>.json` and
   `public/clips/<id>.webm` straight to disk. Reload to pick them up.

The webm clip becomes the "watch this" reference shown to learners, so the demo video and
the scoring template always come from the same performance.

## Layout

```
src/vision/       camera, MediaPipe setup, the rAF detection loop
src/recognition/  normalize · dtw · segment · matcher   (pure, unit-tested)
src/signs/        catalog (committed) + templates (generated) + registry
src/scenarios/    scripted dialogue for each scene
src/game/         Learn & Mimic, the scenario runner, shared capture hook
src/author/       the recording tool (dev only)
```

The recognition modules are deliberately free of React so they can be tested headless.

## Scripts

| | |
|---|---|
| `pnpm dev` | dev server + the `/author` save endpoint |
| `pnpm test` | recognition unit tests |
| `pnpm build` | typecheck + production bundle |
| `pnpm lint` | oxlint |
| `pnpm fetch-models` | re-download the MediaPipe models |

## Tuning recognition

If scores feel too harsh or too lenient across the board, adjust `WEIGHTS` in
`src/recognition/dtw.ts` (how much handshape vs location vs orientation counts) or
`PASS_TOLERANCE` in `src/recognition/matcher.ts` (how much looser a learner may be than
your own takes). If attempts are being cut short or never trigger, the motion thresholds
are in `DEFAULT_SEGMENT_CONFIG` in `src/recognition/segment.ts`: `startThreshold` decides
how much movement begins a take, `stopThreshold` and `quietFrames` how much stillness ends
one, and `armTimeoutFrames` how long a tapped capture waits before giving up.

Two safeguards exist because self-consistency alone sets a dangerous threshold. A sloppy
recording produces a wide gate, and a wide gate admits *other* signs — so `calibrate()`
also caps the threshold at `PASS_DISTANCE_MAX` and at a fraction of the distance to the
nearest already-recorded sign. If a template refuses to pass anything, the recording was
inconsistent; re-record rather than raising the caps.

Captured takes are trimmed to their motion span (`trimToMotion` in `segment.ts`) before
scoring. Without it a take is mostly the hand rising into position and dropping away
afterwards, which differs every time and destroys consistency.
