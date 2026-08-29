import { readFile } from 'node:fs/promises'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    {
      name: 'fix-mediapipe-source-map',
      enforce: 'pre',
      async load(id) {
        if (!id.includes('@mediapipe/tasks-vision/vision_bundle.mjs')) return

        // tasks-vision 1.0.1 points at a map filename that is not published.
        const code = await readFile(id.split('?')[0], 'utf8')
        return code.replace(/\n\/\/# sourceMappingURL=vision_bundle_mjs\.js\.map\s*$/, '')
      },
    },
    react(),
    tailwindcss(),
  ],
  // MediaPipe ships large prebuilt wasm; leave it out of dep optimization.
  optimizeDeps: { exclude: ['@mediapipe/tasks-vision'] },
})
