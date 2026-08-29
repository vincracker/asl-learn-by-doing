// Copies MediaPipe wasm out of node_modules into public/ so the app never hits a CDN.
// Runs on postinstall; models are committed separately (see scripts/fetch-models.sh).
import { cp, mkdir } from 'node:fs/promises'

const SRC = 'node_modules/@mediapipe/tasks-vision/wasm'
const DEST = 'public/mp/wasm'

await mkdir(DEST, { recursive: true })
await cp(SRC, DEST, { recursive: true })
console.log(`vendored mediapipe wasm -> ${DEST}`)
