import type { APIRoute } from 'astro'
import { getSortedDocs, urlFor } from '../lib/nav'

export const prerender = true

export const GET: APIRoute = async () => {
  const docs = await getSortedDocs()
  const parts = docs.map((entry) => {
    const url = `https://mydevmachine.sh${urlFor(entry)}`
    return `# ${url}\n\n${entry.body ?? ''}`
  })
  return new Response(parts.join('\n\n---\n\n'), {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  })
}
