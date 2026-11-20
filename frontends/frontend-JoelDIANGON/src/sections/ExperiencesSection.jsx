import Timeline from '../components/Timeline'
import { Source } from '../components/ui/States'
import { isAssociatif } from '../content/static'
import { formatPeriod, sortByDateDesc } from '../lib/format'
import { WithCandidat, skillTags } from './shared'

/**
 * Expériences professionnelles (associatives = false) ou engagement associatif (true).
 * Une seule source : candidat.experiences (R1), répartie selon l'organisation.
 */
export default function ExperiencesSection({ associatives = false }) {
  return (
    <WithCandidat>
      {({ candidat, skillName }) => {
        const experiences = sortByDateDesc(
          (candidat.experiences || []).filter((e) => isAssociatif(e) === associatives),
        )
        if (!experiences.length) {
          return <p className="empty">Aucune expérience à afficher pour le moment.</p>
        }
        return (
          <div className="section-narrow">
            <Timeline
              items={experiences.map((e, i) => ({
                key: `${e.entreprise}-${i}`,
                period: formatPeriod(e.debut, e.fin),
                title: e.poste,
                org: e.entreprise,
                description: e.description,
                tags: skillTags(e.competences, skillName),
              }))}
            />
            <Source>MongoDB · GET /api/candidats/{candidat.candidat_slug} (R1)</Source>
          </div>
        )
      }}
    </WithCandidat>
  )
}
