import Timeline from '../components/Timeline'
import { Source } from '../components/ui/States'
import { formatPeriod } from '../lib/format'
import { WithCandidat } from './shared'

/** Profil & Parcours : bio + chronologie complète (timeline fusionnée par l'API). */
export default function ParcoursSection() {
  return (
    <WithCandidat>
      {({ candidat }) => (
        <div className="section-grid section-grid--profil">
          <aside className="profil-card">
            <p className="eyebrow">Profil</p>
            <h3 className="profil-name">
              {candidat.prenom} {candidat.nom}
            </h3>
            {candidat.titre && <p className="profil-role">{candidat.titre}</p>}
            {candidat.bio && <p className="profil-bio">{candidat.bio}</p>}
          </aside>
          <div>
            <p className="eyebrow">Chronologie</p>
            <Timeline
              items={(candidat.timeline || []).map((t, i) => ({
                key: `${t.type}-${i}`,
                period: formatPeriod(t.debut, t.fin),
                title: t.titre,
                org: t.organisation,
                description: t.description,
                badge: t.type === 'formation' ? 'Formation' : 'Expérience',
              }))}
            />
            <Source>MongoDB · GET /api/candidats/{candidat.candidat_slug} (R1)</Source>
          </div>
        </div>
      )}
    </WithCandidat>
  )
}
