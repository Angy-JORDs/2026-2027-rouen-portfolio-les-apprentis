# Frontend de @JoelDIANGON — « Mon parcours »

Portfolio personnel immersif : un jeune garçon, vu de dos, fait face aux éléments flottants de son parcours
(formation, expériences, compétences, projets, engagement associatif, langues, contact).
Chaque élément s'ouvre au clic. Toutes les données viennent de l'**API d'équipe**.

- **Technologie** : React 19 + Vite 8, Framer Motion (animations et transitions), d3-force (mise en page du
  graphe de compétences), scène en SVG et CSS (pas de 3D : plus léger et plus net).
- **Lancer** : voir ci-dessous (Node.js ≥ 20.19 requis).
- **Routes de `API_ROUTES.md` consommées** : R1, R2, R3, R4, R5, R8 (détail par écran ci-dessous).

## Lancer

1. **L'API d'équipe**, à la racine du dépôt :

   ```bash
   just up      # MongoDB + Neo4j
   just seed    # charge data/
   just dev     # API sur http://localhost:8000
   ```

2. **Ce frontend**, dans un second terminal :

   ```bash
   cd frontends/frontend-JoelDIANGON
   npm install
   npm run dev          # http://localhost:5173
   ```

   Version de production : `npm run build` puis `npm run preview` (même adresse).

Le port **5173** est déjà autorisé dans `CORS_ORIGINS` de l'API (`.env.example` à la racine).
Pour viser une autre API ou un autre candidat, copier `.env.example` en `.env` dans ce dossier et modifier
`VITE_API_URL` / `VITE_CANDIDAT_SLUG`.

**Mise en ligne** : le site et l'API se déploient sur Vercel depuis ton PC, avec tes propres bases cloud —
voir **[DEPLOIEMENT.md](./DEPLOIEMENT.md)**.

## Écrans et routes consommées

| Écran (URL) | Ce qui est affiché | Route(s) de `API_ROUTES.md` | Base |
|---|---|---|---|
| Scène d'accueil (`#/`) | Nom, titre, 7 éléments du parcours | R1 `GET /api/candidats/{slug}` | MongoDB |
| Mon parcours (`#/parcours`) | Profil + chronologie complète | R1 (champ `timeline`) | MongoDB |
| Formation (`#/formation`) | Diplômes (+ certifications*) | R1 (`formations`) | MongoDB |
| Expériences (`#/experiences`) | Expériences professionnelles | R1 (`experiences`) | MongoDB |
| Associatif (`#/associatif`) | Engagement associatif | R1 (`experiences`) | MongoDB |
| Projets (`#/projets`, `#/projets?competence=python`) | Galerie filtrable par compétence | R2 `GET /api/candidats/{slug}/projets?competence=` | MongoDB |
| Fiche projet (`#/projets/{slug}`) | Description, métriques, compétences, lien GitHub | R8 `GET /api/projets/{slug}` | MongoDB |
| Fiche projet — similaires | Projets partageant des compétences | R4 `GET /api/graph/projets/{slug}/similaires` | Neo4j |
| Compétences (`#/competences`) | Graphe interactif candidat → projets → compétences | R5 `GET /api/graph/competences/{slug}` | Neo4j |
| Compétences — classement | Compétences les plus mobilisées | R3 `GET /api/candidats/{slug}/stats` (agrégation) | MongoDB |
| Langues (`#/langues`), Contact (`#/contact`) | Langues*, liens GitHub et LinkedIn | R1 (`liens`) | MongoDB |

Chaque écran indique discrètement sa source (route et base), utile en démonstration.

**Portfolio personnel** : seul le candidat `joel-diangon` est affiché. Les routes qui listent d'autres
candidats (`GET /api/candidats`, R6) ne sont pas utilisées, et les projets similaires (R4) sont limités à
mes propres projets.

\* Les **langues** et **certifications** sont dans `data/candidats/JoelDIANGON.json`, mais le modèle
`CandidatOut` de l'API ne les renvoie pas encore : elles sont lues depuis `src/content/static.js`. Le code
lit d'abord l'API (`candidat.langues`, `candidat.certifications`) : si l'équipe ajoute ces champs au
contrat, il n'y a rien à recoder.

## Interactions

- **Survol** d'un élément : halo, nom de la section, fil lumineux depuis le garçon, qui tourne la tête vers lui.
- **Clic** : la scène plonge vers l'élément et le panneau de la section s'ouvre.
- **Retour** : bouton « Retour à la scène », croix, clic hors du panneau, touche Échap ou bouton Retour du navigateur.
- **Navigation alternative** : liste discrète en haut à droite (menu sur tablette et mobile).
- **Graphe** : survol d'un nœud = ses liens s'éclairent ; clic sur une compétence = projets filtrés ;
  clic sur un projet = sa fiche.
- **Accessibilité** : navigation au clavier, `prefers-reduced-motion` respecté.
- **Responsive** : ordinateur (scène en arc), tablette, mobile (scène simplifiée en grille, panneaux plein écran).

## Structure

```text
src/
├── api/client.js            # une fonction par route de API_ROUTES.md
├── config.js                # VITE_API_URL, VITE_CANDIDAT_SLUG
├── context/CandidatContext  # profil (R1) chargé une fois, partagé
├── hooks/                   # useAsync (cache), useHashRoute (URL), useMediaQuery
├── content/
│   ├── sections.js          # les 7 éléments de la scène (position, icône, libellé)
│   └── static.js            # langues, certifications, classement associatif
├── components/
│   ├── scene/               # Scene, Boy (SVG), Backdrop (décor, arc du parcours), SceneObject
│   ├── ui/                  # Panel, Nav, Tags, États (chargement, erreur, source)
│   ├── Timeline.jsx
│   └── icons.jsx
├── sections/                # une section par élément + ProjetDetail + SkillGraph
└── styles/                  # global, scene, panel, sections
```

**Ajouter une donnée** (projet, expérience, compétence) : modifier `data/*/JoelDIANGON.json` à la racine,
puis `just seed`. Le frontend l'affiche sans aucune modification de code.
