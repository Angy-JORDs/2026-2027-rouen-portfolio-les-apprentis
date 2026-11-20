import { motion } from 'framer-motion'
import Timeline from '../components/Timeline'
import { Source } from '../components/ui/States'
import { CERTIFICATIONS } from '../content/static'
import { formatPeriod, sortByDateDesc } from '../lib/format'
import { WithCandidat } from './shared'

export default function FormationSection() {
  return (
    <WithCandidat>
      {({ candidat }) => {
        const formations = sortByDateDesc(candidat.formations || [])
        const certifications = candidat.certifications || CERTIFICATIONS
        return (
          <div className="section-grid">
            <div>
              <p className="eyebrow">Diplômes</p>
              <Timeline
                items={formations.map((f, i) => ({
                  key: `${f.ecole}-${i}`,
                  period: formatPeriod(f.debut, f.fin),
                  title: f.diplome,
                  org: f.ecole,
                }))}
              />
              <Source>MongoDB · GET /api/candidats/{candidat.candidat_slug} (R1)</Source>
            </div>
            <aside>
              <p className="eyebrow">Certifications</p>
              <ul className="cert-list">
                {certifications.map((c, i) => (
                  <motion.li
                    key={c.nom}
                    className="cert"
                    initial={{ opacity: 0, x: 12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 + i * 0.1 }}
                  >
                    <span className={`cert-status cert-status--${c.statut === 'en cours' ? 'progress' : 'done'}`}>
                      {c.statut}
                    </span>
                    <span className="cert-name">{c.nom}</span>
                  </motion.li>
                ))}
              </ul>
            </aside>
          </div>
        )
      }}
    </WithCandidat>
  )
}
