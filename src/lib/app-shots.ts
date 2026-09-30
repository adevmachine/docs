import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

export interface Shot {
  name: string
  alt: string
  caption?: string
}

export interface ResolvedShot extends Shot {
  src: string
  exists: boolean
  width: number
  height: number
}

const FALLBACK = { width: 1600, height: 1000 }

export function webpSize(buf: Buffer): { width: number; height: number } | null {
  if (buf.toString('ascii', 0, 4) !== 'RIFF' || buf.toString('ascii', 8, 12) !== 'WEBP') return null
  const chunk = buf.toString('ascii', 12, 16)
  if (chunk === 'VP8X') {
    return { width: 1 + buf.readUIntLE(24, 3), height: 1 + buf.readUIntLE(27, 3) }
  }
  if (chunk === 'VP8 ') {
    return { width: buf.readUInt16LE(26) & 0x3fff, height: buf.readUInt16LE(28) & 0x3fff }
  }
  if (chunk === 'VP8L') {
    const bits = buf.readUInt32LE(21)
    return { width: 1 + (bits & 0x3fff), height: 1 + ((bits >> 14) & 0x3fff) }
  }
  return null
}

function shotFile(shot: Shot): string {
  return join(process.cwd(), 'public', 'app', `${shot.name}.webp`)
}

export function shotExists(shot: Shot): boolean {
  return existsSync(shotFile(shot))
}

export function resolveShot(shot: Shot, base: string): ResolvedShot {
  const file = shotFile(shot)
  const src = `${base}app/${shot.name}.webp`
  if (!existsSync(file)) return { ...shot, src, exists: false, ...FALLBACK }
  const size = webpSize(readFileSync(file)) ?? FALLBACK
  return { ...shot, src, exists: true, ...size }
}
