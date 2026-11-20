/**
 * Les éléments flottants de la scène : une entrée = un objet cliquable = une section.
 * `pos` : position dans la scène (en % de la largeur/hauteur), de gauche à droite le long
 * de l'arc du parcours. Projets est au centre (`hero`), face au garçon.
 */
import {
  BookIcon,
  BriefcaseIcon,
  CollabIcon,
  EnvelopeIcon,
  GlobeIcon,
  ModulesIcon,
  SphereIcon,
  TimelineIcon,
} from '../components/icons'

export const SECTIONS = [
  { id: 'formation', label: 'Formation', tagline: 'Parcours académique', Icon: BookIcon, pos: { x: 15, y: 53 } },
  { id: 'experiences', label: 'Expériences', tagline: 'Parcours professionnel', Icon: BriefcaseIcon, pos: { x: 25.5, y: 35 } },
  { id: 'competences', label: 'Compétences', tagline: 'Graphe de compétences', Icon: ModulesIcon, pos: { x: 38, y: 23.5 } },
  { id: 'projets', label: 'Projets', tagline: 'Réalisations data & IA', Icon: SphereIcon, pos: { x: 50, y: 19 }, hero: true },
  { id: 'associatif', label: 'Associatif', tagline: 'Engagement', Icon: CollabIcon, pos: { x: 62, y: 23.5 } },
  { id: 'langues', label: 'Langues', tagline: 'Communication', Icon: GlobeIcon, pos: { x: 74.5, y: 35 } },
  { id: 'contact', label: 'Contact', tagline: 'Échangeons', Icon: EnvelopeIcon, pos: { x: 85, y: 53 } },
]

/** Accessible depuis le titre « Mon parcours » et la navigation (pas d'objet dans la scène). */
export const PARCOURS = { id: 'parcours', label: 'Mon parcours', tagline: 'Profil & chronologie', Icon: TimelineIcon }

export const ALL_SECTIONS = [PARCOURS, ...SECTIONS]
export const SECTION_BY_ID = Object.fromEntries(ALL_SECTIONS.map((s) => [s.id, s]))
