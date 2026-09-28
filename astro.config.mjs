import { defineConfig } from 'astro/config'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  site: 'https://mydevmachine.sh',
  trailingSlash: 'always',
  vite: {
    plugins: [tailwindcss()],
  },
})
