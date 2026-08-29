import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // MediaPipe ships large prebuilt wasm; leave it out of dep optimization.
  optimizeDeps: { exclude: ['@mediapipe/tasks-vision'] },
})
