import Timeline from '../components/Timeline'
import { isAssociatif } from '../content/static'
import { useLang, useT } from '../i18n/LangContext'
import { sortByDateDesc } from '../lib/format'
import { WithCandidat, skillTags } from './shared'

const TEXTES = {
  fr: { vide: 'Aucune expérience à afficher pour le moment.' },
  en: { vide: 'No experience to show yet.' },
}

/**
 * Expériences professionnelles (associatives = false) ou engagement associatif (true).
 * Une seule source : candidat.experiences (R1), répartie selon l'organisation.
 */
export default function ExperiencesSection({ associatives = false }) {
  const t = useT(TEXTES)
  const { L } = useLang()

  return (
    <WithCandidat>
      {({ candidat, candidatFr, skillName }) => {
        // Répartition et tri sur la donnée d'origine (en français) : le résultat ne dépend pas de la langue
        // affichée, et les clés restent stables quand on change de langue. Traduction au rendu.
        const experiences = sortByDateDesc(
          ((candidatFr || candidat).experiences || []).filter((e) => isAssociatif(e) === associatives),
        )
        if (!experiences.length) {
          return <p className="empty">{t('vide')}</p>
        }
        return (
          <div className="section-narrow">
            <Timeline
              items={experiences.map((origine, i) => {
                const e = L.experience(origine)
                return {
                  key: `${origine.entreprise}-${i}`,
                  period: L.period(e.debut, e.fin),
                  title: e.poste,
                  org: e.entreprise,
                  description: e.description,
                  tags: skillTags(e.competences, skillName),
                }
              })}
            />
          </div>
        )
      }}
    </WithCandidat>
  )
}
