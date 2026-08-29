import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  // MediaPipe ships large prebuilt wasm; leave it out of dep optimization.
  optimizeDeps: { exclude: ['@mediapipe/tasks-vision'] },
})
