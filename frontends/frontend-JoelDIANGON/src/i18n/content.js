/**
 * Version anglaise des DONNÉES du portfolio (profil, expériences, projets, compétences…).
 *
 * Les données viennent de l'API d'équipe, en français (data/*.json). Plutôt que de modifier le contrat
 * de l'API commune, les traductions vivent ici, côté site, rattachées à des identifiants stables :
 *   - expériences : « entreprise|début »      (ex. "De Rijke France|2025-10")
 *   - formations  : « école|début »
 *   - projets     : projet_slug
 *   - compétences : skill_slug
 * Sans traduction, le texte français s'affiche : rien ne casse si une donnée est ajoutée.
 * À METTRE À JOUR quand le texte français change dans data/ (sinon l'anglais reste l'ancien).
 *
 * Fichier en JavaScript pur (sans React) : il sert aussi au build (seo-prerender.js) et au moteur de FAQ.
 * Anglais britannique, sans tiret long.
 */
import { formatMonth, formatPeriod, humanizeKey } from '../lib/format.js'

export const LANGS = ['fr', 'en']

const EN = {
  titre: 'Data · BI · AI Engineer',
  bio:
    'Data analytics, business intelligence and artificial intelligence profile. Engineering student at ESIGELEC, ' +
    'specialising in Big Data for Digital Transformation. Open to new challenges, I help organisations explore, ' +
    'leverage and add value to their data, turning it into a driver of decision-making and performance.',

  experiences: {
    'De Rijke France|2025-10': {
      poste: 'Data & AI Engineering Apprentice',
      description:
        'Design and maintenance of Power BI dashboards for 5 business functions (logistics, transport, quality, ' +
        'finance, marketing), fed by ETL pipelines (SSIS, Microsoft Fabric). Implementation of EDI with partners and ' +
        'between internal systems (XML, JSON, EDIFACT), with data flows documented in the data catalogue. ' +
        'AI projects applied to transport and logistics.',
    },
    'Afriland First Bank|2024-06': {
      poste: 'Junior Data Analyst (internship)',
      description:
        'Customer scoring model to target retention and marketing: +10% customer retention, -15% marketing costs. ' +
        'Automated financial reporting in Power BI: -30% analysis time. ' +
        'Real-time transaction monitoring dashboard: 200+ suspicious transactions detected per month.',
    },
    'Société Immobilière du Cameroun|2022-06': {
      poste: 'Project intern',
      description:
        'Field surveys and statistical data collection, analysis of trends and correlations, presentation of findings ' +
        'and recommendations to management.',
    },
    'AFEV Rouen|2024-10': {
      poste: 'Mentor (volunteer)',
      description: 'Mentoring a pupil through fun, educational activities to strengthen their skills.',
    },
    'Club informatique ESIGELEC|2024-11': {
      entreprise: 'ESIGELEC Computer Club',
      poste: 'Member',
      description:
        "Development of a web application managing ESIGELEC students' specialisation choices (submitting preferences, " +
        'tracking choices, administration), built with PHP and MySQL.',
    },
    'Club des Vikings|2026-10': {
      poste: 'Swimming (adult advanced training)',
      description:
        'Adult advanced swimming training: building endurance, consistency and the drive to excel at every session.',
    },
  },

  formations: {
    'ESIGELEC|2024-09': { diplome: "Engineering degree (Master's level) in Big Data for Digital Transformation" },
    'PrépaVogt|2022-09': { diplome: 'Preparatory classes for the French Grandes Écoles (MPSI)' },
  },

  certifications: {
    'Data Science et Machine Learning (MasterClass Python)': 'Data Science and Machine Learning (Python MasterClass)',
  },
  statuts: { obtenue: 'obtained', 'en cours': 'in progress' },

  langues: { Français: 'French', Anglais: 'English', Espagnol: 'Spanish', Allemand: 'German' },
  niveaux: {
    'langue maternelle': 'Native',
    'intermédiaire': 'intermediate',
    courant: 'fluent',
    'avancé': 'advanced',
    'débutant': 'beginner',
    bilingue: 'bilingual',
  },

  projets: {
    'gestion-bibliotheque-universitaire': {
      titre: 'University library management',
      contexte: 'Supplementary training project',
      description:
        'Automated loan management system built on a MySQL database, with a Power BI dashboard to track reading ' +
        'activity in real time.',
    },
    'analyse-bieres-artisanales': {
      titre: 'Data visualisation of US craft beers',
      contexte: 'Supplementary training project',
      description:
        'Exploration of the American craft beer market: distribution of styles, comparison of alcohol content (ABV) ' +
        'and bitterness (IBU), and mapping of breweries by state. Interactive Power BI dashboard (DAX modelling) ' +
        'with additional analyses in Python.',
    },
    'analyse-notes-films-fandango': {
      titre: 'Fandango movie rating bias',
      contexte: 'Capstone project (Introduction to Data Science)',
      description:
        'Exploratory analysis of Fandango movie ratings compared with other sites (Rotten Tomatoes, Metacritic, IMDb): ' +
        'correlations, KDE distributions of displayed versus actual ratings, and quantification of the gap between ' +
        'displayed stars and actual scores. Shows that Fandango overstates its displayed ratings.',
    },
    'prediction-prix-maison': {
      titre: 'House price prediction (Ames)',
      contexte: 'Personal project',
      description:
        'ElasticNet regression model predicting house sale prices on the Ames Housing dataset: data preparation ' +
        '(encoded categorical variables, standardisation), hyperparameter tuning with GridSearchCV and 5-fold ' +
        'cross-validation, evaluated with MAE and RMSE.',
      metriques: { mae: '≈ $15,560', rmse: '≈ $21,770', rmse_vs_prix_moyen: '12%' },
    },
  },

  metricLabels: {
    fidelisation: 'Customer retention',
    couts_marketing: 'Marketing costs',
    temps_analyse: 'Analysis time',
    transactions_suspectes_detectees: 'Suspicious transactions detected',
    bieres_analysees: 'Beers analysed',
    brasseries: 'Breweries',
    mae: 'MAE',
    rmse: 'RMSE',
    rmse_vs_prix_moyen: 'RMSE vs average price',
    combinaisons_testees: 'Combinations tested',
  },

  /** Seuls les noms qui changent en anglais (les autres : Python, Power BI, Git… restent identiques). */
  skills: {
    statistiques: 'Statistical analysis',
    etl: 'ETL & data pipelines',
    'agile-scrum': 'Agile / Scrum methods',
    'data-catalog': 'Data catalogue & documentation',
  },
}

/** Libellés des domaines de compétences (data/ : champ « domaine »). */
export const DOMAINES = {
  fr: {
    langages: 'Langages',
    bi: 'BI & data visualisation',
    'data-ia': 'Data & IA',
    'data-engineering': 'Data engineering',
    frameworks: 'Bibliothèques & frameworks',
    'bases-de-donnees': 'Bases de données',
    'developpement-web': 'Développement web',
    outils: 'Outils',
    'gestion-de-projet': 'Gestion de projet',
    autres: 'Autres',
  },
  en: {
    langages: 'Programming languages',
    bi: 'BI & data visualisation',
    'data-ia': 'Data & AI',
    'data-engineering': 'Data engineering',
    frameworks: 'Libraries & frameworks',
    'bases-de-donnees': 'Databases',
    'developpement-web': 'Web development',
    outils: 'Tools',
    'gestion-de-projet': 'Project management',
    autres: 'Other',
  },
}

/** Secteurs d'activité (libellés français produits par le moteur de FAQ -> anglais). */
const SECTEURS_EN = {
  'Transport et logistique': 'Transport & logistics',
  'Banque et finance': 'Banking & finance',
  'Tourisme et hôtellerie': 'Tourism & hospitality',
  'Éducation': 'Education',
  Immobilier: 'Real estate',
  Autre: 'Other',
}

const cleExperience = (e) => `${e?.entreprise}|${e?.debut}`
const cleFormation = (f) => `${f?.ecole}|${f?.debut}`

function niveauEn(niveau) {
  let texte = String(niveau ?? '')
  for (const [fr, en] of Object.entries(EN.niveaux)) {
    texte = texte.replace(new RegExp(fr, 'i'), en)
  }
  return texte
}

/**
 * Traducteur de données pour une langue : L.candidat(c), L.experience(e), L.projet(p), L.skill(slug, nom)…
 * En français, chaque fonction renvoie la donnée telle quelle (aucune copie inutile).
 */
export function localizer(lang = 'fr') {
  const en = lang === 'en'
  const L = {
    lang,

    titre: (titre) => (en ? EN.titre : titre),
    bio: (bio) => (en ? EN.bio : bio),

    experience(e) {
      if (!en || !e) return e
      const tr = EN.experiences[cleExperience(e)]
      return tr ? { ...e, ...tr } : e
    },
    formation(f) {
      if (!en || !f) return f
      const tr = EN.formations[cleFormation(f)]
      return tr ? { ...f, ...tr } : f
    },
    certification(c) {
      if (!en || !c) return c
      return { ...c, nom: EN.certifications[c.nom] || c.nom, statut: L.statut(c.statut) }
    },
    statut: (s) => (en ? EN.statuts[s] || s : s),
    langue(l) {
      if (!en || !l) return l
      return { ...l, langue: EN.langues[l.langue] || l.langue, niveau: niveauEn(l.niveau) }
    },

    /** Nom d'une compétence : traduction anglaise si elle existe, sinon le nom fourni, sinon le slug. */
    skill: (slug, nom) => (en && EN.skills[slug]) || nom || slug,
    domain: (key) => (DOMAINES[lang] || DOMAINES.fr)[key] || DOMAINES.fr[key] || key,
    sector: (label) => (en ? SECTEURS_EN[label] || label : label),

    projet(p) {
      if (!en || !p) return p
      const tr = EN.projets[p.projet_slug]
      const metriques =
        p.metriques &&
        Object.fromEntries(Object.entries(p.metriques).map(([k, v]) => [k, tr?.metriques?.[k] ?? L.metricValue(v)]))
      return {
        ...p,
        titre: tr?.titre ?? p.titre,
        contexte: tr?.contexte ?? p.contexte,
        description: tr?.description ?? p.description,
        ...(metriques ? { metriques } : {}),
      }
    },
    /** Titre d'un projet à partir de son slug (graphe Neo4j, projets similaires). */
    projetTitre: (slug, titre) => (en && EN.projets[slug]?.titre) || titre,

    metricLabel: (key) => (en ? EN.metricLabels[key] || humanizeKey(key, 'en') : humanizeKey(key, 'fr')),
    metricValue(value) {
      if (!en) return value
      if (typeof value === 'number') return value.toLocaleString('en-GB')
      return String(value).replace(/ \/ mois/g, ' / month').replace(/(\d) %/g, '$1%')
    },

    month: (v) => formatMonth(v, lang),
    period: (debut, fin) => formatPeriod(debut, fin, lang),

    /** Profil complet (titre, bio, expériences, formations, certifications, langues, noms des compétences). */
    candidat(c) {
      if (!en || !c) return c
      return {
        ...c,
        titre: EN.titre,
        bio: EN.bio,
        experiences: (c.experiences || []).map(L.experience),
        formations: (c.formations || []).map(L.formation),
        certifications: c.certifications && c.certifications.map(L.certification),
        langues: c.langues && c.langues.map(L.langue),
        competences: (c.competences || []).map((s) => ({ ...s, nom: L.skill(s.skill_slug, s.nom) })),
      }
    },
  }
  return L
}
