/**
 * Moteur de questions-réponses du recruteur : sans IA, 100 % local, à partir des données de l'API.
 *
 * Le recruteur ne tape rien : il choisit parmi les questions de FAQ (voir questionsDisponibles).
 * answer(question, ctx) -> { title, text, items: [{ label, sub, to | ask | href | cv }], vide? }
 *   ctx = { candidat, projets, langues, certifications, cvAvailable, skillName, isAssociatif }
 * `to` est une route du site (ex. "projets/edi-de-rijke") que l'interface peut ouvrir.
 */

import { formatMonth, formatPeriod, sortByDateDesc } from './format'

/** minuscules, sans accents ni ponctuation */
export function normalize(text) {
  return ` ${String(text || '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9+#.]+/g, ' ')
    .trim()} `
}

const has = (q, re) => re.test(q)

/** Familles de compétences : un mot de la question -> plusieurs compétences et mots-clés. */
const FAMILLES = [
  {
    label: 'l’intelligence artificielle',
    re: / (ia|ai|intelligence artificielle|machine learning|ml|apprentissage automatique|deep learning|modeles? predictifs?|prediction|scoring) /,
    skills: ['machine-learning', 'scikit-learn', 'tensorflow', 'pytorch'],
  },
  {
    label: 'la BI / data visualisation',
    re: / (bi|business intelligence|dashboards?|tableaux? de bord|dataviz|data visualisation|visualisation|reporting) /,
    skills: ['power-bi', 'dax', 'power-query', 'tableau', 'matplotlib', 'seaborn'],
  },
  {
    label: 'les bases de données',
    re: / (bdd|bases? de donnees|database|nosql) /,
    skills: ['sql', 'mysql', 'mongodb', 'neo4j'],
  },
  {
    label: 'l’intégration de données (ETL)',
    re: / (etl|pipelines?|integration de donnees|data engineering|flux de donnees|edi) /,
    skills: ['etl', 'ssis', 'microsoft-fabric', 'edi', 'data-catalog'],
  },
  {
    label: 'le développement web',
    re: / (web|site|front|frontend|backend) /,
    skills: ['php', 'html', 'css', 'javascript', 'fastapi'],
  },
  {
    label: 'la gestion de projet et les méthodes agiles',
    re: / (gestion de projet|agiles?|scrum|methodes? de travail|methodologies?) /,
    skills: ['agile-scrum', 'uml', 'trello', 'teams'],
  },
]

/** Secteurs d'activité, déduits du nom de l'entreprise et de la description de l'expérience. */
// L'ordre compte : une alternance logistique qui produit aussi des tableaux de bord « finance » reste logistique.
const SECTEURS = [
  { label: 'Transport et logistique', re: / (logistique|transport\w*|supply chain) / },
  { label: 'Banque et finance', re: / (banque|bank|bancaire|financ\w*) / },
  { label: 'Tourisme et hôtellerie', re: / (residence|hotel\w*|vacances|tourisme|clientele internationale) / },
  { label: 'Éducation', re: / (lyceens?|pedagogi\w*|enseign\w*|soutien scolaire|completude) / },
]

function secteurDe(e) {
  const texte = normalize(`${e.entreprise} ${e.poste} ${e.description}`)
  return SECTEURS.find((s) => s.re.test(texte))?.label || 'Autre'
}

const DOMAINES_LIBELLES = {
  langages: 'Langages',
  bi: 'Business intelligence',
  'data-ia': 'Data & IA',
  'data-engineering': 'Data engineering',
  frameworks: 'Bibliothèques & frameworks',
  'bases-de-donnees': 'Bases de données',
  'developpement-web': 'Développement web',
  outils: 'Outils',
  'gestion-de-projet': 'Gestion de projet',
}

const METRIQUE_SIGLES = new Set(['kpi', 'kpis', 'etl', 'mae', 'rmse', 'roi'])
const libelleMetrique = (k) => {
  const t = String(k)
    .split('_')
    .map((w) => (METRIQUE_SIGLES.has(w) ? w.toUpperCase() : w))
    .join(' ')
  return t.charAt(0).toUpperCase() + t.slice(1)
}

/** Compétences citées dans la question (nom ou slug), plus les familles. */
function detectSkills(q, ctx) {
  const found = new Map() // slug -> libellé
  const tous = new Set([
    ...(ctx.candidat?.competences || []).map((c) => c.skill_slug),
    ...ctx.projets.flatMap((p) => p.competences || []),
  ])
  for (const slug of tous) {
    const nom = ctx.skillName(slug)
    const variantes = new Set([normalize(nom).trim(), normalize(slug.replace(/-/g, ' ')).trim(), normalize(slug).trim()])
    for (const v of variantes) {
      if (!v) continue
      // Les langages d'une seule lettre (R, C) ne sont reconnus que dans « en R », « langage C »…
      if (v.length === 1) {
        if (new RegExp(` (en|langage|le) ${v} `).test(q)) found.set(slug, nom)
        continue
      }
      if (q.includes(` ${v} `)) found.set(slug, nom)
    }
  }
  // Une technologie citée précisément (« Power BI », « machine learning ») n'est pas élargie à sa famille :
  // les familles ne servent qu'aux questions générales (« projets d'IA », « de la BI »).
  if (found.size) return { slugs: [...found.keys()], familles: [] }
  const familles = FAMILLES.filter((f) => f.re.test(q))
  for (const f of familles) for (const s of f.skills) if (tous.has(s)) found.set(s, ctx.skillName(s))
  return { slugs: [...found.keys()], familles }
}

/** Nombre de mois couverts par des périodes (chevauchements fusionnés). */
function moisCouverts(periodes) {
  const now = new Date()
  const toIdx = (v, fallbackNow) => {
    if (!v) return fallbackNow ? now.getFullYear() * 12 + now.getMonth() : null
    const [y, m = '1'] = String(v).split('-')
    return Number(y) * 12 + Number(m) - 1
  }
  const mois = new Set()
  for (const p of periodes) {
    const a = toIdx(p.debut, false)
    const b = toIdx(p.fin, true)
    if (a == null || b == null) continue
    for (let i = a; i <= b; i += 1) mois.add(i)
  }
  return mois.size
}

function dureeTexte(mois) {
  const ans = Math.floor(mois / 12)
  const reste = mois % 12
  const parts = []
  if (ans) parts.push(`${ans} an${ans > 1 ? 's' : ''}`)
  if (reste) parts.push(`${reste} mois`)
  return parts.join(' et ') || 'moins d’un mois'
}

const projetItem = (p, skillName, focus = []) => ({
  label: p.titre,
  sub: [p.contexte, focus.length ? focus.map(skillName).join(' · ') : null].filter(Boolean).join(' · '),
  to: `projets/${p.projet_slug}`,
})

const expItem = (e, to) => ({ label: `${e.poste} chez ${e.entreprise}`, sub: formatPeriod(e.debut, e.fin), to })

/**
 * Questions fréquentes proposées au recruteur, par thème. Il ne peut pas en rédiger d'autres :
 * l'interface n'affiche que celles auxquelles les données permettent de répondre (voir questionsDisponibles).
 */
export const FAQ = [
  {
    theme: 'Profil',
    questions: [
      'Qui est Joël ?',
      'Pourquoi le recruter ?',
      'Que fait-il en ce moment ?',
      'Est-il disponible pour un CDI ou un stage ?',
      'Quand sera-t-il diplômé ?',
    ],
  },
  {
    theme: 'Expérience',
    questions: [
      'Combien d’années d’expérience a-t-il ?',
      'Dans quelles entreprises a-t-il travaillé ?',
      'Dans quels secteurs a-t-il travaillé ?',
      'Quels résultats concrets a-t-il obtenus ?',
    ],
  },
  {
    theme: 'Projets',
    questions: [
      'Combien de projets a-t-il réalisés ?',
      'Quel est son projet le plus récent ?',
      'Projets d’intelligence artificielle',
      'Projets Power BI',
      'Projets en Python',
      'Projets SQL',
      'Projets d’intégration de données (ETL)',
      'Projets de développement web',
    ],
  },
  {
    theme: 'Compétences',
    questions: [
      'Quelles sont ses compétences principales ?',
      'A-t-il de l’expérience en machine learning ?',
      'Quels outils de data visualisation utilise-t-il ?',
      'Connaît-il les méthodes agiles ?',
    ],
  },
  {
    theme: 'Formation et langues',
    questions: ['Quels diplômes prépare-t-il ?', 'Quelles certifications a-t-il ?', 'Quelles langues parle-t-il ?', 'Quel est son niveau d’anglais ?'],
  },
  {
    theme: 'Engagement et contact',
    questions: ['A-t-il un engagement associatif ?', 'Comment le contacter ?', 'Voir son CV'],
  },
]

const SANS_REPONSE = 'Pas de réponse trouvée'

/** La FAQ, limitée aux questions qui ont une vraie réponse avec les données actuelles. */
export function questionsDisponibles(ctx) {
  if (!ctx.candidat) return []
  return FAQ.map((g) => ({
    theme: g.theme,
    questions: g.questions.filter((q) => {
      const r = answer(q, ctx)
      return r.title !== SANS_REPONSE && !r.vide
    }),
  })).filter((g) => g.questions.length)
}

const MOTS_VIDES = new Set(
  'les des une un le la de du et en au aux pour par sur dans avec quel quelle quels quelles est sont ont a il elle ses son sa qui que quoi comment combien projet projets fait faire avoir utilise utilisant joel diangon'.split(
    ' ',
  ),
)

export function answer(question, ctx) {
  const q = normalize(question)
  const { candidat } = ctx
  if (!candidat) return { title: 'Profil en cours de chargement', text: 'Réessayez dans un instant.', items: [] }

  const experiences = candidat.experiences || []
  const pros = experiences.filter((e) => !ctx.isAssociatif(e))
  const assos = experiences.filter((e) => ctx.isAssociatif(e))
  const liens = candidat.liens || {}

  // ── Contact / CV
  if (has(q, / (contact|contacter|joindre|e ?mail|mail|linkedin|github|coordonnees|telephone) /)) {
    const items = Object.entries(liens)
      .filter(([, url]) => url)
      .map(([k, url]) => ({ label: k === 'linkedin' ? 'LinkedIn' : k === 'github' ? 'GitHub' : k, sub: url, href: url }))
    if (ctx.cvAvailable) items.push({ label: 'Voir le CV', sub: 'Coordonnées complètes dans le CV (PDF)', cv: true })
    return { title: 'Comment le contacter', text: 'Le plus simple : un message sur LinkedIn.', items }
  }
  if (has(q, / (cv|curriculum|resume pdf) /)) {
    return ctx.cvAvailable
      ? { title: 'Son CV', text: 'Le CV est disponible en PDF.', items: [{ label: 'Voir le CV', sub: 'PDF, avec option de téléchargement', cv: true }] }
      : { title: 'Son CV', text: 'Le CV n’est pas encore en ligne : contactez-le via LinkedIn.', items: [], vide: true }
  }

  // ── Langues / certifications
  if (has(q, / (langues?|anglais|francais|english|parle|bilingue) /)) {
    // Une langue précise (« niveau d'anglais ») : elle passe en premier.
    const precise = ctx.langues.find((l) => q.includes(` ${normalize(l.langue).trim()} `))
    const liste = (ls) => ls.map((l) => `${l.langue} : ${l.niveau}`).join(' · ')
    const autres = ctx.langues.filter((l) => l !== precise)
    return {
      title: precise ? `${precise.langue} : ${precise.niveau}` : 'Langues',
      text: precise ? (autres.length ? `Autres langues : ${liste(autres)}` : '') : liste(ctx.langues),
      items: [{ label: 'Voir le détail des langues', to: 'langues' }],
    }
  }
  if (has(q, / (certif\w*) /)) {
    return {
      title: 'Certifications',
      text: `${ctx.certifications.length} certification(s).`,
      items: ctx.certifications.map((c) => ({ label: c.nom, sub: c.statut, to: 'formation' })),
    }
  }

  // ── Atouts (avant « disponibilité », qui reconnaît aussi « recruter »)
  if (has(q, / (pourquoi|atouts?|points forts|forces?|valeur ajoutee|apporter|se distingue) /)) {
    const top = [...(candidat.competences || [])].sort((a, b) => (b.niveau || 0) - (a.niveau || 0)).slice(0, 4)
    const avecMetriques = ctx.projets.filter((p) => p.metriques && Object.keys(p.metriques).length)
    const enCours = pros.find((e) => !e.fin)
    const texte = [
      `${dureeTexte(moisCouverts(pros))} d’expérience professionnelle, dont ${dureeTexte(moisCouverts(pros.filter((e) => (e.competences || []).length)))} en data.`,
      enCours ? `Actuellement ${enCours.poste} chez ${enCours.entreprise}.` : null,
      `${ctx.projets.length} projets réalisés${avecMetriques.length ? `, dont ${avecMetriques.length} aux résultats chiffrés` : ''}.`,
      top.length ? `Points forts : ${top.map((c) => c.nom).join(', ')}.` : null,
    ]
      .filter(Boolean)
      .join(' ')
    return {
      title: 'Ses atouts',
      text: texte,
      items: [
        { label: 'Voir ses résultats concrets', ask: 'Quels résultats concrets a-t-il obtenus ?' },
        { label: 'Voir tous ses projets', to: 'projets' },
      ],
    }
  }

  // ── Résultats chiffrés des projets
  if (has(q, / (resultats?|chiffres?|impacts?|gains?|metriques?|concrets?|realisations? chiffrees) /)) {
    const avecMetriques = ctx.projets.filter((p) => p.metriques && Object.keys(p.metriques).length)
    return {
      title: 'Résultats concrets',
      text: `${avecMetriques.length} projet(s) avec des résultats mesurés :`,
      items: avecMetriques.map((p) => ({
        label: p.titre,
        sub: Object.entries(p.metriques)
          .map(([k, v]) => `${libelleMetrique(k)} ${v}`)
          .join(' · '),
        to: `projets/${p.projet_slug}`,
      })),
      vide: !avecMetriques.length,
    }
  }

  // ── Secteurs d'activité
  if (has(q, / (secteurs?|domaines? d activite|industries?|finance|banque|bancaire|logistique|transport|supply chain) /)) {
    const parSecteur = new Map()
    for (const e of sortByDateDesc(pros)) {
      const s = secteurDe(e)
      if (!parSecteur.has(s)) parSecteur.set(s, [])
      parSecteur.get(s).push(e)
    }
    return {
      title: 'Secteurs d’activité',
      text: `${[...parSecteur.keys()].filter((s) => s !== 'Autre').join(', ')}.`,
      items: [...parSecteur.entries()].flatMap(([s, exps]) =>
        exps.map((e) => ({ label: `${e.poste} chez ${e.entreprise}`, sub: `${s} · ${formatPeriod(e.debut, e.fin)}`, to: 'experiences' })),
      ),
    }
  }

  // ── Formation
  if (has(q, / (formations?|diplomes?|ecoles?|etudes?|etudiant|master|ingenieur|prepa|academique|universite|esigelec|bac) /)) {
    const formations = sortByDateDesc(candidat.formations || [])
    const enCours = formations.find((f) => f.fin && f.fin >= new Date().toISOString().slice(0, 7))
    return {
      title: 'Formation',
      text: enCours
        ? `En cours : ${enCours.diplome} (${enCours.ecole}), diplôme prévu en ${formatMonth(enCours.fin)}.`
        : `${formations.length} formation(s), la plus récente : ${formations[0]?.diplome} (${formations[0]?.ecole}).`,
      items: formations.map((f) => ({ label: f.diplome, sub: `${f.ecole} · ${formatPeriod(f.debut, f.fin)}`, to: 'formation' })),
    }
  }

  // ── Associatif
  if (has(q, / (associ\w*|benevol\w*|engagement|club|mentor\w*|afev) /)) {
    return {
      title: 'Engagement associatif',
      text: assos.length ? `${assos.length} engagement(s) associatif(s).` : 'Aucun engagement associatif renseigné.',
      items: sortByDateDesc(assos).map((e) => expItem(e, 'associatif')),
    }
  }

  const skills = detectSkills(q, ctx)

  // ── Années d'expérience
  if (
    has(q, / (combien|nombre|annees?|ans|duree|depuis quand|anciennete) /) &&
    has(q, / (experiences?|expe|travail|travaille|professionnel\w*|carriere) /) &&
    !skills.slugs.length
  ) {
    const total = moisCouverts(pros)
    const data = pros.filter((e) => (e.competences || []).length)
    const totalData = moisCouverts(data)
    return {
      title: 'Expérience professionnelle',
      text: `${dureeTexte(total)} d’expérience professionnelle cumulée (${pros.length} expériences), dont ${dureeTexte(totalData)} en data (alternance et stages).`,
      items: sortByDateDesc(pros).map((e) => expItem(e, 'experiences')),
    }
  }

  // ── Poste actuel / disponibilité
  if (has(q, / (actuel\w*|aujourd hui|en ce moment|maintenant|poste|alternance|alternant|disponib\w*|recrut\w*|embauch\w*|cdi|stage) /)) {
    const enCours = pros.filter((e) => !e.fin)
    const formation = sortByDateDesc(candidat.formations || []).find((f) => !f.fin || f.fin >= new Date().toISOString().slice(0, 7))
    const texte = [
      enCours.length ? `En ce moment : ${enCours.map((e) => `${e.poste} chez ${e.entreprise} (depuis ${formatMonth(e.debut)})`).join(', ')}.` : null,
      formation ? `En parallèle : ${formation.diplome} (${formation.ecole}), fin prévue ${formatPeriod(formation.fin, formation.fin)}.` : null,
      'Pour une opportunité, contactez-le via LinkedIn.',
    ]
      .filter(Boolean)
      .join(' ')
    const dispo = has(q, / (disponib\w*|recrut\w*|embauch\w*|cdi|stage) /)
    return { title: dispo ? 'Disponibilité' : 'Situation actuelle', text: texte, items: enCours.map((e) => expItem(e, 'experiences')) }
  }

  // ── Projets / expériences par compétence
  if (skills.slugs.length) {
    const set = new Set(skills.slugs)
    const projets = ctx.projets.filter((p) => (p.competences || []).some((s) => set.has(s)))
    const exps = pros.filter((e) => (e.competences || []).some((s) => set.has(s)))
    const sujet = skills.familles.length ? skills.familles.map((f) => f.label).join(', ') : skills.slugs.map(ctx.skillName).join(', ')
    const mois = moisCouverts(exps)
    // Compétences déclarées dans le profil (niveau sur 5), utiles quand aucun projet publié ne les mobilise.
    const declarees = (candidat.competences || []).filter((c) => set.has(c.skill_slug))
    const niveaux = declarees.map((c) => c.nom).join(', ')
    return {
      title: `${sujet.charAt(0).toUpperCase()}${sujet.slice(1)}`,
      text: projets.length
        ? `${projets.length} projet(s) mobilisent ${sujet}${exps.length ? `, et ${dureeTexte(mois)} d’expérience professionnelle s’y rapportent` : ''}.`
        : declarees.length
          ? `Compétence(s) déclarée(s) : ${niveaux}${exps.length ? `, mises en pratique dans ${exps.length} expérience(s) professionnelle(s)` : ''}.`
          : `Aucun projet ne mobilise ${sujet}${exps.length ? `, mais ${exps.length} expérience(s) professionnelle(s) oui` : ''}.`,
      items: [
        ...projets.map((p) => projetItem(p, ctx.skillName, (p.competences || []).filter((s) => set.has(s)))),
        ...exps.map((e) => expItem(e, 'experiences')),
      ],
      vide: !projets.length && !exps.length && !declarees.length,
    }
  }

  // ── Entreprises
  if (has(q, / (entreprises?|societes?|employeurs?|boites?|travaille) /)) {
    return {
      title: 'Entreprises',
      text: `${pros.length} expérience(s) dans ${new Set(pros.map((e) => e.entreprise)).size} structure(s).`,
      items: sortByDateDesc(pros).map((e) => expItem(e, 'experiences')),
    }
  }

  // ── Projet le plus récent
  if (has(q, / (projets?|realisations?) /) && has(q, / (recents?|dernier|derniere|nouveau) /)) {
    const dates = ctx.projets.filter((p) => p.date_debut || p.date_fin)
    const recent = [...dates].sort((a, b) =>
      String(b.date_fin || b.date_debut).localeCompare(String(a.date_fin || a.date_debut)),
    )[0]
    if (recent) {
      return {
        title: 'Son projet le plus récent',
        text: `${recent.titre} (${formatPeriod(recent.date_debut, recent.date_fin)}) : ${recent.description}`,
        items: [projetItem(recent, ctx.skillName, recent.competences || [])],
      }
    }
  }

  // ── Projets (général)
  if (has(q, / (projets?|realisations?|portfolio|travaux) /)) {
    const projets = [...ctx.projets].sort((a, b) => String(b.date_debut || '').localeCompare(String(a.date_debut || '')))
    return {
      title: 'Projets',
      text: `${projets.length} projets réalisés.`,
      items: projets.map((p) => projetItem(p, ctx.skillName)),
    }
  }

  // ── Compétences (général)
  if (has(q, / (competences?|sait|savoir|maitrise|technos?|technologies?|outils?|stack|langages?|points forts) /)) {
    const top = [...(candidat.competences || [])].sort((a, b) => (b.niveau || 0) - (a.niveau || 0)).slice(0, 10)
    return {
      title: 'Compétences principales',
      text: `${(candidat.competences || []).length} compétences déclarées. Les plus maîtrisées :`,
      items: top.map((c) => ({ label: c.nom, sub: DOMAINES_LIBELLES[c.domaine] || c.domaine || '', to: `projets?competence=${c.skill_slug}` })),
    }
  }

  // ── Profil
  if (has(q, / (qui|profil|presente\w*|resume|parcours|bio) /)) {
    return { title: `${candidat.prenom} ${candidat.nom}`, text: candidat.bio || candidat.titre, items: [] }
  }

  // ── Recherche plein texte (repli)
  const mots = q.split(' ').filter((w) => w.length >= 3 && !MOTS_VIDES.has(w))
  if (mots.length) {
    const score = (texte) => mots.filter((m) => normalize(texte).includes(` ${m}`)).length
    const projets = ctx.projets
      .map((p) => ({ p, s: score(`${p.titre} ${p.description} ${p.contexte}`) }))
      .filter((x) => x.s > 0)
      .sort((a, b) => b.s - a.s)
      .map((x) => projetItem(x.p, ctx.skillName))
    const exps = experiences
      .map((e) => ({ e, s: score(`${e.poste} ${e.entreprise} ${e.description}`) }))
      .filter((x) => x.s > 0)
      .sort((a, b) => b.s - a.s)
      .map((x) => expItem(x.e, ctx.isAssociatif(x.e) ? 'associatif' : 'experiences'))
    if (projets.length || exps.length) {
      return { title: 'Résultats', text: `${projets.length + exps.length} élément(s) correspondent à votre recherche.`, items: [...projets, ...exps] }
    }
  }

  return { title: SANS_REPONSE, text: '', items: [] }
}
