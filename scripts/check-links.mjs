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

const BASE = '/docs'

function resolveLocal(href) {
  const [pathPart, anchor] = href.split('#')
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
    if (href.startsWith('http') || href.startsWith('mailto:') || href.startsWith('#')) continue
    checked++
    const { file: targetFile, anchor } = resolveLocal(href)
    if (!targetFile) continue
    if (!existsSync(targetFile)) {
      console.error(`BROKEN: ${file.replace(distDir, '')} -> ${href}`)
      broken++
      continue
    }
    if (anchor) {
      const targetHtml = readFileSync(targetFile, 'utf8')
      const idRe = new RegExp(`id="${anchor}"`)
      if (!idRe.test(targetHtml)) {
        console.error(`BROKEN ANCHOR: ${file.replace(distDir, '')} -> ${href}`)
        broken++
      }
    }
  }
}

console.log(`Checked ${checked} local links across ${files.length} pages.`)
if (broken > 0) {
  console.error(`${broken} broken link(s) found.`)
  process.exit(1)
}
console.log('No broken links.')
