# Frontend de @JoelDIANGON : « Mon parcours » / « My journey »

Portfolio personnel immersif, **en français et en anglais**. Un jeune homme, vu de dos au bout d'une salle de serveurs,
fait face aux éléments de son parcours (formation, expériences, compétences, projets, associatif, langues, contact).
Chaque élément s'ouvre au clic. Toutes les données viennent de l'**API d'équipe**.

- **En ligne** : https://portfolio-joel-five.vercel.app (version anglaise directe : https://portfolio-joel-five.vercel.app/?lang=en)
- **API utilisée en ligne** : https://portfolio-api-joel.vercel.app (Swagger : `/docs`)
- **Technologie** : React 19 + Vite 8, Framer Motion (animations), d3-force (graphe de compétences), React Icons,
  scène en CSS et SVG.
- **Routes de `API_ROUTES.md` consommées** : R1, R2, R3, R4, R5, R8 (détail par écran ci-dessous).

## Lancer

1. **L'API d'équipe**, à la racine du dépôt :

   ```bash
   just up      # MongoDB + Neo4j (Docker)
   just seed    # charge data/
   just dev     # API sur http://localhost:8000
   ```

2. **Ce frontend**, dans un second terminal (Node.js ≥ 20.19) :

   ```bash
   cd frontends/frontend-JoelDIANGON
   npm install
   npm run dev          # http://localhost:5173
   ```

   Version de production : `npm run build` puis `npm run preview`.

Le port **5173** est déjà autorisé dans `CORS_ORIGINS` de l'API (`.env.example` à la racine).
Pour viser une autre API, copier `.env.example` en `.env` dans ce dossier et modifier `VITE_API_URL`.
Mise en ligne (Vercel) : voir **[DEPLOIEMENT.md](./DEPLOIEMENT.md)**.

## Écrans et routes consommées

| Écran (URL) | Ce qui est affiché | Route(s) de `API_ROUTES.md` | Base |
|---|---|---|---|
| Scène d'accueil (`#/`) | Nom, titre, e-mail, 7 éléments du parcours, questions fréquentes | R1 `GET /api/candidats/{slug}` (+ R2 pour la FAQ) | MongoDB |
| Parcours complet (`#/portfolio`) | Version classique qui défile : portrait, profil, expériences, formation, projets, compétences, engagement, langues, contact | R1 + R2 | MongoDB |
| Formation (`#/formation`) | Diplômes et certifications* | R1 (`formations`) | MongoDB |
| Expériences (`#/experiences`) | Expériences professionnelles et chiffres clés | R1 (`experiences`) | MongoDB |
| Associatif (`#/associatif`) | Engagement associatif et sportif | R1 (`experiences`) | MongoDB |
| Projets (`#/projets`, `#/projets?competence=python`) | Galerie filtrable par compétence | R2 `GET /api/candidats/{slug}/projets?competence=` | MongoDB |
| Fiche projet (`#/projets/{slug}`) | Description, indicateurs, compétences, lien GitHub | R8 `GET /api/projets/{slug}` | MongoDB |
| Fiche projet, similaires | Mes autres projets partageant des compétences | R4 `GET /api/graph/projets/{slug}/similaires` | Neo4j |
| Compétences (`#/competences`) | Graphe interactif candidat → projets → compétences | R5 `GET /api/graph/competences/{slug}` | Neo4j |
| Compétences, classement | Compétences les plus mobilisées | R3 `GET /api/candidats/{slug}/stats` (agrégation) | MongoDB |
| Langues (`#/langues`), Contact (`#/contact`) | Langues*, e-mail, LinkedIn, GitHub, CV | R1 (`liens`) | MongoDB |

**Portfolio personnel** : seul le candidat `joel-diangon` est affiché. Les routes qui listent d'autres candidats
(`GET /api/candidats`, R6) ne sont pas utilisées, et R4 ne renvoie que les projets du même candidat.

\* Les **langues** et **certifications** sont dans `data/candidats/JoelDIANGON.json`, mais le modèle `CandidatOut` de
l'API ne les renvoie pas encore : elles sont lues depuis `src/content/static.js`.

## Fonctionnalités

- **Français / anglais** : bouton FR | EN en haut à droite (choix mémorisé ; `?lang=en` dans l'adresse ouvre
  directement la version anglaise). Les textes d'interface sont dans chaque composant ; les traductions des données
  (profil, expériences, projets…) sont dans `src/i18n/content.js`, à mettre à jour si le français change dans `data/`.
- **Questions fréquentes** : environ 30 questions de recruteur par thème (expérience, compétences, projets, contact…),
  réponses calculées à partir des données de l'API (`src/lib/qa.js`), sans saisie libre.
- **CV** : lecteur intégré avec téléchargement, dès que `public/cv-joel-diangon.pdf` existe.
- **Version texte pour les robots** (ChatGPT, LinkedIn, moteurs de recherche) : au build, `seo-prerender.js` écrit tout
  le portfolio en HTML (français + anglais) dans la page, avec une fiche schema.org et une image d'aperçu.
- **Accessibilité et responsive** : navigation au clavier, `prefers-reduced-motion` respecté, ordinateur, tablette
  et mobile.

## Structure

```text
src/
├── api/client.js            # une fonction par route de API_ROUTES.md
├── config.js                # VITE_API_URL, VITE_CANDIDAT_SLUG
├── context/CandidatContext  # profil (R1) chargé une fois, servi dans la langue choisie
├── i18n/                    # langue du site (LangContext) et traductions des données (content.js)
├── hooks/                   # useAsync (cache), useHashRoute (URL), useMediaQuery
├── content/                 # sections de la scène, langues/certifications, classement associatif
├── components/              # scène, navigation, panneaux, FAQ, lecteur de CV, icônes
├── sections/                # un panneau par section + ProjetDetail + SkillGraph
├── pages/ClassicPortfolio   # version classique qui défile (#/portfolio)
└── styles/
```

**Ajouter une donnée** (projet, expérience, compétence) : modifier `data/*/JoelDIANGON.json` à la racine, puis
`just seed`, et ajouter sa traduction dans `src/i18n/content.js`.

**Crédits** : image de fond « salle de serveurs » de Vlad_Aivazovsky sur Pixabay
(https://pixabay.com/illustrations/computer-server-room-pc-technology-8281618/), Pixabay Content License (usage libre),
retouchée (enseigne « DATA » sur le mur du fond).
