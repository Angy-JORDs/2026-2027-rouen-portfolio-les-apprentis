import { CANDIDAT_DATA } from '../data/candidatData';
import { PROJETS_DATA } from '../data/projetsData';
import type { CandidatProfile, CompetenceCandidats, CompetenceProjets, DbHealth, GraphData, Projet, SimilarProjet, StatCompetence, Page } from '../types/portfolio';

// Le navigateur ne se connecte JAMAIS directement à MongoDB ou Neo4j.
// Les connexions et identifiants restent côté FastAPI, configurés dans le .env du backend.
const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000').replace(/\/$/, '');
const CANDIDAT_SLUG = import.meta.env.VITE_CANDIDAT_SLUG || 'ange-tonlio';
const REQUEST_TIMEOUT = 8000;

async function request<T>(path: string): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, { signal: AbortSignal.timeout(REQUEST_TIMEOUT) });
  if (!response.ok) {
    let detail = `${response.status} ${response.statusText}`;
    try { const body = await response.json(); detail = body.detail || detail; } catch { /* réponse non JSON */ }
    throw new Error(detail);
  }
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

function enrichProject(item: Partial<Projet>): Projet {
  const local = PROJETS_DATA.find(p => p.projet_slug === item.projet_slug);
  return {
    ...(local || {} as Projet), ...item,
    competences: item.competences ?? local?.competences ?? [],
    metriques: item.metriques ?? local?.metriques ?? {},
    liens: { ...(local?.liens || {}), ...(item.liens || {}) },
    images: item.images ?? local?.images ?? [],
    methodologie: item.methodologie ?? local?.methodologie ?? [],
    resultats: item.resultats ?? local?.resultats ?? [],
    categorie: item.categorie ?? local?.categorie ?? 'Big Data & Engineering',
    problematique: item.problematique ?? local?.problematique ?? item.description ?? '',
  } as Projet;
}

export const portfolioApi = {
  baseUrl: API_BASE_URL,
  candidatSlug: CANDIDAT_SLUG,
  getHealth: () => request<{status:string}>('/api/health'),
  getDatabaseHealth: () => request<DbHealth>('/api/health/db'),
  listCandidats: (page=1, size=20) => request<Page<Record<string, unknown>>>(`/api/candidats?page=${page}&size=${size}`),
  async getCandidatProfile() {
    const data = await request<CandidatProfile>(`/api/candidats/${CANDIDAT_SLUG}`);
    return { ...CANDIDAT_DATA, ...data, liens: { ...CANDIDAT_DATA.liens, ...(data.liens || {}) } };
  },
  getProjets: async (competence?:string, page=1, size=100) => {
    const params = new URLSearchParams({page:String(page), size:String(size)});
    if (competence) params.set('competence', competence);
    const result = await request<Page<Projet>>(`/api/candidats/${CANDIDAT_SLUG}/projets?${params}`);
    return { ...result, items: result.items.map(enrichProject) };
  },
  getAllProjets: (competence?:string, page=1, size=100) => {
    const params = new URLSearchParams({page:String(page), size:String(size)});
    if (competence) params.set('competence', competence);
    return request<Page<Projet>>(`/api/projets?${params}`).then(result=>({...result,items:result.items.map(enrichProject)}));
  },
  getProjetBySlug: async (slug:string) => enrichProject(await request<Projet>(`/api/projets/${slug}`)),
  getStatsCompetences: async () => (await request<{competences:StatCompetence[]}>(`/api/candidats/${CANDIDAT_SLUG}/stats`)).competences,
  getSimilarProjets: async (slug:string, limit=5) => (await request<{similaires:SimilarProjet[]}>(`/api/graph/projets/${slug}/similaires?limit=${limit}`)).similaires,
  getKnowledgeGraph: () => request<GraphData>(`/api/graph/competences/${CANDIDAT_SLUG}`),
  getCandidatsByCompetence: (slug:string) => request<CompetenceCandidats>(`/api/competences/${slug}/candidats`),
  getProjetsByCompetence: async (slug:string) => { const result=await request<CompetenceProjets>(`/api/competences/${slug}/projets`); return {...result,projets:result.projets.map(enrichProject)}; },
};

// Données de secours utilisées uniquement si l'API est inaccessible.
export const localFallback = { candidat: CANDIDAT_DATA, projets: PROJETS_DATA };
