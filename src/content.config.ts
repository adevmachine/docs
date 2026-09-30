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
    description: z.string().nullable().optional(),
    category: z.string().nullable().optional(),
    minutes: z.number().nullable().optional(),
    level: z.string().nullable().optional(),
    needs: z.array(z.string()).default([]),
    related: z.array(z.string()).default([]),
  }),
})

export const collections = { docs }
