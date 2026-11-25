import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// En développement, /api est redirigé vers le backend FastAPI : pas de problème de CORS.
// Pour pointer vers une autre API, définir VITE_API_PROXY (voir .env.example).
const target = process.env.VITE_API_PROXY ?? "http://127.0.0.1:8000";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    proxy: { "/api": target },
  },
});
