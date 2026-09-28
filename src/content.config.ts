import { defineCollection, z } from 'astro:content'
import { glob } from 'astro/loaders'

const docs = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/docs' }),
  schema: z.object({
    title: z.string(),
    section: z.string().nullable(),
    order: z.number(),
    sourcePath: z.string(),
    summary: z.string(),
  }),
})

export const collections = { docs }
