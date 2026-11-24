/**
 * Les éléments flottants de la scène : une entrée = un objet cliquable = une section.
 * `pos` : position dans la scène (en % de la largeur/hauteur), de gauche à droite le long
 * de l'arc du parcours. Projets est au centre (`hero`), face au personnage.
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
  { id: 'formation', label: 'Formation', tagline: 'Parcours académique', Icon: FormationIcon, pos: { x: 15, y: 53 } },
  { id: 'experiences', label: 'Expériences', tagline: 'Parcours professionnel', Icon: ExperiencesIcon, pos: { x: 25.5, y: 35 } },
  { id: 'competences', label: 'Compétences', tagline: 'Graphe de compétences', Icon: CompetencesIcon, pos: { x: 38, y: 23.5 } },
  { id: 'projets', label: 'Projets', tagline: 'Réalisations data & IA', Icon: ProjetsIcon, pos: { x: 50, y: 19 }, hero: true },
  { id: 'associatif', label: 'Associatif', tagline: 'Engagement', Icon: AssociatifIcon, pos: { x: 62, y: 23.5 } },
  { id: 'langues', label: 'Langues', tagline: 'Communication', Icon: LanguesIcon, pos: { x: 74.5, y: 35 } },
  { id: 'contact', label: 'Contact', tagline: 'Échangeons', Icon: ContactIcon, pos: { x: 85, y: 53 } },
]

export const SECTION_BY_ID = Object.fromEntries(SECTIONS.map((s) => [s.id, s]))
