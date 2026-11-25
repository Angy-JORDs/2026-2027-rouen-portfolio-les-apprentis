import { Competence, Experience } from '../types/portfolio';

/** "Power BI & DAX" -> "powerbidax" (minuscules, sans accents ni séparateurs) */
const norm = (s: string) =>
  s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9+#]+/g, '');

/** Slug stable d'une expérience, utilisé dans l'URL : /experiences?exp=<slug> */
export const expSlug = (e: Pick<Experience, 'entreprise' | 'debut'>) =>
  `${e.entreprise}-${e.debut}`
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

/**
 * Une étiquette d'expérience (ex: "Power BI") correspond-elle à une compétence ?
 * - égalité sur le nom ou le slug
 * - ou inclusion ("Power BI" ↔ "Power BI & DAX"), seulement si l'étiquette fait ≥ 3 caractères
 *   pour éviter les faux positifs ("R", "C").
 */
export const skillMatches = (label: string, skill: Pick<Competence, 'nom' | 'skill_slug'>) => {
  const l = norm(label);
  const n = norm(skill.nom);
  if (!l) return false;
  if (l === n || l === norm(skill.skill_slug)) return true;
  return l.length >= 3 && (n.startsWith(l) || l.startsWith(n));
};

export const resolveSkill = <T extends Pick<Competence, 'nom' | 'skill_slug'>>(label: string, skills: T[]) =>
  skills.find((s) => skillMatches(label, s));
