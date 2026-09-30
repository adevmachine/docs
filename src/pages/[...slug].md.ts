import type { APIRoute } from 'astro'
import { getCollection } from 'astro:content'

export const prerender = true

const SITE = 'https://mydevmachine.sh'

export async function getStaticPaths() {
  const docs = await getCollection('docs', (entry) => entry.id !== 'index')
  const paths = docs.map((entry) => ({
    params: { slug: entry.id.replace(/\.md$/, '').replace(/\/index$/, '') },
    props: { entry },
  }))
  const movedGuides = paths
    .filter(({ params }) => params.slug === 'guides' || params.slug.startsWith('guides/'))
    .map(({ params, props }) => ({ params: { slug: params.slug.replace(/^guides/, 'examples') }, props }))
  return [...paths, ...movedGuides]
}

export const GET: APIRoute = async ({ props }) => {
  const entry = props.entry as Awaited<ReturnType<typeof getCollection<'docs'>>>[number]
  const body = (entry.body ?? '').replace(/\]\(\/docs\//g, `](${SITE}/docs/`)
  const content = `# ${entry.data.title}\n\n${body}`
  return new Response(content, {
    headers: { 'Content-Type': 'text/markdown; charset=utf-8' },
  })
}
