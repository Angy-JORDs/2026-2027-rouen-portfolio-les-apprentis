import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Port fixe : http://localhost:5173 figure dans CORS_ORIGINS de l'API d'équipe (.env.example).
export default defineConfig({
  plugins: [react()],
  server: { port: 5173, strictPort: true },
  preview: { port: 5173, strictPort: true },
})
