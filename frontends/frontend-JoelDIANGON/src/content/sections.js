/**
 * Les éléments flottants de la scène : une entrée = un objet cliquable = une section.
 * `pos` : position dans la scène (en % de la largeur/hauteur), de gauche à droite le long
 * de l'arc du parcours. Projets est au centre (`hero`), face au personnage.
 * `label` / `tagline` : textes français ; `en` : leur version anglaise. À l'affichage, passer par
 * sectionText(section, lang) qui choisit la bonne langue.
 * La chronologie complète est une page à part : la version classique (#/portfolio).
 */
import {
  AssociatifIcon,
  CompetencesIcon,
  ContactIcon,
  ExperiencesIcon,
  FormationIcon,
  LanguesIcon,
  ProjetsIcon,
} from '../components/icons'

export const SECTIONS = [
  {
    id: 'formation',
    label: 'Formation',
    tagline: 'Parcours académique',
    en: { label: 'Education', tagline: 'Academic background' },
    Icon: FormationIcon,
    pos: { x: 15, y: 53 },
  },
  {
    id: 'experiences',
    label: 'Expériences',
    tagline: 'Parcours professionnel',
    en: { label: 'Experience', tagline: 'Professional background' },
    Icon: ExperiencesIcon,
    pos: { x: 25.5, y: 35 },
  },
  {
    id: 'competences',
    label: 'Compétences',
    tagline: 'Graphe de compétences',
    en: { label: 'Skills', tagline: 'Skills graph' },
    Icon: CompetencesIcon,
    pos: { x: 38, y: 23.5 },
  },
  {
    id: 'projets',
    label: 'Projets',
    tagline: 'Réalisations data & IA',
    en: { label: 'Projects', tagline: 'Data & AI work' },
    Icon: ProjetsIcon,
    pos: { x: 50, y: 19 },
    hero: true,
  },
  {
    id: 'associatif',
    label: 'Associatif',
    tagline: 'Engagement',
    en: { label: 'Community', tagline: 'Involvement' },
    Icon: AssociatifIcon,
    pos: { x: 62, y: 23.5 },
  },
  {
    id: 'langues',
    label: 'Langues',
    tagline: 'Communication',
    en: { label: 'Languages', tagline: 'Communication' },
    Icon: LanguesIcon,
    pos: { x: 74.5, y: 35 },
  },
  {
    id: 'contact',
    label: 'Contact',
    tagline: 'Échangeons',
    en: { label: 'Contact', tagline: "Let's talk" },
    Icon: ContactIcon,
    pos: { x: 85, y: 53 },
  },
]

export const SECTION_BY_ID = Object.fromEntries(SECTIONS.map((s) => [s.id, s]))

/** Libellé et accroche d'une section dans la langue du site : sectionText(section, 'en') -> { label, tagline }. */
export function sectionText(section, lang = 'fr') {
  const traduction = lang === 'en' ? section?.en : null
  return {
    label: traduction?.label ?? section?.label ?? '',
    tagline: traduction?.tagline ?? section?.tagline ?? '',
  }
}
