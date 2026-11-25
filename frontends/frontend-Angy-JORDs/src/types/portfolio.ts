export interface Experience {
  entreprise: string;
  poste: string;
  debut: string | null;
  fin: string | null;
  description: string | null;
  competences: string[];
  lieu?: string;
  type?: string;
}

export interface Formation {
  ecole: string;
  diplome: string;
  debut: string | null;
  fin: string | null;
  details?: string;
}

export interface Competence {
  skill_slug: string;
  nom: string;
  domaine: string | null;
  niveau: number | null;
}

export interface TimelineItem {
  type: 'experience' | 'formation';
  titre: string;
  organisation: string;
  debut: string | null;
  fin: string | null;
  description: string | null;
}

export interface CandidatProfile {
  candidat_slug: string;
  prenom: string;
  nom: string;
  titre: string;
  bio: string;
  localisation: string;
  disponibilite: string;
  rythme: string;
  telephone: string;
  email: string;
  permis: string;
  liens: {
    github: string;
    linkedin: string;
    email?: string;
  };
  experiences: Experience[];
  formations: Formation[];
  competences: Competence[];
  timeline?: TimelineItem[];
  certifications: {
    titre: string;
    organisme: string;
    annee?: string;
  }[];
  langues: {
    langue: string;
    niveau: string;
  }[];
  softSkills: string[];
  centresInteret: {
    nom: string;
    description: string;
  }[];
}

export interface Projet {
  projet_slug: string;
  candidat_slugs: string[];
  titre: string;
  categorie: 'Data Science & ML' | 'Big Data & Engineering' | 'Business Intelligence';
  contexte: string;
  problematique: string;
  description: string;
  methodologie: string[];
  resultats: string[];
  date_debut: string | null;
  date_fin: string | null;
  competences: string[];
  metriques: Record<string, string | number>;
  liens: {
    github?: string;
    demo?: string;
  };
  images: string[];
}

export interface StatCompetence {
  skill_slug: string;
  nom: string;
  domaine: string | null;
  niveau: number | null;
  nombre_projets: number;
}

export interface SimilarProjet {
  projet_slug: string;
  titre: string;
  competences_communes: number;
  competences: string[];
}

export interface GraphNode {
  id: string;
  type: 'candidat' | 'projet' | 'competence';
  slug: string;
  label: string;
}

export interface GraphLink {
  source: string;
  target: string;
  type: 'REALISE' | 'UTILISE';
}

export interface GraphData {
  nodes: GraphNode[];
  links: GraphLink[];
}

export interface Page<T> { items: T[]; total: number; page: number; size: number; }
export interface DbHealth { status: 'ok' | 'degraded'; mongo: string; neo4j: string; }
export interface CompetenceCandidats { skill_slug: string; nom: string; candidats: { candidat_slug: string; prenom: string; nom: string; nb_projets: number }[]; }
export interface CompetenceProjets { skill_slug: string; nom: string; projets: Projet[]; }
