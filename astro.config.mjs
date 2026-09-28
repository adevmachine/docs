import { defineConfig } from 'astro/config'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  site: 'https://mydevmachine.github.io',
  base: '/docs',
  trailingSlash: 'always',
  vite: {
    plugins: [tailwindcss()],
  },
})
