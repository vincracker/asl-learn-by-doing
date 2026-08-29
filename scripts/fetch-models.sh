#!/usr/bin/env bash
# Downloads the MediaPipe task models into public/mp/models/ once. Commit the results —
# the demo must run with no network.
set -euo pipefail
cd "$(dirname "$0")/.."
mkdir -p public/mp/models
BASE=https://storage.googleapis.com/mediapipe-models
fetch() { echo "fetching $2"; curl -fsSL "$1" -o "public/mp/models/$2"; }
fetch "$BASE/gesture_recognizer/gesture_recognizer/float16/1/gesture_recognizer.task" gesture_recognizer.task
ls -lh public/mp/models
