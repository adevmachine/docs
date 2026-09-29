#!/usr/bin/env node
// Copies Markdown docs from a devmachine CLI checkout into src/content/docs/,
// rewriting relative .md links to site URLs and adding frontmatter (title,
// section, order) derived from docs/index.md. Output is gitignored: this
// repository never keeps its own copy of the CLI's documentation.

import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync, statSync, rmSync } from 'node:fs'
import { join, dirname, relative, resolve, posix } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')

const sourceDir = process.env.DEVMACHINE_CLI_DOCS
  ? resolve(process.cwd(), process.env.DEVMACHINE_CLI_DOCS)
  : join(root, '..', 'devmachine-cli', 'docs')

const outDir = join(root, 'src', 'content', 'docs')

const DROPPED = new Set(['development.md', 'releasing.md'])
const BASE = ''
const GITHUB_BLOB = 'https://github.com/mydevmachine/devmachine/blob/main/docs'

const SECTION_BY_PREFIX = [
  ['examples/', 'Real examples'],
  ['concepts/', 'Concepts'],
  ['how-it-works/', 'How it works'],
  ['reference/', 'CLI Reference'],
]

function sectionFor(relPath) {
  for (const [prefix, name] of SECTION_BY_PREFIX) {
    if (relPath.startsWith(prefix)) return name
  }
  if (relPath === 'getting-started.md') return 'Getting started'
  if (relPath === 'agent-setup.md') return 'Getting started'
  if (relPath === 'day-to-day.md') return 'Getting started'
  if (relPath === 'troubleshooting.md') return 'Troubleshooting'
  return null
}

function slugFor(relPath) {
  const noExt = relPath.replace(/\.md$/, '').replace(/(^|\/)index$/, '')
  if (noExt === '') return `${BASE}/`
  return `${BASE}/${noExt}/`
}

function walk(dir, base = '') {
  const entries = []
  for (const name of readdirSync(dir).sort()) {
    const full = join(dir, name)
    const rel = base ? `${base}/${name}` : name
    if (statSync(full).isDirectory()) {
      entries.push(...walk(full, rel))
    } else if (name.endsWith('.md')) {
      entries.push(rel)
    }
  }
  return entries
}

if (!existsSync(sourceDir)) {
  console.error(`devmachine CLI docs not found at ${sourceDir}`)
  console.error('Set DEVMACHINE_CLI_DOCS to the path of a devmachine-cli checkout docs/ directory.')
  process.exit(1)
}

const allFiles = walk(sourceDir).map((p) => p.split('\\').join('/'))
const keptFiles = allFiles.filter((f) => f !== 'index.md' && !DROPPED.has(f))

const indexRaw = existsSync(join(sourceDir, 'index.md')) ? readFileSync(join(sourceDir, 'index.md'), 'utf8') : ''

function parseIndexOrder(markdown) {
  const order = new Map()
  let position = 0
  const linkRe = /\]\(([a-zA-Z0-9_./-]+\.md)(#[^)]*)?\)/g
  let match
  while ((match = linkRe.exec(markdown))) {
    const target = match[1]
    if (!order.has(target)) order.set(target, position++)
  }
  return order
}

const indexOrder = parseIndexOrder(indexRaw)

function orderFor(relPath) {
  if (indexOrder.has(relPath)) return indexOrder.get(relPath)
  return 10000
}

function firstHeading(markdown, fallback) {
  const match = markdown.match(/^#\s+(.+)$/m)
  return match ? match[1].trim() : fallback
}

function resolveLinkTarget(currentRelPath, linkTarget) {
  const currentDir = dirname(currentRelPath)
  const [pathPart, anchor] = splitAnchor(linkTarget)
  const resolved = posix.normalize(posix.join(currentDir === '.' ? '' : currentDir, pathPart))
  return { resolved, anchor }
}

function splitAnchor(target) {
  const idx = target.indexOf('#')
  if (idx === -1) return [target, '']
  return [target.slice(0, idx), target.slice(idx)]
}

function rewriteLinks(markdown, currentRelPath) {
  return markdown.replace(/\]\(([a-zA-Z0-9_./-]+\.md)(#[^)]*)?\)/g, (full, linkPath, anchor) => {
    const { resolved } = resolveLinkTarget(currentRelPath, linkPath + (anchor ?? ''))
    if (DROPPED.has(resolved)) {
      return `](${GITHUB_BLOB}/${resolved}${anchor ?? ''})`
    }
    const url = slugFor(resolved)
    return `](${url}${anchor ?? ''})`
  })
}

rmSync(outDir, { recursive: true, force: true })
mkdirSync(outDir, { recursive: true })

const pages = []

for (const relPath of keptFiles) {
  const raw = readFileSync(join(sourceDir, relPath), 'utf8')
  const title = relPath === 'examples/index.md' ? 'All examples' : firstHeading(raw, relPath)
  const section = sectionFor(relPath)
  const body = rewriteLinks(raw.replace(/^#\s+.+\n/, ''), relPath)
  const firstParagraph = (body.match(/^(?!#|```|\s*$)(.+)$/m) || [, ''])[1]
    .replace(/[*_`]/g, '')
    .trim()

  const outRel = relPath
  const outPath = join(outDir, outRel)
  mkdirSync(dirname(outPath), { recursive: true })

  const frontmatter = [
    '---',
    `title: ${JSON.stringify(title)}`,
    `section: ${JSON.stringify(section)}`,
    `order: ${orderFor(relPath)}`,
    `sourcePath: ${JSON.stringify(`docs/${relPath}`)}`,
    `summary: ${JSON.stringify(firstParagraph)}`,
    '---',
    '',
  ].join('\n')

  writeFileSync(outPath, frontmatter + body)

  pages.push({
    relPath,
    slug: slugFor(relPath).replace(/^\/docs\//, '').replace(/\/$/, '') || 'index',
    title,
    section,
    order: orderFor(relPath),
    url: slugFor(relPath),
    summary: firstParagraph,
  })
}

writeFileSync(join(outDir, '_manifest.json'), JSON.stringify(pages, null, 2))

console.log(`fetch-docs: wrote ${pages.length} pages from ${sourceDir} to ${relative(root, outDir)}`)
