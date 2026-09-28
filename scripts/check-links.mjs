#!/usr/bin/env node
// Zero-dependency internal link checker for the built dist/ directory.

import { readFileSync, existsSync, statSync, readdirSync } from 'node:fs'
import { join } from 'node:path'

const distDir = join(process.cwd(), 'dist')

function listHtmlFiles(dir) {
  const out = []
  for (const name of readdirSync(dir)) {
    const full = join(dir, name)
    if (statSync(full).isDirectory()) out.push(...listHtmlFiles(full))
    else if (name.endsWith('.html')) out.push(full)
  }
  return out
}

const BASE = ''
const SITE_ORIGIN = 'https://mydevmachine.sh'

function listMarkdownFiles(dir) {
  const out = []
  for (const name of readdirSync(dir)) {
    const full = join(dir, name)
    if (statSync(full).isDirectory()) out.push(...listMarkdownFiles(full))
    else if (name.endsWith('.md')) out.push(full)
  }
  return out
}

function resolveLocal(href) {
  let normalized = href
  if (normalized.startsWith(SITE_ORIGIN)) normalized = normalized.slice(SITE_ORIGIN.length)
  const [pathPart, anchor] = normalized.split('#')
  let target = pathPart
  if (target === '') return { file: null, anchor }
  if (!target.startsWith('/')) return { file: null, anchor }
  if (target.startsWith(BASE)) target = target.slice(BASE.length) || '/'
  else return { file: null, anchor }
  if (target.endsWith('/')) target += 'index.html'
  else if (!target.endsWith('.html') && !target.match(/\.[a-z0-9]+$/i)) target += '/index.html'
  return { file: join(distDir, target), anchor }
}

const files = listHtmlFiles(distDir)
let broken = 0
let checked = 0

for (const file of files) {
  const html = readFileSync(file, 'utf8')
  const hrefRe = /href="([^"]+)"/g
  let match
  while ((match = hrefRe.exec(html))) {
    const href = match[1]
    const isLocal = href.startsWith('/') || href.startsWith(SITE_ORIGIN)
    if (!isLocal || href.startsWith('mailto:') || href.startsWith('#')) continue
    checked++
    const { file: targetFile, anchor } = resolveLocal(href)
    if (!targetFile) continue
    if (!existsSync(targetFile)) {
      console.error(`BROKEN: ${file.replace(distDir, '')} -> ${href}`)
      broken++
      continue
    }
    if (anchor && targetFile.endsWith('.html')) {
      const targetHtml = readFileSync(targetFile, 'utf8')
      const idRe = new RegExp(`id="${anchor}"`)
      if (!idRe.test(targetHtml)) {
        console.error(`BROKEN ANCHOR: ${file.replace(distDir, '')} -> ${href}`)
        broken++
      }
    }
  }
}

console.log(`Checked ${checked} local links across ${files.length} HTML pages.`)

// Every doc page's raw-Markdown counterpart (<link rel="alternate" type="text/markdown">)
// must exist as an actual .md file in the build output.
let markdownChecked = 0
for (const file of files) {
  const html = readFileSync(file, 'utf8')
  const alt = html.match(/<link rel="alternate" type="text\/markdown" href="([^"]+)"/)
  if (!alt) continue
  markdownChecked++
  const { file: targetFile } = resolveLocal(alt[1])
  if (!targetFile || !existsSync(targetFile)) {
    console.error(`BROKEN .md ALTERNATE: ${file.replace(distDir, '')} -> ${alt[1]}`)
    broken++
  }
}
console.log(`Checked ${markdownChecked} .md alternate links.`)

const mdFiles = listMarkdownFiles(distDir)
console.log(`Found ${mdFiles.length} raw-Markdown files in dist/.`)

if (broken > 0) {
  console.error(`${broken} broken link(s) found.`)
  process.exit(1)
}
console.log('No broken links.')
