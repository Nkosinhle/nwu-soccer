/**
 * Shared PPTX export helper for client components.
 * Import this in any page that needs a PowerPoint download button.
 *
 * Usage:
 *   import { downloadPptx } from '@/lib/pptx-client'
 *   <button onClick={() => downloadPptx('match-summary', { matchId }, 'Match')}>Export</button>
 */
export async function downloadPptx(
  type: string,
  payload: Record<string, unknown>,
  label: string,
): Promise<void> {
  const res = await fetch('/api/export/pptx', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type, ...payload }),
  })
  if (!res.ok) throw new Error(`Export failed: ${res.status}`)
  const blob = await res.blob()
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href     = url
  a.download =
    res.headers.get('Content-Disposition')?.match(/filename="(.+)"/)?.[1] ??
    `${label.replace(/\s+/g, '_')}.pptx`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
