import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import seoPrerender from './seo-prerender.js'

// Port fixe : http://localhost:5173 figure dans CORS_ORIGINS de l'API d'équipe (.env.example).
// seoPrerender : version texte du portfolio dans index.html, lisible par les robots (voir seo-prerender.js).
export default defineConfig({
  plugins: [react(), seoPrerender()],
  server: { port: 5173, strictPort: true },
  preview: { port: 5173, strictPort: true },
})
