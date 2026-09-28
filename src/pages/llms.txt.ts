import type { APIRoute } from 'astro'
import { getSortedDocs, urlFor } from '../lib/nav'

export const prerender = true

export const GET: APIRoute = async () => {
  const docs = await getSortedDocs()
  const lines = [
    '# devmachine',
    '',
    '> devmachine sets up and operates a personal development VPS: the first SSH handshake, hardening, users, Docker, a reverse proxy with automatic TLS, subdomains and DNS.',
    '',
    '## Docs',
    '',
    ...docs.map((entry) => `- [${entry.data.title}](https://adevmachine.github.io${urlFor(entry)}): ${entry.data.summary}`),
    '',
  ]
  return new Response(lines.join('\n'), {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  })
}
