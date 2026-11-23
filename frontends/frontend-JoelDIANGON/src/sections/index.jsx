import CompetencesSection from './CompetencesSection'
import ContactSection from './ContactSection'
import ExperiencesSection from './ExperiencesSection'
import FormationSection from './FormationSection'
import LanguesSection from './LanguesSection'
import ProjetsSection from './ProjetsSection'

function AssociatifSection(props) {
  return <ExperiencesSection {...props} associatives />
}

/** id de section (content/sections.js) -> composant affiché dans le panneau. */
export const SECTION_COMPONENTS = {
  formation: FormationSection,
  experiences: ExperiencesSection,
  competences: CompetencesSection,
  projets: ProjetsSection,
  associatif: AssociatifSection,
  langues: LanguesSection,
  contact: ContactSection,
}
