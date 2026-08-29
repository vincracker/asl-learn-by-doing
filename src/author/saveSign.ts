import type { SignTemplate } from '../recognition/matcher'

/** Posts a finished sign to the dev-only Vite middleware, which writes it to disk. */
export async function saveSign(
  id: string,
  template: SignTemplate,
  clip: Blob | null,
): Promise<void> {
  const clipBase64 = clip ? await blobToBase64(clip) : null

  const res = await fetch('/__author/save', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ id, template, clipBase64 }),
  })

  const body = (await res.json()) as { ok: boolean; error?: string }
  if (!res.ok || !body.ok) throw new Error(body.error ?? `save failed (${res.status})`)
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(reader.error ?? new Error('could not read clip'))
    reader.onload = () => {
      const result = String(reader.result)
      // Strip the "data:...;base64," prefix — the server wants raw base64.
      resolve(result.slice(result.indexOf(',') + 1))
    }
    reader.readAsDataURL(blob)
  })
}
