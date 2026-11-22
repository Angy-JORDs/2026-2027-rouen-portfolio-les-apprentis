# Déployer le portfolio sur Vercel (depuis ton PC)

Le site et l'API sont publiés comme **deux projets Vercel** depuis ton PC avec l'outil Vercel en ligne de
commande. Les données viennent de **tes propres bases cloud gratuites**, indépendantes de l'équipe.

```text
Visiteur ──► Site (Vercel, statique)  ──HTTPS──►  API FastAPI (Vercel, fonction Python, région fra1)
             frontends/frontend-JoelDIANGON              backend/  (READ_ONLY=true)
                                                           ├──► MongoDB Atlas M0 (utilisateur lecture seule)
                                                           └──► Neo4j Aura Free
```

> **Pourquoi pas le déploiement automatique depuis GitHub ?** Vercel gratuit (Hobby) refuse les dépôts
> privés appartenant à une organisation GitHub (https://vercel.com/docs/git#using-hobby-teams).
> Le déploiement depuis ton PC fonctionne sans rien changer au dépôt de l'équipe.

Toutes les commandes se lancent dans un terminal PowerShell de VS Code, **à la racine du dépôt**.

---

## Étape 1 — Créer tes bases cloud (une seule fois)

### MongoDB Atlas (gratuit)

1. Crée un compte sur https://www.mongodb.com/cloud/atlas/register, puis un cluster **M0 (Free)**.
   Fournisseur **AWS**, région **Frankfurt (eu-central-1)**, la plus proche de l'API (`fra1`).
2. **Database Access** (menu *Security*) → *Add New Database User*, crée **deux** utilisateurs
   (mot de passe long, généré) :

   | Utilisateur | Rôle (« Specific Privileges ») | Sert à |
   |---|---|---|
   | `portfolio_seed` | `readWrite` sur la base `portfolio` | remplir la base depuis ton PC |
   | `portfolio_api` | `read` sur la base `portfolio` | l'API en ligne : elle ne pourra **rien** modifier |

3. **Network Access** → *Add IP Address* → `0.0.0.0/0`. Vercel n'a pas d'adresse IP fixe, c'est
   obligatoire (https://www.mongodb.com/docs/atlas/reference/partner-integrations/vercel/). Atlas t'enverra
   un e-mail d'alerte : c'est normal, la sécurité repose alors sur les mots de passe.
4. **Connect** → *Drivers* : copie l'adresse `mongodb+srv://…`. Tu y mettras l'utilisateur voulu.

### Neo4j Aura (gratuit)

1. Crée un compte sur https://console.neo4j.io, puis une instance **AuraDB Free** (région Europe).
2. **Télécharge le fichier d'identifiants** proposé à la création : le mot de passe n'est affiché
   qu'une fois. Il contient `NEO4J_URI` (`neo4j+s://…`), `NEO4J_USERNAME` et `NEO4J_PASSWORD`.
3. Une instance Free se met en pause si elle reste inutilisée plusieurs jours : relance-la depuis la console si besoin.

---

## Étape 2 — Remplir tes bases cloud (à refaire après chaque modification de `data/`)

Le seed charge **tout** le dossier `data/` dans les deux bases (il vide puis recharge).

```powershell
$env:MONGO_URL      = "mongodb+srv://portfolio_seed:<MOT_DE_PASSE>@<cluster>.mongodb.net/"
$env:MONGO_DB       = "portfolio"
$env:NEO4J_URI      = "neo4j+s://<id>.databases.neo4j.io"
$env:NEO4J_USER     = "<NEO4J_USERNAME du fichier>"
$env:NEO4J_PASSWORD = "<NEO4J_PASSWORD du fichier>"
cd backend
uv run python -m portfolio_api.scripts.seed
cd ..
```

Ces variables ne valent que dans ce terminal. Ne les écris jamais dans un fichier versionné.
Résultat attendu : `[seed] MongoDB — OK`, `[seed] Neo4j — OK`, `[seed] OK`.

---

## Étape 3 — Installer l'outil Vercel et te connecter (une seule fois)

```powershell
npm install -g vercel
vercel login
```

Crée ton compte gratuit (plan **Hobby**) si besoin. Conseillé : sur le plan Hobby, Vercel peut utiliser
ton contenu pour entraîner des modèles d'IA, sauf si tu le désactives dans les réglages de ton compte
(Team Settings ; cf. §3 des conditions d'utilisation, https://vercel.com/legal/terms).

---

## Étape 4 — Déployer l'API

```powershell
vercel link --cwd backend
```

Réponds : créer un **nouveau** projet, nom `portfolio-joel-api`, code dans `./`. Vercel détecte FastAPI.
**Laisse « Root Directory » vide** dans les réglages du projet : le dossier est choisi par `--cwd`.

Puis, sur https://vercel.com → projet `portfolio-joel-api` → **Settings → Environment Variables**
(environnement **Production**) :

| Variable | Valeur |
|---|---|
| `MONGO_URL` | adresse Atlas avec l'utilisateur **`portfolio_api`** (lecture seule) |
| `MONGO_DB` | `portfolio` |
| `NEO4J_URI` | `neo4j+s://<id>.databases.neo4j.io` |
| `NEO4J_USER` | `NEO4J_USERNAME` du fichier Aura |
| `NEO4J_PASSWORD` | `NEO4J_PASSWORD` du fichier Aura |
| `READ_ONLY` | `true` (désactive la route DELETE) |
| `CORS_ORIGINS` | `https://example.invalid` pour l'instant (mis à jour à l'étape 6) |

```powershell
vercel deploy --prod --cwd backend
```

Note l'adresse affichée (ex. `https://portfolio-joel-api.vercel.app`) et vérifie dans ton navigateur :

- `…/api/health/db` → `{"status":"ok","mongo":"ok","neo4j":"ok"}`
- `…/api/candidats/joel-diangon` → ton profil

---

## Étape 5 — Déployer le site

```powershell
vercel link --cwd frontends/frontend-JoelDIANGON
vercel env add VITE_API_URL production --cwd frontends/frontend-JoelDIANGON
vercel deploy --prod --cwd frontends/frontend-JoelDIANGON
```

- `vercel link` : nouveau projet `portfolio-joel`, code dans `./`, Vercel détecte Vite.
- `vercel env add` : colle l'adresse de l'API **sans `/` final** (ex. `https://portfolio-joel-api.vercel.app`).

Note l'adresse du site (ex. `https://portfolio-joel.vercel.app`).

---

## Étape 6 — Autoriser le site à appeler l'API

Dans le projet `portfolio-joel-api` → **Environment Variables**, remplace `CORS_ORIGINS` par l'adresse
exacte du site (sans `/` final), puis redéploie l'API :

```powershell
vercel deploy --prod --cwd backend
```

Ouvre le site : la scène s'affiche, les sections se remplissent. C'est en ligne.

---

## Mettre à jour plus tard

| Ce qui change | Quoi faire |
|---|---|
| Tes données (`data/*.json`) | Étape 2 (seed vers tes bases cloud). Pas besoin de redéployer. |
| Le code du site | `vercel deploy --prod --cwd frontends/frontend-JoelDIANGON` |
| Le code de l'API | `vercel deploy --prod --cwd backend` |
| Une variable d'environnement | La modifier sur vercel.com **puis redéployer** le projet concerné |

## Dépannage

| Symptôme | Cause probable | Solution |
|---|---|---|
| `/api/health/db` → `503` | Identifiants faux, ou Atlas n'autorise pas `0.0.0.0/0`, ou instance Aura en pause | Vérifier les variables, Network Access, relancer l'instance Aura, redéployer l'API |
| Bandeau « API injoignable » sur le site | `VITE_API_URL` fausse ou absente au moment du build | Corriger la variable, redéployer le site |
| Erreur `CORS` dans la console du navigateur (F12) | `CORS_ORIGINS` ≠ adresse exacte du site | Corriger (sans `/` final), redéployer l'API |
| `404 Candidat non trouvé` | Base cloud vide ou pas à jour | Étape 2 |
| Première requête lente | Démarrage à froid de la fonction | Normal, les suivantes sont rapides |
| `DELETE` répond `403` | `READ_ONLY=true` | Voulu : l'API publique ne doit rien supprimer |

## Sécurité

- Ne versionne **jamais** de fichier `.env` : les identifiants vivent dans les variables Vercel. Les fichiers
  `.vercelignore` empêchent d'envoyer `.env`, `.venv` et `node_modules` à Vercel.
- L'API publique utilise un utilisateur MongoDB **en lecture seule** et `READ_ONLY=true`.
- `VITE_API_URL` est visible dans le site publié : elle ne doit contenir aucun secret (c'est une simple adresse).
