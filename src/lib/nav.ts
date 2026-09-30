import { getCollection, type CollectionEntry } from 'astro:content'

const SECTION_ORDER = ['Getting started', 'Concepts', 'How it works', 'CLI Reference', 'Guides', 'Troubleshooting']

export type DocEntry = CollectionEntry<'docs'>

export function urlFor(entry: DocEntry): string {
  if (entry.id === 'index') return '/'
  return `/${entry.id.replace(/\.md$/, '')}/`.replace(/\/+$/, '/')
}

export function markdownUrlFor(entry: DocEntry): string {
  if (entry.id === 'index') return '/index.md'
  return `/${entry.id.replace(/\.md$/, '')}.md`
}

export async function getSortedDocs(): Promise<DocEntry[]> {
  const all = await getCollection('docs')
  return all
    .filter((entry) => entry.data.section)
    .sort((a, b) => {
      const sectionDiff = SECTION_ORDER.indexOf(a.data.section!) - SECTION_ORDER.indexOf(b.data.section!)
      if (sectionDiff !== 0) return sectionDiff
      if (a.data.order !== b.data.order) return a.data.order - b.data.order
      return a.data.title.localeCompare(b.data.title)
    })
}

export interface NavGroup {
  section: string
  items: { title: string; url: string; id: string }[]
}

export async function getNavGroups(): Promise<NavGroup[]> {
  const docs = await getSortedDocs()
  const groups = new Map<string, NavGroup>()
  for (const entry of docs) {
    const section = entry.data.section!
    if (!groups.has(section)) groups.set(section, { section, items: [] })
    groups.get(section)!.items.push({ title: entry.data.title, url: urlFor(entry), id: entry.id })
  }
  return SECTION_ORDER.filter((s) => groups.has(s)).map((s) => groups.get(s)!)
}

export async function getFlatDocs(): Promise<{ title: string; url: string; id: string }[]> {
  const groups = await getNavGroups()
  return groups.flatMap((g) => g.items)
}

export async function getPrevNext(id: string) {
  const flat = await getFlatDocs()
  const idx = flat.findIndex((d) => d.id === id)
  return {
    prev: idx > 0 ? flat[idx - 1] : null,
    next: idx >= 0 && idx < flat.length - 1 ? flat[idx + 1] : null,
  }
}
