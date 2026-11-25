const MOIS = {
  fr: ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'],
  en: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
}
const AUJOURDHUI = { fr: 'aujourd’hui', en: 'present' }

/** "2025-10" -> "oct. 2025" (fr) / "Oct 2025" (en) ; "2024" -> "2024" ; vide -> null */
export function formatMonth(value, lang = 'fr') {
  if (!value) return null
  const [year, month] = String(value).split('-')
  if (!month) return year
  return `${(MOIS[lang] || MOIS.fr)[Number(month) - 1] ?? month} ${year}`
}

/**
 * Période lisible : "oct. 2025 - aujourd'hui", "déc. 2024 - févr. 2025", "août 2025" ;
 * en anglais "Oct 2025 - present". Séparateur : tiret court (jamais de tiret long).
 */
export function formatPeriod(debut, fin, lang = 'fr') {
  const start = formatMonth(debut, lang)
  const end = fin ? formatMonth(fin, lang) : null
  if (start && end) return start === end ? start : `${start} - ${end}`
  if (start) return `${start} - ${AUJOURDHUI[lang] || AUJOURDHUI.fr}`
  return end || ''
}

/** Tri du plus récent au plus ancien sur un champ "AAAA-MM" (valeur absente en dernier). */
export function sortByDateDesc(items, field = 'debut') {
  return [...items].sort((a, b) => String(b[field] || '').localeCompare(String(a[field] || '')))
}

const SIGLES = new Set(['mae', 'rmse', 'mse', 'r2', 'kpi', 'kpis', 'ci', 'api', 'roi', 'auc', 'etl'])

// Les clés des données sont écrites sans accents (identifiants techniques) : on les rétablit à l'affichage.
const ACCENTS = {
  fidelisation: 'fidélisation',
  couts: 'coûts',
  bieres: 'bières',
  analysees: 'analysées',
  testees: 'testées',
  detectees: 'détectées',
  analyse: 'd’analyse',
  donnees: 'données',
  precision: 'précision',
  reduction: 'réduction',
  economie: 'économie',
  economies: 'économies',
  delai: 'délai',
  delais: 'délais',
  qualite: 'qualité',
}

/**
 * "rmse_vs_prix_moyen" -> "RMSE vs prix moyen" ; "couts_marketing" -> "Coûts marketing".
 * lang = 'en' : simple mise en forme sans accents (les vraies traductions sont dans src/i18n/content.js).
 */
export function humanizeKey(key, lang = 'fr') {
  const words = String(key)
    .replace(/_/g, ' ')
    .trim()
    .split(/\s+/)
    .map((w, i) => {
      if (SIGLES.has(w.toLowerCase())) return w.toUpperCase()
      if (lang === 'en') return w
      // « analyse » seul en tête reste « Analyse » ; après un nom (« temps analyse ») il devient « d’analyse »
      if (w === 'analyse' && i === 0) return w
      return ACCENTS[w.toLowerCase()] ?? w
    })
  const text = words.join(' ')
  return text.charAt(0).toUpperCase() + text.slice(1)
}

export function truncate(text, max) {
  if (!text || text.length <= max) return text
  return `${text.slice(0, max).replace(/\s+\S*$/, '')}…`
}
