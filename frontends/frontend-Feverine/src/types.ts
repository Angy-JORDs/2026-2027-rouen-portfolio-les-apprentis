// Types alignés sur backend/src/portfolio_api/models/schemas.py (cf. API_ROUTES.md)

export type Page<T> = { items: T[]; total: number; page: number; size: number };

export type Experience = {
  entreprise: string;
  poste: string;
  debut: string | null;
  fin: string | null;
  description: string | null;
  competences: string[];
};

export type Formation = {
  ecole: string;
  diplome: string;
  debut: string | null;
  fin: string | null;
};

export type Competence = {
  skill_slug: string;
  nom: string;
  domaine: string | null;
  niveau: number | null;
};

export type TimelineItem = {
  type: "experience" | "formation";
  titre: string;
  organisation: string;
  debut: string | null;
  fin: string | null;
  description: string | null;
};

export type CandidatSummary = {
  candidat_slug: string;
  prenom: string;
  nom: string;
  titre: string | null;
};

export type Candidat = CandidatSummary & {
  bio: string | null;
  liens: Record<string, string>;
  experiences: Experience[];
  formations: Formation[];
  competences: Competence[];
  timeline: TimelineItem[];
};

export type Projet = {
  projet_slug: string;
  candidat_slugs: string[];
  titre: string;
  contexte: string | null;
  description: string | null;
  date_debut: string | null;
  date_fin: string | null;
  competences: string[];
  metriques: Record<string, unknown>;
  liens: Record<string, string>;
  images: string[];
};

export type StatCompetence = Competence & { nombre_projets: number };

export type Stats = {
  candidat_slug: string;
  total_projets: number;
  competences: StatCompetence[];
};

export type SimilarProjet = {
  projet_slug: string;
  titre: string;
  competences_communes: number;
  competences: string[];
};

export type Similaires = { projet_slug: string; similaires: SimilarProjet[] };

export type GraphNode = {
  id: string;
  type: "candidat" | "projet" | "competence";
  slug: string;
  label: string;
};

export type GraphLink = { source: string; target: string; type: "REALISE" | "UTILISE" };

export type Graph = { nodes: GraphNode[]; links: GraphLink[] };

export type CompetenceCandidats = {
  skill_slug: string;
  nom: string;
  candidats: { candidat_slug: string; prenom: string; nom: string; nb_projets: number }[];
};

export type CompetenceProjets = { skill_slug: string; nom: string; projets: Projet[] };

export type DbHealth = { status: "ok" | "degraded"; mongo: string; neo4j: string };
