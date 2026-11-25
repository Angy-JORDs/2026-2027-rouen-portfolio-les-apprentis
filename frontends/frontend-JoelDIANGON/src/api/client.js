/**
 * Accès à l'API d'équipe : une fonction par route de API_ROUTES.md utilisée par ce frontend.
 * Les routes listant d'autres candidats (GET /api/candidats, R6) ne sont volontairement pas utilisées :
 * ce portfolio est personnel.
 */
import { API_URL, CANDIDAT_SLUG } from '../config'

/**
 * Erreur d'appel à l'API. `code` est stable et sert à afficher un message traduit (voir ui/States.jsx) :
 *   'unreachable' : API injoignable (réseau, serveur éteint) ; 'server' : erreur 5xx ;
 *   'notFound' : 404 ; 'http' : tout autre statut en erreur.
 * `message` (en français) reste l'indication technique d'origine, utile en développement.
 */
export class ApiError extends Error {
  constructor(message, status, code = 'http') {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
  }
}

/** Code stable d'un statut HTTP en erreur. */
function codeFromStatus(status) {
  if (status === 404) return 'notFound'
  if (status >= 500) return 'server'
  return 'http'
}

async function get(path, params = {}) {
  const url = new URL(API_URL + path)
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== '') url.searchParams.set(key, value)
  }

  let response
  try {
    response = await fetch(url, { headers: { Accept: 'application/json' } })
  } catch {
    // En ligne, un message neutre pour le visiteur ; en local, l'indication utile au développeur.
    throw new ApiError(
      import.meta.env.DEV
        ? `API injoignable (${API_URL}). Lancez « just dev » à la racine du dépôt.`
        : 'Données momentanément indisponibles. Réessayez dans quelques instants.',
      0,
      'unreachable',
    )
  }

  // Panne côté serveur (base indisponible…) : pas de détail technique pour le visiteur en ligne.
  if (response.status >= 500 && !import.meta.env.DEV) {
    throw new ApiError(
      'Données momentanément indisponibles. Réessayez dans quelques instants.',
      response.status,
      'server',
    )
  }

  if (!response.ok) {
    let detail = response.statusText
    try {
      detail = (await response.json()).detail || detail
    } catch {
      /* corps non JSON : on garde le statut HTTP */
    }
    throw new ApiError(detail, response.status, codeFromStatus(response.status))
  }
  return response.json()
}

const enc = encodeURIComponent

export const api = {
  /** R1 : profil, expériences, formations, compétences déclarées, timeline. */
  candidat: (slug = CANDIDAT_SLUG) => get(`/api/candidats/${enc(slug)}`),

  /** R2 : projets du candidat, filtrables par compétence (pagination large : un portfolio a peu de projets). */
  projets: ({ competence, page = 1, size = 100 } = {}, slug = CANDIDAT_SLUG) =>
    get(`/api/candidats/${enc(slug)}/projets`, { competence, page, size }),

  /** R3 : nombre de projets par compétence (agrégation MongoDB). */
  stats: (slug = CANDIDAT_SLUG) => get(`/api/candidats/${enc(slug)}/stats`),

  /** R4 : projets similaires (compétences partagées, Neo4j). */
  similaires: (projetSlug, limit = 6) => get(`/api/graph/projets/${enc(projetSlug)}/similaires`, { limit }),

  /** R5 : graphe Candidat → Projets → Compétences, prêt à afficher. */
  graphe: (slug = CANDIDAT_SLUG) => get(`/api/graph/competences/${enc(slug)}`),

  /** R8 : fiche détaillée d'un projet. */
  projet: (projetSlug) => get(`/api/projets/${enc(projetSlug)}`),
}
