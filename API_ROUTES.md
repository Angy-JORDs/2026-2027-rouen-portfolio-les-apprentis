# 📜 API_ROUTES - Contrat d'interface de l'équipe

> Le contrat entre le backend d'équipe et **chaque** frontend. Les exemples de réponse ci-dessous sont **illustratifs**
> (jeu d'exemple `alice-martin`), avec exactement les structures des modèles Pydantic de `backend/src/portfolio_api/models/schemas.py`.
> Il va de pair avec [`ARCHITECTURE.md`](ARCHITECTURE.md) (§2 : requêtes R1 à R8, §3.4 et §4.2 : requêtes exactes, §7 : organisation du code, §8 : déploiement).
> Après la soutenance, toute modification passe par une Pull Request relue par l'équipe.

**API déployée** : https://portfolio-api-joel.vercel.app · Swagger : https://portfolio-api-joel.vercel.app/docs · ReDoc : https://portfolio-api-joel.vercel.app/redoc
(Vercel, projet `portfolio-api` ; bases MongoDB Atlas + Neo4j Aura ; `READ_ONLY=true`, donc `DELETE` répond 403.)
En local : `http://localhost:8000` · Swagger : `http://localhost:8000/docs`

**Valeurs réelles pour tester l'API déployée** : candidat `joel-diangon` ; projets `prediction-prix-maison`, `analyse-notes-films-fandango` ; compétence `python`.
Exemples : [`/api/candidats/joel-diangon`](https://portfolio-api-joel.vercel.app/api/candidats/joel-diangon) ·
[`/api/candidats/joel-diangon/stats`](https://portfolio-api-joel.vercel.app/api/candidats/joel-diangon/stats) ·
[`/api/graph/projets/prediction-prix-maison/similaires`](https://portfolio-api-joel.vercel.app/api/graph/projets/prediction-prix-maison/similaires) ·
[`/api/competences/python/candidats`](https://portfolio-api-joel.vercel.app/api/competences/python/candidats)

## Conventions

- Identifiants publics = **slugs** (`alice-martin`, `smartcity-explorer`, `mongodb`), jamais d'`ObjectId` exposé. Les slugs sont en minuscules.
- Erreurs : `404 {"detail": "Candidat non trouvé"}` (ou `"Projet non trouvé"`, `"Compétence non trouvée"`) si la ressource n'existe pas ;
  `422` si un paramètre est invalide (ex. `page=0`) ;
  `503 {"detail": "Base de données indisponible (just up ? identifiants du .env ?)"}` si MongoDB ou Neo4j ne répond pas ;
  `500 {"detail": "Internal server error"}` pour toute autre erreur.
- Pagination (listes MongoDB) : `?page=1&size=20` (`page` ≥ 1, `size` entre 1 et 100) → `{"items": [...], "total": 42, "page": 1, "size": 20}`.
- Les routes de graphe (Neo4j) ne sont pas paginées ; R4 accepte `?limit=`.
- Les valeurs absentes sont `null` (ou `[]` / `{}` pour les listes et objets). Les dates sont au format `AAAA-MM`.
- CORS : les URLs des frontends doivent figurer dans `CORS_ORIGINS` (en local : fichier `.env` ; API déployée : Vercel → projet
  `portfolio-api` → Settings → Environment Variables, valeur actuelle `https://portfolio-joel-five.vercel.app`). Ajouter l'URL de
  chaque portfolio déployé (séparées par des virgules), puis redéployer l'API.

| # | Route | Base(s) | Service |
|---|---|---|---|
| R1 | `GET /api/candidats/{slug}` | MongoDB | `CandidatService` |
| R2 | `GET /api/candidats/{slug}/projets` | MongoDB | `CandidatService` |
| R3 | `GET /api/candidats/{slug}/stats` | MongoDB | `CandidatService` |
| R4 | `GET /api/graph/projets/{slug}/similaires` | Neo4j | `GraphService` |
| R5 | `GET /api/graph/competences/{slug}` | Neo4j | `GraphService` |
| R6 | `GET /api/competences/{slug}/candidats` | Neo4j | `GraphService` |
| R7 | `GET /api/competences/{slug}/projets` | Neo4j + MongoDB | `GraphService` |
| R8 | `GET /api/projets/{slug}` | MongoDB | `ProjetService` |

## Vérifier la connexion aux bases : routes et requêtes exécutées

1. Connexion : https://portfolio-api-joel.vercel.app/api/health/db → `{"status": "ok", "mongo": "ok", "neo4j": "ok"}`
   (MongoDB : commande `ping` ; Neo4j : `verify_connectivity()`, qui vérifie aussi l'authentification).
2. Chaque route ci-dessous exécute la requête indiquée (code : `backend/src/portfolio_api/repositories/`). Elles sont testables
   depuis Swagger (https://portfolio-api-joel.vercel.app/docs), et les requêtes sont exécutables telles quelles dans mongosh / Compass
   ou Neo4j Browser (Cypher complet : `ARCHITECTURE.md` §4.2).

| Route | Base | Requête exécutée |
|---|---|---|
| `GET /api/health/db` | les deux | `db.command("ping")` + `driver.verify_connectivity()` |
| `GET /api/candidats` | MongoDB | `candidats.countDocuments({})` + `candidats.find({}).sort({nom: 1, prenom: 1}).skip((page-1)*size).limit(size)` |
| R1 `GET /api/candidats/{slug}` | MongoDB | `candidats.findOne({candidat_slug: slug})` (timeline calculée par l'API) |
| R2 `GET /api/candidats/{slug}/projets` | MongoDB | `projets.countDocuments(q)` + `projets.find(q).sort({titre: 1}).skip(…).limit(size)`, avec `q = {candidat_slugs: slug}` (+ `competences: competence` si `?competence=`) |
| R3 `GET /api/candidats/{slug}/stats` | MongoDB | `projets.aggregate([{$match: {candidat_slugs: slug}}, {$unwind: "$competences"}, {$group: {_id: "$competences", nombre_projets: {$sum: 1}}}, {$sort: {nombre_projets: -1, _id: 1}}, {$project: {_id: 0, skill_slug: "$_id", nombre_projets: 1}}])` |
| R4 `GET /api/graph/projets/{slug}/similaires` | Neo4j | `MATCH (p:Projet {projet_slug: $slug})-[:UTILISE]->(s:Competence)<-[:UTILISE]-(autre:Projet) WHERE autre.projet_slug <> $slug RETURN … count(s) AS competences_communes … ORDER BY competences_communes DESC, titre ASC LIMIT $limit` |
| R5 `GET /api/graph/competences/{slug}` | Neo4j | `MATCH (c:Candidat {candidat_slug: $slug}) OPTIONAL MATCH (c)-[:REALISE]->(p:Projet) OPTIONAL MATCH (p)-[:UTILISE]->(s:Competence) RETURN …` |
| R6 `GET /api/competences/{slug}/candidats` | Neo4j | `MATCH (c:Candidat)-[:REALISE]->(p:Projet)-[:UTILISE]->(:Competence {skill_slug: $slug}) RETURN … count(DISTINCT p) AS nb_projets` |
| R7 `GET /api/competences/{slug}/projets` | Neo4j + MongoDB | `MATCH (p:Projet)-[:UTILISE]->(:Competence {skill_slug: $slug}) RETURN p.projet_slug ORDER BY p.titre`, puis `projets.find({projet_slug: {$in: slugs}})` |
| R8 `GET /api/projets/{slug}` | MongoDB | `projets.findOne({projet_slug: slug})` |
| `GET /api/projets` (galerie) | MongoDB | `projets.find(q).sort({titre: 1})` paginé, `q = {competences: competence}` si `?competence=` |
| `DELETE /api/projets/{slug}` | les deux | `projets.deleteOne({projet_slug: slug})` + `MATCH (p:Projet {projet_slug: $slug}) DETACH DELETE p` (403 sur l'API déployée, `READ_ONLY=true`) |

## `GET /api/health`

Fourni. Réponse : `{"status": "ok"}` (ne contacte pas les bases).

## `GET /api/health/db` : vérification des connexions aux bases

- **Paramètres** : aucun.
- **Usage** : vérifier que les identifiants du `.env` sont bons (MongoDB : ping ; Neo4j : connexion + authentification).
- `200` si les deux bases répondent, `503` sinon. Une base en erreur indique seulement le type d'exception (jamais l'URL ni le mot de passe).

```json
{"status": "ok", "mongo": "ok", "neo4j": "ok"}
```

```json
{"status": "degraded", "mongo": "ok", "neo4j": "erreur : ServiceUnavailable"}
```

## 1. `GET /api/candidats/{slug}` : profil et timeline (R1)

- **Paramètres** : `slug` (chemin) = `candidat_slug`.
- **Écran qui l'utilise** : Profil & Parcours (en-tête, liens, timeline, compétences).
- `timeline` fusionne expériences et formations, de la plus récente à la plus ancienne (tri sur `debut`) ; `type` vaut `experience` ou `formation`.
- **Erreur** : `404` si le candidat n'existe pas.

```json
{
  "candidat_slug": "alice-martin",
  "prenom": "Alice",
  "nom": "Martin",
  "titre": "Élève-ingénieure Big Data — ESIGELEC",
  "bio": "Passionnée par les architectures de données et le graphe.",
  "liens": {
    "github": "https://github.com/alice-martin",
    "linkedin": "https://www.linkedin.com/in/alice-martin"
  },
  "experiences": [
    {
      "entreprise": "Entreprise X",
      "poste": "Stagiaire Data Engineer",
      "debut": "2026-04",
      "fin": "2026-08",
      "description": "Pipeline d'ingestion de données.",
      "competences": [
        "python",
        "mongodb",
        "airflow"
      ]
    }
  ],
  "formations": [
    {
      "ecole": "ESIGELEC",
      "diplome": "Cycle ingénieur — Big Data (BDTN)",
      "debut": "2024-09",
      "fin": "2027-06"
    }
  ],
  "competences": [
    {
      "skill_slug": "python",
      "nom": "Python",
      "domaine": "langages",
      "niveau": 4
    },
    {
      "skill_slug": "mongodb",
      "nom": "MongoDB",
      "domaine": "bases-de-donnees",
      "niveau": 3
    },
    {
      "skill_slug": "neo4j",
      "nom": "Neo4j",
      "domaine": "bases-de-donnees",
      "niveau": 3
    }
  ],
  "timeline": [
    {
      "type": "experience",
      "titre": "Stagiaire Data Engineer",
      "organisation": "Entreprise X",
      "debut": "2026-04",
      "fin": "2026-08",
      "description": "Pipeline d'ingestion de données."
    },
    {
      "type": "formation",
      "titre": "Cycle ingénieur — Big Data (BDTN)",
      "organisation": "ESIGELEC",
      "debut": "2024-09",
      "fin": "2027-06",
      "description": null
    }
  ]
}
```

## 2. `GET /api/candidats/{slug}/projets` : projets d'un candidat (R2)

- **Paramètres** : `slug` (chemin) ; `competence` (optionnel, un `skill_slug`, ex. `mongodb`) ; `page` (défaut 1) ; `size` (défaut 20, max 100).
- **Écran** : Galerie des projets d'un candidat (avec filtre par compétence). Exemple raccourci à un projet.
- **Erreur** : `404` si le candidat n'existe pas.

```json
{
  "items": [
    {
      "projet_slug": "smartcity-explorer",
      "candidat_slugs": [
        "alice-martin",
        "bob-durand"
      ],
      "titre": "SmartCity Explorer",
      "contexte": "TP fil rouge NoSQL — ESIGELEC",
      "description": "API FastAPI polyglotte MongoDB + Neo4j.",
      "date_debut": null,
      "date_fin": null,
      "competences": [
        "python",
        "mongodb",
        "neo4j",
        "fastapi"
      ],
      "metriques": {
        "tests_verts": 58,
        "score_ci": "200/200"
      },
      "liens": {
        "github": "https://github.com/alice-martin/smartcity"
      },
      "images": []
    }
  ],
  "total": 1,
  "page": 1,
  "size": 20
}
```

## 3. `GET /api/candidats/{slug}/stats` : statistiques par compétence (R3, agrégation MongoDB)

- **Paramètres** : `slug` (chemin).
- **Écran** : Profil & Parcours (graphique « compétences les plus utilisées »).
- `nombre_projets` = nombre de projets du candidat utilisant la compétence, trié par ordre décroissant. `nom`, `domaine` et `niveau` viennent des compétences déclarées par le candidat (`niveau` = `null` et `nom` = slug si la compétence n'est pas déclarée).
- **Erreur** : `404` si le candidat n'existe pas.

```json
{
  "candidat_slug": "alice-martin",
  "total_projets": 2,
  "competences": [
    {
      "skill_slug": "python",
      "nom": "Python",
      "domaine": "langages",
      "niveau": 4,
      "nombre_projets": 2
    },
    {
      "skill_slug": "mongodb",
      "nom": "MongoDB",
      "domaine": "bases-de-donnees",
      "niveau": 3,
      "nombre_projets": 2
    },
    {
      "skill_slug": "neo4j",
      "nom": "Neo4j",
      "domaine": "bases-de-donnees",
      "niveau": 3,
      "nombre_projets": 2
    },
    {
      "skill_slug": "fastapi",
      "nom": "fastapi",
      "domaine": null,
      "niveau": null,
      "nombre_projets": 1
    }
  ]
}
```

## 4. `GET /api/graph/projets/{slug}/similaires` : projets similaires (R4, Neo4j)

- **Paramètres** : `slug` (chemin) = `projet_slug` ; `limit` (défaut 5, entre 1 et 50).
- **Écran** : Détail d'un projet (bloc « projets similaires »).
- Trié par `competences_communes` décroissant ; `competences` liste les compétences partagées.
- **Erreur** : `404` si le projet n'existe pas.

```json
{
  "projet_slug": "smartcity-explorer",
  "similaires": [
    {
      "projet_slug": "portfolio-polyglotte",
      "titre": "Portfolio Polyglotte",
      "competences_communes": 3,
      "competences": [
        "python",
        "mongodb",
        "neo4j"
      ]
    }
  ]
}
```

## 5. `GET /api/graph/competences/{slug}` : graphe de compétences prêt à afficher (R5, Neo4j)

- **Paramètres** : `slug` (chemin) = `candidat_slug` (le graphe Candidat → Projets → Compétences de ce candidat).
- **Écran** : Graphe de compétences (d3, vis-network, react-force-graph, streamlit-agraph…).
- `id` des nœuds est préfixé par le type (`candidat:`, `projet:`, `competence:`) et unique ; `source` / `target` des liens référencent ces `id`. `links[].type` vaut `REALISE` (candidat → projet) ou `UTILISE` (projet → compétence).
- **Erreur** : `404` si le candidat n'existe pas. Un candidat sans projet renvoie un graphe avec un seul nœud et `links: []`.

```json
{
  "nodes": [
    {
      "id": "candidat:alice-martin",
      "type": "candidat",
      "slug": "alice-martin",
      "label": "Alice Martin"
    },
    {
      "id": "projet:smartcity-explorer",
      "type": "projet",
      "slug": "smartcity-explorer",
      "label": "SmartCity Explorer"
    },
    {
      "id": "competence:python",
      "type": "competence",
      "slug": "python",
      "label": "Python"
    },
    {
      "id": "competence:mongodb",
      "type": "competence",
      "slug": "mongodb",
      "label": "MongoDB"
    },
    {
      "id": "projet:portfolio-polyglotte",
      "type": "projet",
      "slug": "portfolio-polyglotte",
      "label": "Portfolio Polyglotte"
    }
  ],
  "links": [
    {
      "source": "candidat:alice-martin",
      "target": "projet:smartcity-explorer",
      "type": "REALISE"
    },
    {
      "source": "projet:smartcity-explorer",
      "target": "competence:python",
      "type": "UTILISE"
    },
    {
      "source": "projet:smartcity-explorer",
      "target": "competence:mongodb",
      "type": "UTILISE"
    },
    {
      "source": "candidat:alice-martin",
      "target": "projet:portfolio-polyglotte",
      "type": "REALISE"
    },
    {
      "source": "projet:portfolio-polyglotte",
      "target": "competence:python",
      "type": "UTILISE"
    }
  ]
}
```

## 6. `GET /api/competences/{slug}/candidats` : candidats possédant une compétence (R6, Neo4j)

- **Paramètres** : `slug` (chemin) = `skill_slug`.
- **Écran** : Page d'une compétence (qui la maîtrise ?).
- Un candidat « possède » la compétence s'il a réalisé au moins un projet qui l'utilise ; `nb_projets` les compte. Trié par `nb_projets` décroissant.
- **Erreur** : `404` si la compétence n'existe pas.

```json
{
  "skill_slug": "mongodb",
  "nom": "MongoDB",
  "candidats": [
    {
      "candidat_slug": "alice-martin",
      "prenom": "Alice",
      "nom": "Martin",
      "nb_projets": 2
    },
    {
      "candidat_slug": "bob-durand",
      "prenom": "Bob",
      "nom": "Durand",
      "nb_projets": 1
    }
  ]
}
```

## 7. `GET /api/competences/{slug}/projets` : projets utilisant une technologie (R7, Neo4j + MongoDB)

- **Paramètres** : `slug` (chemin) = `skill_slug`.
- **Écran** : Page d'une compétence (projets associés) ; chaque projet a le même format que dans la galerie.
- Neo4j fournit la liste des projets, MongoDB leurs détails complets (exemple raccourci à un projet).
- **Erreur** : `404` si la compétence n'existe pas.

```json
{
  "skill_slug": "mongodb",
  "nom": "MongoDB",
  "projets": [
    {
      "projet_slug": "smartcity-explorer",
      "candidat_slugs": [
        "alice-martin",
        "bob-durand"
      ],
      "titre": "SmartCity Explorer",
      "contexte": "TP fil rouge NoSQL — ESIGELEC",
      "description": "API FastAPI polyglotte MongoDB + Neo4j.",
      "date_debut": null,
      "date_fin": null,
      "competences": [
        "python",
        "mongodb",
        "neo4j",
        "fastapi"
      ],
      "metriques": {
        "tests_verts": 58,
        "score_ci": "200/200"
      },
      "liens": {
        "github": "https://github.com/alice-martin/smartcity"
      },
      "images": []
    }
  ]
}
```

## 8. `GET /api/projets/{slug}` : fiche détaillée d'un projet (R8, MongoDB)

- **Paramètres** : `slug` (chemin) = `projet_slug`.
- **Écran** : Détail d'un projet (description, contexte, métriques, liens, images, compétences utilisées). Les blocs « projets similaires » (R4) et « équipe » s'ajoutent avec `candidat_slugs`, qui référence les candidats (`GET /api/candidats/{slug}`).
- Même format que les éléments de la galerie (`GET /api/projets`) ; `metriques` est un objet libre propre à chaque projet.
- **Erreur** : `404 {"detail": "Projet non trouvé"}` si le projet n'existe pas.

```json
{
  "projet_slug": "smartcity-explorer",
  "candidat_slugs": [
    "alice-martin",
    "bob-durand"
  ],
  "titre": "SmartCity Explorer",
  "contexte": "TP fil rouge NoSQL — ESIGELEC",
  "description": "API FastAPI polyglotte MongoDB + Neo4j.",
  "date_debut": null,
  "date_fin": null,
  "competences": [
    "python",
    "mongodb",
    "neo4j",
    "fastapi"
  ],
  "metriques": {
    "tests_verts": 58,
    "score_ci": "200/200"
  },
  "liens": {
    "github": "https://github.com/alice-martin/smartcity"
  },
  "images": []
}
```

## Routes supplémentaires

### `GET /api/candidats` : liste des candidats

- **Paramètres** : `page` (défaut 1), `size` (défaut 20, max 100).
- **Écran** : Page d'accueil / annuaire des candidats. Trié par nom puis prénom.

```json
{
  "items": [
    {
      "candidat_slug": "alice-martin",
      "prenom": "Alice",
      "nom": "Martin",
      "titre": "Élève-ingénieure Big Data — ESIGELEC"
    }
  ],
  "total": 4,
  "page": 1,
  "size": 2
}
```

### `GET /api/projets` : galerie de tous les projets

- **Paramètres** : `competence` (optionnel, un `skill_slug`) ; `page` ; `size`.
- **Écran** : Galerie des projets (exemple raccourci à un projet). Trié par titre.

```json
{
  "items": [
    {
      "projet_slug": "smartcity-explorer",
      "candidat_slugs": [
        "alice-martin",
        "bob-durand"
      ],
      "titre": "SmartCity Explorer",
      "contexte": "TP fil rouge NoSQL — ESIGELEC",
      "description": "API FastAPI polyglotte MongoDB + Neo4j.",
      "date_debut": null,
      "date_fin": null,
      "competences": [
        "python",
        "mongodb",
        "neo4j",
        "fastapi"
      ],
      "metriques": {
        "tests_verts": 58,
        "score_ci": "200/200"
      },
      "liens": {
        "github": "https://github.com/alice-martin/smartcity"
      },
      "images": []
    }
  ],
  "total": 1,
  "page": 1,
  "size": 20
}
```

### `DELETE /api/projets/{slug}` : suppression d'un projet

- **Paramètres** : `slug` (chemin) = `projet_slug`.
- Supprime le projet dans MongoDB **et** dans Neo4j (nœud et relations). Réponse : `204` sans corps.
- Rejouable : si le projet n'existe plus que dans l'une des deux bases, il est supprimé de celle-ci. `404` seulement s'il n'existe dans aucune.
- Aucune authentification n'est exigée.
- **API déployée publiquement** : avec la variable d'environnement `READ_ONLY=true`, la route répond
  `403 {"detail": "API en lecture seule : la suppression est désactivée"}` et ne modifie aucune base.
  Par défaut (`READ_ONLY` absente ou `false`), le comportement ci-dessus est inchangé.
