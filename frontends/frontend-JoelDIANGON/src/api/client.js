/**
 * Accès à l'API d'équipe : une fonction par route de API_ROUTES.md utilisée par ce frontend.
 * Les routes listant d'autres candidats (GET /api/candidats, R6) ne sont volontairement pas utilisées :
 * ce portfolio est personnel.
 */
import { API_URL, CANDIDAT_SLUG } from '../config'

export class ApiError extends Error {
  constructor(message, status) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
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
    throw new ApiError(`API injoignable (${API_URL}). Lancez « just dev » à la racine du dépôt.`, 0)
  }

  if (!response.ok) {
    let detail = response.statusText
    try {
      detail = (await response.json()).detail || detail
    } catch {
      /* corps non JSON : on garde le statut HTTP */
    }
    throw new ApiError(detail, response.status)
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
