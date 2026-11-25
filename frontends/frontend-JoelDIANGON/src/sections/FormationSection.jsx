import { motion } from 'framer-motion'
import Timeline from '../components/Timeline'
import { CERTIFICATIONS } from '../content/static'
import { useLang, useT } from '../i18n/LangContext'
import { sortByDateDesc } from '../lib/format'
import { WithCandidat } from './shared'

const TEXTES = {
  fr: { diplomes: 'Diplômes', certifications: 'Certifications' },
  en: { diplomes: 'Degrees', certifications: 'Certifications' },
}

export default function FormationSection() {
  const t = useT(TEXTES)
  const { L } = useLang()

  return (
    <WithCandidat>
      {({ candidat, candidatFr }) => {
        const formations = sortByDateDesc(candidat.formations || [])
        // Certifications d'origine (en français) : le statut « en cours » choisit le style quelle que soit
        // la langue affichée ; nom et statut sont traduits au rendu.
        const certifications = candidatFr?.certifications || CERTIFICATIONS
        return (
          <div className="section-grid">
            <div>
              <p className="eyebrow">{t('diplomes')}</p>
              <Timeline
                items={formations.map((f, i) => ({
                  key: `${f.ecole}-${i}`,
                  period: L.period(f.debut, f.fin),
                  title: f.diplome,
                  org: f.ecole,
                }))}
              />
            </div>
            <aside>
              <p className="eyebrow">{t('certifications')}</p>
              <ul className="cert-list">
                {certifications.map((c, i) => {
                  const cert = L.certification(c)
                  return (
                    <motion.li
                      key={c.nom}
                      className="cert"
                      initial={{ opacity: 0, x: 12 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.4 + i * 0.1 }}
                    >
                      <span className={`cert-status cert-status--${c.statut === 'en cours' ? 'progress' : 'done'}`}>
                        {cert.statut}
                      </span>
                      <span className="cert-name">{cert.nom}</span>
                    </motion.li>
                  )
                })}
              </ul>
            </aside>
          </div>
        )
      }}
    </WithCandidat>
  )
}
