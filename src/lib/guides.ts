import { getSortedDocs, urlFor, type DocEntry } from './nav'

export const GUIDE_CATEGORIES = ['Get started', 'Workspaces', 'Agents', 'Web apps', 'Networking', 'Security'] as const

export const LEGACY_GUIDES_PATH = 'examples'

export interface Guide {
  id: string
  url: string
  title: string
  description: string
  category: string | null
  minutes: number | null
  level: string | null
  needs: string[]
  related: string[]
}

export function categorySlug(category: string): string {
  return category.toLowerCase().replace(/[^a-z0-9]+/g, '-')
}

export function isGuide(entry: DocEntry): boolean {
  return entry.data.section === 'Guides' && entry.id !== 'guides'
}

function toGuide(entry: DocEntry): Guide {
  return {
    id: entry.id,
    url: urlFor(entry),
    title: entry.data.title,
    description: entry.data.summary,
    category: entry.data.category ?? null,
    minutes: entry.data.minutes ?? null,
    level: entry.data.level ?? null,
    needs: entry.data.needs,
    related: entry.data.related,
  }
}

export async function getGuides(): Promise<Guide[]> {
  const docs = await getSortedDocs()
  return docs.filter(isGuide).map(toGuide)
}

export async function getRelatedGuides(entry: DocEntry): Promise<Guide[]> {
  const guides = await getGuides()
  const byUrl = new Map(guides.map((g) => [g.url, g]))
  const listed = entry.data.related.map((url) => byUrl.get(url)).filter((g): g is Guide => Boolean(g))
  if (listed.length > 0) return listed
  const self = urlFor(entry)
  const index = guides.findIndex((g) => g.url === self)
  return index >= 0 ? guides.slice(index + 1, index + 3) : []
}

export function minutesLabel(minutes: number | null): string | null {
  return minutes ? `${minutes} min` : null
}
