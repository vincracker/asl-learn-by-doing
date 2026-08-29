import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { writeFile, mkdir } from 'node:fs/promises'
import path from 'node:path'

/**
 * Dev-only endpoint that lets the /author tool write recordings straight to disk.
 *
 * Without this, authoring 10 signs means 20 rounds of download-then-move-the-file. It is
 * registered with `apply: 'serve'` so it can never reach a production build.
 */
function authorSavePlugin(): Plugin {
  return {
    name: 'asl-author-save',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use('/__author/save', async (req, res) => {
        if (req.method !== 'POST') {
          res.statusCode = 405
          return res.end('POST only')
        }

        try {
          const chunks: Buffer[] = []
          for await (const chunk of req) chunks.push(chunk as Buffer)
          const { id, template, clipBase64 } = JSON.parse(Buffer.concat(chunks).toString())

          if (!/^[a-z0-9-]+$/.test(id ?? '')) throw new Error(`unsafe sign id: ${id}`)

          const templateDir = path.resolve('src/signs/templates')
          const clipDir = path.resolve('public/clips')
          await mkdir(templateDir, { recursive: true })
          await mkdir(clipDir, { recursive: true })

          await writeFile(
            path.join(templateDir, `${id}.json`),
            JSON.stringify(template, null, 2),
          )
          if (clipBase64) {
            await writeFile(path.join(clipDir, `${id}.webm`), Buffer.from(clipBase64, 'base64'))
          }

          res.setHeader('content-type', 'application/json')
          res.end(JSON.stringify({ ok: true, id }))
        } catch (err) {
          res.statusCode = 400
          res.end(JSON.stringify({ ok: false, error: String(err) }))
        }
      })
    },
  }
}

export default defineConfig({
  plugins: [react(), tailwindcss(), authorSavePlugin()],
  // MediaPipe ships large prebuilt wasm; leave it out of dep optimization.
  optimizeDeps: { exclude: ['@mediapipe/tasks-vision'] },
})
