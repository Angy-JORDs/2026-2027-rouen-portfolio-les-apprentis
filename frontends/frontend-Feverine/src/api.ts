const BASE = `${(import.meta.env.VITE_API_URL as string | undefined) ?? ""}/api`;

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${BASE}${path}`, init);
  } catch {
    throw new ApiError(0, "Impossible de joindre l'API. Le backend est-il lancé sur le port 8000 ?");
  }
  if (!res.ok) {
    let detail = `${res.status} ${res.statusText}`;
    try {
      const body = await res.json();
      if (typeof body?.detail === "string") detail = body.detail;
    } catch {
      /* corps non JSON */
    }
    throw new ApiError(res.status, detail);
  }
  return res.status === 204 ? (undefined as T) : ((await res.json()) as T);
}

export const get = <T>(path: string) => request<T>(path);
export const del = (path: string) => request<void>(path, { method: "DELETE" });

/** Construit une query string en ignorant les valeurs vides. */
export function qs(params: Record<string, string | number | undefined | null>): string {
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && v !== "") p.set(k, String(v));
  }
  const s = p.toString();
  return s ? `?${s}` : "";
}

const enc = encodeURIComponent;

export const api = {
  candidats: (page = 1, size = 12) => get<import("./types").Page<import("./types").CandidatSummary>>(`/candidats${qs({ page, size })}`),
  candidat: (slug: string) => get<import("./types").Candidat>(`/candidats/${enc(slug)}`),
  candidatProjets: (slug: string, competence?: string, page = 1, size = 6) =>
    get<import("./types").Page<import("./types").Projet>>(`/candidats/${enc(slug)}/projets${qs({ competence, page, size })}`),
  candidatStats: (slug: string) => get<import("./types").Stats>(`/candidats/${enc(slug)}/stats`),
  projets: (competence?: string, page = 1, size = 9) =>
    get<import("./types").Page<import("./types").Projet>>(`/projets${qs({ competence, page, size })}`),
  projet: (slug: string) => get<import("./types").Projet>(`/projets/${enc(slug)}`),
  supprimerProjet: (slug: string) => del(`/projets/${enc(slug)}`),
  similaires: (slug: string, limit = 5) =>
    get<import("./types").Similaires>(`/graph/projets/${enc(slug)}/similaires${qs({ limit })}`),
  grapheCompetence: (slug: string) => get<import("./types").Graph>(`/graph/competences/${enc(slug)}`),
  competenceCandidats: (slug: string) =>
    get<import("./types").CompetenceCandidats>(`/competences/${enc(slug)}/candidats`),
  competenceProjets: (slug: string) =>
    get<import("./types").CompetenceProjets>(`/competences/${enc(slug)}/projets`),
  santeDb: () => get<import("./types").DbHealth>(`/health/db`),
};
