/**
 * Version texte du portfolio, écrite dans index.html au moment du build (plugin Vite).
 *
 * Le site est une application React : sans JavaScript, la page est vide. Les robots qui ne l'exécutent pas
 * (ChatGPT, aperçus de lien LinkedIn, certains moteurs) ne voyaient que le titre. Ce plugin insère donc dans
 * <div id="root"> tout le contenu en HTML simple, en français puis en anglais (bloc lang="en"), plus une fiche
 * schema.org « Person », les balises d'aperçu (Open Graph) et les liens hreflang vers la version anglaise
 * (?lang=en, que le site lit au démarrage). React remplace ce contenu dès qu'il démarre : les visiteurs voient
 * la scène immersive.
 *
 * Données : l'API (VITE_API_URL), comme le site ; à défaut les fichiers data/ du dépôt ; à défaut rien
 * (le build ne casse jamais, un avertissement est affiché). Les deux langues partagent le même rendu :
 * textes fixes dans TEXTES ci-dessous, données traduites par localizer() (src/i18n/content.js).
 */
import { readFileSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { loadEnv } from 'vite'
import { CERTIFICATIONS, LANGUES, isAssociatif } from './src/content/static.js'
import { localizer } from './src/i18n/content.js'
import { sortByDateDesc, truncate } from './src/lib/format.js'

const SITE_URL_DEFAUT = 'https://portfolio-joel-five.vercel.app'

/** Titres et mots de liaison de la version texte (les données, elles, sont traduites par localizer). */
const TEXTES = {
  fr: {
    experiences: 'Expériences professionnelles',
    chez: 'chez',
    formation: 'Formation',
    certifications: 'Certifications',
    projets: 'Projets',
    competences: 'Compétences',
    codeSource: 'Code source sur GitHub',
    associatif: 'Engagement associatif',
    langues: 'Langues',
    contact: 'Contact',
    email: 'E-mail',
    // Typographie française : espace avant les deux-points
    deuxPoints: ' : ',
  },
  en: {
    experiences: 'Professional experience',
    chez: 'at',
    formation: 'Education',
    certifications: 'Certifications',
    projets: 'Projects',
    competences: 'Skills',
    codeSource: 'Source code on GitHub',
    associatif: 'Community involvement',
    langues: 'Languages',
    contact: 'Contact',
    email: 'Email',
    deuxPoints: ': ',
  },
}

const esc = (v) =>
  String(v ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')

/** « Joël DIANGON » : nom de famille en capitales, même si une ancienne copie des données l'écrit autrement. */
const nomComplet = (c) => `${c.prenom ?? ''} ${String(c.nom ?? '').toUpperCase()}`.trim()

/** Titre court des aperçus (« Ingénieur Data · BI · IA ») : la partie avant une éventuelle virgule. */
const titreCourt = (titre) => String(titre || '').split(',')[0].trim()

/** Adresse lisible (« jo%C3%ABl » -> « joël ») ; l'adresse telle quelle si elle est mal encodée. */
function adresseLisible(url) {
  try {
    return decodeURI(url)
  } catch {
    return url
  }
}

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

/**
 * Tout le portfolio dans une langue. Le même code sert aux deux langues : textes fixes de TEXTES[lang],
 * données traduites par localizer(lang) (en français, les données restent telles quelles).
 */
function contenuHtml({ candidat: profil, projets }, lang) {
  const t = TEXTES[lang] || TEXTES.fr
  const L = localizer(lang)
  // L'API ne renvoie pas (encore) langues et certifications : repli sur src/content/static.js
  const c = L.candidat({
    ...profil,
    langues: profil.langues || LANGUES,
    certifications: profil.certifications || CERTIFICATIONS,
  })
  const liens = c.liens || {}
  // Tri pro / associatif sur la donnée française : en anglais, le nom d'une organisation peut être traduit
  const exps = profil.experiences || []
  const pros = sortByDateDesc(exps.filter((e) => !isAssociatif(e))).map(L.experience)
  const assos = sortByDateDesc(exps.filter(isAssociatif)).map(L.experience)
  const formations = sortByDateDesc(profil.formations || []).map(L.formation)
  const tries = [...(projets || [])]
    .sort((a, b) =>
      String(b.date_fin || b.date_debut || '9999').localeCompare(String(a.date_fin || a.date_debut || '9999')),
    )
    .map(L.projet)
  // Libellés des compétences (le profil en donne le nom ; projets et expériences n'ont que l'identifiant)
  const noms = new Map((profil.competences || []).map((x) => [x.skill_slug, x.nom]))
  const nomCompetence = (slug) => L.skill(slug, noms.get(slug) || slug)
  const parDomaine = new Map()
  for (const comp of c.competences || []) {
    const d = comp.domaine || 'autres'
    if (!parDomaine.has(d)) parDomaine.set(d, [])
    parDomaine.get(d).push(comp.nom)
  }
  // « Compétences : » en français, « Skills: » en anglais
  const libelle = (texte) => `${esc(texte)}${t.deuxPoints}`
  // Moyens de contact juste sous le titre, comme sur le site
  const contacts = [
    liens.email && `<a href="mailto:${esc(liens.email)}">${esc(liens.email)}</a>`,
    liens.linkedin && `<a href="${esc(liens.linkedin)}">LinkedIn</a>`,
    liens.github && `<a href="${esc(liens.github)}">GitHub</a>`,
  ].filter(Boolean)

  const experience = (e) => `
        <article>
          <h3>${esc(e.poste)} ${t.chez} ${esc(e.entreprise)}</h3>
          <p><time>${esc(L.period(e.debut, e.fin))}</time></p>
          ${e.description ? `<p>${esc(e.description)}</p>` : ''}
          ${e.competences?.length ? `<p>${libelle(t.competences)}${esc(e.competences.map(nomCompetence).join(', '))}</p>` : ''}
        </article>`

  const projet = (p) => `
        <article>
          <h3>${esc(p.titre)}</h3>
          <p>${esc(p.contexte || '')}${p.date_debut ? ` · <time>${esc(L.period(p.date_debut, p.date_fin))}</time>` : ''}</p>
          <p>${esc(p.description)}</p>
          ${
            p.metriques && Object.keys(p.metriques).length
              ? `<ul>${Object.entries(p.metriques)
                  .map(([k, v]) => `<li>${libelle(L.metricLabel(k))}${esc(v)}</li>`)
                  .join('')}</ul>`
              : ''
          }
          <p>${libelle(t.competences)}${esc((p.competences || []).map(nomCompetence).join(', '))}</p>
          ${p.liens?.github ? `<p><a href="${esc(p.liens.github)}">${t.codeSource}</a></p>` : ''}
        </article>`

  return `
      <article lang="${lang}">
        <header>
          <h1>${esc(nomComplet(c))}</h1>
          <p><strong>${esc(c.titre)}</strong></p>
          ${contacts.length ? `<p>${contacts.join(' · ')}</p>` : ''}
          ${c.bio ? `<p>${esc(c.bio)}</p>` : ''}
        </header>

        <section>
          <h2>${t.experiences}</h2>
          ${pros.map(experience).join('')}
        </section>

        <section>
          <h2>${t.formation}</h2>
          ${formations
            .map(
              (f) => `
        <article>
          <h3>${esc(f.diplome)}</h3>
          <p>${esc(f.ecole)} · <time>${esc(L.period(f.debut, f.fin))}</time></p>
        </article>`,
            )
            .join('')}
          <h3>${t.certifications}</h3>
          <ul>${(c.certifications || []).map((x) => `<li>${esc(x.nom)} (${esc(x.statut)})</li>`).join('')}</ul>
        </section>

        <section>
          <h2>${t.projets}</h2>
          ${tries.map(projet).join('')}
        </section>

        <section>
          <h2>${t.competences}</h2>
          ${[...parDomaine.entries()]
            .map(([d, liste]) => `<h3>${esc(L.domain(d))}</h3><p>${esc(liste.join(', '))}</p>`)
            .join('')}
        </section>

        ${assos.length ? `<section><h2>${t.associatif}</h2>${assos.map(experience).join('')}</section>` : ''}

        <section>
          <h2>${t.langues}</h2>
          <ul>${(c.langues || []).map((l) => `<li>${libelle(l.langue)}${esc(l.niveau)}</li>`).join('')}</ul>
        </section>

        <section>
          <h2>${t.contact}</h2>
          <ul>
            ${liens.email ? `<li>${libelle(t.email)}<a href="mailto:${esc(liens.email)}">${esc(liens.email)}</a></li>` : ''}
            ${liens.linkedin ? `<li>${libelle('LinkedIn')}<a href="${esc(liens.linkedin)}">${esc(adresseLisible(liens.linkedin))}</a></li>` : ''}
            ${liens.github ? `<li>${libelle('GitHub')}<a href="${esc(liens.github)}">${esc(liens.github)}</a></li>` : ''}
          </ul>
        </section>
      </article>`
}

/** Version texte complète : le français d'abord (langue principale du site), puis l'anglais. */
const pageHtml = (donnees) => `
    <main class="seo-static">${contenuHtml(donnees, 'fr')}${contenuHtml(donnees, 'en')}
    </main>`

function teteHtml({ candidat: c }, siteUrl) {
  const nom = nomComplet(c)
  const titreFr = titreCourt(c.titre)
  const titre = `${nom} · ${titreFr}`
  const bio = (c.bio || c.titre || '').replace(/\s+/g, ' ').trim()
  // Aperçus de lien : texte court, coupé entre deux mots
  const resume = truncate(bio, 280)
  const actuelle = (c.experiences || []).find((e) => !e.fin && !isAssociatif(e))
  const personne = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: nom,
    jobTitle: titreFr,
    description: bio,
    url: siteUrl,
    image: `${siteUrl}/portrait-joel-diangon.webp`,
    ...(c.liens?.email ? { email: `mailto:${c.liens.email}` } : {}),
    sameAs: [c.liens?.linkedin, c.liens?.github].filter(Boolean),
    ...(actuelle ? { worksFor: { '@type': 'Organization', name: actuelle.entreprise } } : {}),
    alumniOf: (c.formations || []).map((f) => ({ '@type': 'EducationalOrganization', name: f.ecole })),
    knowsAbout: [...(c.competences || [])]
      .sort((a, b) => (b.niveau || 0) - (a.niveau || 0))
      .slice(0, 15)
      .map((x) => x.nom),
    knowsLanguage: (c.langues || LANGUES).map((l) => l.langue),
  }
  return `
    <link rel="canonical" href="${esc(siteUrl)}/" />
    <link rel="alternate" hreflang="fr" href="${esc(siteUrl)}/" />
    <link rel="alternate" hreflang="en" href="${esc(siteUrl)}/?lang=en" />
    <link rel="alternate" hreflang="x-default" href="${esc(siteUrl)}/" />
    <meta property="og:type" content="profile" />
    <meta property="og:locale" content="fr_FR" />
    <meta property="og:locale:alternate" content="en_GB" />
    <meta property="og:site_name" content="${esc(nom)}" />
    <meta property="og:title" content="${esc(titre)}" />
    <meta property="og:description" content="${esc(resume)}" />
    <meta property="og:url" content="${esc(siteUrl)}/" />
    <meta property="og:image" content="${esc(siteUrl)}/og-image.jpg" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    <meta property="og:image:alt" content="${esc(nom)}, ${esc(titreFr)}" />
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
      /* Version anglaise sous la française, séparée par un filet */
      .seo-static > * + * { margin-top: 3.5rem; padding-top: 2.5rem; border-top: 1px solid #1d3344; }
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
      let tete, page
      try {
        tete = teteHtml(donnees, siteUrl)
        page = pageHtml(donnees)
      } catch (e) {
        // Donnée inattendue : le site est publié sans version texte plutôt que de casser le build
        console.warn(`[seo] version texte non générée (${e.message})`)
        return html
      }
      const nb = donnees.projets.length
      console.log(`[seo] version texte générée depuis ${donnees.source} (${nb} projets, français et anglais)`)
      // Remplacement par fonction : un « $ » dans les données (« ≈ 15 560 $ ») n'est pas interprété
      return html
        .replace('</head>', () => `${tete}\n  </head>`)
        .replace('<div id="root"></div>', () => `<div id="root">${page}</div>`)
    },
  }
}
