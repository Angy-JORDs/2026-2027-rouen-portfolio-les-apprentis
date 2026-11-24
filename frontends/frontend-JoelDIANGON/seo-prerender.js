/**
 * Version texte du portfolio, écrite dans index.html au moment du build (plugin Vite).
 *
 * Le site est une application React : sans JavaScript, la page est vide. Les robots qui ne l'exécutent pas
 * (ChatGPT, aperçus de lien LinkedIn, certains moteurs) ne voyaient que le titre. Ce plugin insère donc dans
 * <div id="root"> tout le contenu en HTML simple, plus une fiche schema.org « Person » et les balises d'aperçu
 * (Open Graph). React remplace ce contenu dès qu'il démarre : les visiteurs voient la scène immersive.
 *
 * Données : l'API (VITE_API_URL), comme le site ; à défaut les fichiers data/ du dépôt ; à défaut rien
 * (le build ne casse jamais, un avertissement est affiché).
 */
import { readFileSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { loadEnv } from 'vite'
import { CERTIFICATIONS, LANGUES, isAssociatif } from './src/content/static.js'
import { formatPeriod, humanizeKey, sortByDateDesc } from './src/lib/format.js'

const SITE_URL_DEFAUT = 'https://portfolio-joel-five.vercel.app'

const DOMAINES = {
  langages: 'Langages',
  bi: 'BI & data visualisation',
  'data-ia': 'Data & IA',
  'data-engineering': 'Data engineering',
  frameworks: 'Bibliothèques & frameworks',
  'bases-de-donnees': 'Bases de données',
  'developpement-web': 'Développement web',
  outils: 'Outils',
  'gestion-de-projet': 'Gestion de projet',
}

const esc = (v) =>
  String(v ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')

async function getJson(url) {
  const r = await fetch(url, { signal: AbortSignal.timeout(20000), headers: { Accept: 'application/json' } })
  if (!r.ok) throw new Error(`${r.status} sur ${url}`)
  return r.json()
}

async function chargerDonnees(apiUrl, slug, racine) {
  if (apiUrl && !/localhost|127\.0\.0\.1/.test(apiUrl)) {
    try {
      const base = apiUrl.replace(/\/+$/, '')
      const candidat = await getJson(`${base}/api/candidats/${slug}`)
      const projets = (await getJson(`${base}/api/candidats/${slug}/projets?size=100`)).items || []
      return { candidat, projets, source: 'API' }
    } catch (e) {
      console.warn(`[seo] API indisponible (${e.message}), repli sur data/`)
    }
  }
  const fc = resolve(racine, '../../data/candidats/JoelDIANGON.json')
  const fp = resolve(racine, '../../data/projets/JoelDIANGON.json')
  if (existsSync(fc) && existsSync(fp)) {
    return {
      candidat: JSON.parse(readFileSync(fc, 'utf8')),
      projets: JSON.parse(readFileSync(fp, 'utf8')),
      source: 'data/',
    }
  }
  return null
}

function contenuHtml({ candidat: c, projets }, nomCompetence) {
  const liens = c.liens || {}
  const exps = c.experiences || []
  const pros = sortByDateDesc(exps.filter((e) => !isAssociatif(e)))
  const assos = sortByDateDesc(exps.filter(isAssociatif))
  const formations = sortByDateDesc(c.formations || [])
  const certifs = c.certifications || CERTIFICATIONS
  const langues = c.langues || LANGUES
  const tries = [...projets].sort((a, b) =>
    String(b.date_fin || b.date_debut || '9999').localeCompare(String(a.date_fin || a.date_debut || '9999')),
  )
  const parDomaine = new Map()
  for (const comp of c.competences || []) {
    const d = comp.domaine || 'autres'
    if (!parDomaine.has(d)) parDomaine.set(d, [])
    parDomaine.get(d).push(comp.nom)
  }
  const experience = (e) => `
      <article>
        <h3>${esc(e.poste)} chez ${esc(e.entreprise)}</h3>
        <p><time>${esc(formatPeriod(e.debut, e.fin))}</time></p>
        ${e.description ? `<p>${esc(e.description)}</p>` : ''}
        ${e.competences?.length ? `<p>Compétences : ${esc(e.competences.map(nomCompetence).join(', '))}</p>` : ''}
      </article>`

  return `
    <main class="seo-static" lang="fr">
      <header>
        <h1>${esc(c.prenom)} ${esc(c.nom)}</h1>
        <p><strong>${esc(c.titre)}</strong></p>
        ${c.bio ? `<p>${esc(c.bio)}</p>` : ''}
        <p>
          ${liens.linkedin ? `<a href="${esc(liens.linkedin)}">LinkedIn</a>` : ''}
          ${liens.github ? ` · <a href="${esc(liens.github)}">GitHub</a>` : ''}
        </p>
      </header>

      <section>
        <h2>Expériences professionnelles</h2>
        ${pros.map(experience).join('')}
      </section>

      <section>
        <h2>Formation</h2>
        ${formations
          .map(
            (f) => `
      <article>
        <h3>${esc(f.diplome)}</h3>
        <p>${esc(f.ecole)} · <time>${esc(formatPeriod(f.debut, f.fin))}</time></p>
      </article>`,
          )
          .join('')}
        <h3>Certifications</h3>
        <ul>${certifs.map((x) => `<li>${esc(x.nom)} (${esc(x.statut)})</li>`).join('')}</ul>
      </section>

      <section>
        <h2>Projets</h2>
        ${tries
          .map(
            (p) => `
      <article>
        <h3>${esc(p.titre)}</h3>
        <p>${esc(p.contexte || '')}${p.date_debut ? ` · <time>${esc(formatPeriod(p.date_debut, p.date_fin))}</time>` : ''}</p>
        <p>${esc(p.description)}</p>
        ${
          p.metriques && Object.keys(p.metriques).length
            ? `<ul>${Object.entries(p.metriques)
                .map(([k, v]) => `<li>${esc(humanizeKey(k))} : ${esc(v)}</li>`)
                .join('')}</ul>`
            : ''
        }
        <p>Compétences : ${esc((p.competences || []).map(nomCompetence).join(', '))}</p>
        ${p.liens?.github ? `<p><a href="${esc(p.liens.github)}">Code source sur GitHub</a></p>` : ''}
      </article>`,
          )
          .join('')}
      </section>

      <section>
        <h2>Compétences</h2>
        ${[...parDomaine.entries()]
          .map(([d, noms]) => `<h3>${esc(DOMAINES[d] || d)}</h3><p>${esc(noms.join(', '))}</p>`)
          .join('')}
      </section>

      ${assos.length ? `<section><h2>Engagement associatif</h2>${assos.map(experience).join('')}</section>` : ''}

      <section>
        <h2>Langues</h2>
        <ul>${langues.map((l) => `<li>${esc(l.langue)} : ${esc(l.niveau)}</li>`).join('')}</ul>
      </section>

      <section>
        <h2>Contact</h2>
        <ul>
          ${liens.linkedin ? `<li>LinkedIn : <a href="${esc(liens.linkedin)}">${esc(decodeURI(liens.linkedin))}</a></li>` : ''}
          ${liens.github ? `<li>GitHub : <a href="${esc(liens.github)}">${esc(liens.github)}</a></li>` : ''}
        </ul>
      </section>
    </main>`
}

function teteHtml({ candidat: c }, siteUrl) {
  const nom = `${c.prenom} ${c.nom}`
  const resume = (c.bio || c.titre || '').replace(/\s+/g, ' ').slice(0, 280)
  const actuelle = (c.experiences || []).find((e) => !e.fin && !isAssociatif(e))
  const personne = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: nom,
    jobTitle: (c.titre || '').split(',')[0],
    description: resume,
    url: siteUrl,
    image: `${siteUrl}/portrait-joel-diangon.webp`,
    sameAs: Object.values(c.liens || {}).filter(Boolean),
    ...(actuelle ? { worksFor: { '@type': 'Organization', name: actuelle.entreprise } } : {}),
    alumniOf: (c.formations || []).map((f) => ({ '@type': 'EducationalOrganization', name: f.ecole })),
    knowsAbout: [...(c.competences || [])]
      .sort((a, b) => (b.niveau || 0) - (a.niveau || 0))
      .slice(0, 15)
      .map((x) => x.nom),
    knowsLanguage: (c.langues || LANGUES).map((l) => l.langue),
  }
  const titre = `${nom} · ${(c.titre || '').split(',')[0]}`
  return `
    <link rel="canonical" href="${esc(siteUrl)}/" />
    <meta property="og:type" content="profile" />
    <meta property="og:locale" content="fr_FR" />
    <meta property="og:site_name" content="${esc(nom)}" />
    <meta property="og:title" content="${esc(titre)}" />
    <meta property="og:description" content="${esc(resume)}" />
    <meta property="og:url" content="${esc(siteUrl)}/" />
    <meta property="og:image" content="${esc(siteUrl)}/og-image.jpg" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    <meta property="og:image:alt" content="${esc(nom)}, ${esc((c.titre || '').split(',')[0])}" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${esc(titre)}" />
    <meta name="twitter:description" content="${esc(resume)}" />
    <meta name="twitter:image" content="${esc(siteUrl)}/og-image.jpg" />
    <script type="application/ld+json">${JSON.stringify(personne).replace(/</g, '\\u003c')}</script>
    <style>
      /* Version texte : invisible si React démarre (il remplace #root), lisible après 3 s sinon. */
      .seo-static { position: fixed; inset: 0; overflow-y: auto; padding: 2.5rem 1.2rem 4rem;
        background: #060e17; color: #e4edf2; font: 15px/1.6 Inter, system-ui, sans-serif;
        opacity: 0; animation: seo-afficher 0.3s ease-out 3s forwards; }
      .seo-static > * { max-width: 46rem; margin-inline: auto; }
      .seo-static h1 { font-size: 2.2rem; font-weight: 300; margin: 0 0 0.4rem; }
      .seo-static h2 { font-size: 1.4rem; font-weight: 400; margin: 2.4rem 0 0.8rem; }
      .seo-static h3 { font-size: 1.05rem; font-weight: 500; margin: 1.2rem 0 0.2rem; }
      .seo-static p, .seo-static ul { margin: 0.3rem 0; }
      .seo-static a { color: #8cc5a8; }
      @keyframes seo-afficher { to { opacity: 1; } }
    </style>`
}

export default function seoPrerender() {
  let env = {}
  let racine = process.cwd()
  return {
    name: 'seo-prerender',
    apply: 'build',
    configResolved(config) {
      racine = config.root
      env = loadEnv(config.mode, config.envDir || config.root, '')
    },
    async transformIndexHtml(html) {
      const apiUrl = process.env.VITE_API_URL || env.VITE_API_URL || ''
      const slug = process.env.VITE_CANDIDAT_SLUG || env.VITE_CANDIDAT_SLUG || 'joel-diangon'
      const siteUrl = (process.env.VITE_SITE_URL || env.VITE_SITE_URL || SITE_URL_DEFAUT).replace(/\/+$/, '')
      const donnees = await chargerDonnees(apiUrl, slug, racine)
      if (!donnees?.candidat) {
        console.warn('[seo] aucune donnée : la version texte n’est pas générée')
        return html
      }
      // Libellés des compétences (le profil en donne le nom ; les projets n'ont que l'identifiant)
      const noms = new Map((donnees.candidat.competences || []).map((x) => [x.skill_slug, x.nom]))
      const nomCompetence = (s) => noms.get(s) || s
      console.log(`[seo] version texte générée depuis ${donnees.source} (${donnees.projets.length} projets)`)
      return html
        .replace('</head>', `${teteHtml(donnees, siteUrl)}\n  </head>`)
        .replace('<div id="root"></div>', `<div id="root">${contenuHtml(donnees, nomCompetence)}</div>`)
    },
  }
}
