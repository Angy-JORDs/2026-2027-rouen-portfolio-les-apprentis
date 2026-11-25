# Portfolio Angy-JORDS — Frontend

Frontend React + TypeScript + Vite du portfolio d'Ange Tonlio.

## Architecture des connexions

Le navigateur communique uniquement avec l'API FastAPI. Il ne se connecte jamais directement à MongoDB ou Neo4j et ne contient aucun identifiant de base de données.

- FastAPI lit les paramètres `MONGO_URL`, `MONGO_DB`, `NEO4J_URI`, `NEO4J_USER` et `NEO4J_PASSWORD` dans le `.env` situé à la racine du dépôt.
- Le frontend lit seulement `VITE_API_BASE_URL` et `VITE_CANDIDAT_SLUG` dans son propre `.env`.
- L'API doit autoriser `http://localhost:5173` dans `CORS_ORIGINS`.

Créer le fichier `.env` du frontend à partir de `.env.example` :

```env
VITE_API_BASE_URL=http://localhost:8000
VITE_CANDIDAT_SLUG=ange-tonlio
```

## Démarrage

Terminal 1 — depuis `backend/` :

```bash
uv run uvicorn portfolio_api.main:app --reload --port 8000
```

Terminal 2 — depuis `frontends/frontend-Angy-JORDs/` :

```bash
npm install
npm run dev
```

API : `http://localhost:8000` · Documentation interactive : `http://localhost:8000/docs` · Frontend : `http://localhost:5173`.

## Routes GET consommées

| Route | Utilisation dans le portfolio |
|---|---|
| `GET /api/health` | Santé de l'API |
| `GET /api/health/db` | État des connexions MongoDB et Neo4j |
| `GET /api/candidats` | Liste paginée des candidats (service disponible) |
| `GET /api/candidats/{slug}` | Profil, expériences, formations et compétences |
| `GET /api/candidats/{slug}/projets` | Projets du candidat et filtre compétence |
| `GET /api/candidats/{slug}/stats` | Nombre de projets associés à chaque compétence |
| `GET /api/projets` | Galerie paginée et filtre compétence |
| `GET /api/projets/{slug}` | Détail d'un projet |
| `GET /api/graph/competences/{slug}` | Graphe Neo4j profil → projets → compétences |
| `GET /api/graph/projets/{slug}/similaires` | Projets similaires d'après les compétences communes |
| `GET /api/competences/{slug}/candidats` | Candidats maîtrisant la compétence (Neo4j) |
| `GET /api/competences/{slug}/projets` | Projets associés à la compétence (Neo4j + MongoDB) |

La route `DELETE /api/projets/{slug}` n'est volontairement pas appelée par le portfolio public : elle est destructive et relève d'une interface d'administration protégée.

## Section Compétences

1. Le graphe est construit à partir de la réponse R5 de Neo4j, pas d'un graphe artificiel.
2. La liste présente toutes les compétences renvoyées par le profil, avec domaine, niveau et nombre de projets.
3. Le clic sur une compétence interroge R6 et R7 et affiche les candidats et projets liés.
4. Les expériences sont liées à partir des `competences` déclarées dans le profil candidat. Une association absente des données n'est pas inventée.

Les champs de présentation détaillés qui ne figurent pas dans les schémas API (par exemple la problématique ou la méthodologie d'un projet) sont complétés depuis les données locales existantes, lorsque disponibles. Les champs et relations provenant de l'API restent prioritaires.
