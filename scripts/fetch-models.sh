#!/usr/bin/env bash
# Downloads the MediaPipe task models into public/mp/models/ once. Commit the results —
# the demo must run with no network.
set -euo pipefail
cd "$(dirname "$0")/.."
mkdir -p public/mp/models
BASE=https://storage.googleapis.com/mediapipe-models
fetch() { echo "fetching $2"; curl -fsSL "$1" -o "public/mp/models/$2"; }
fetch "$BASE/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task" hand_landmarker.task
fetch "$BASE/face_detector/blaze_face_short_range/float16/1/blaze_face_short_range.tflite" blaze_face_short_range.tflite
ls -lh public/mp/models
