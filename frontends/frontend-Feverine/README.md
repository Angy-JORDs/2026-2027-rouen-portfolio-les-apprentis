# Frontend de @Feverine

- **Technologie** : React 19 + TypeScript + Vite, Tailwind CSS 4, React Router, TanStack Query, `react-force-graph-2d` (graphe).
- **Lancer** : Node.js LTS (`node -v`) et le backend lancé sur `http://localhost:8000`.
- **Routes de `API_ROUTES.md` consommées** : ce frontend montre le portfolio d'**un seul candidat**, fixé par configuration (pas de sélecteur dans l'interface).
  Copier `.env.example` en `.env` et renseigner `VITE_CANDIDAT_SLUG=<candidat_slug de data/candidats/<pseudo>.json>`.
