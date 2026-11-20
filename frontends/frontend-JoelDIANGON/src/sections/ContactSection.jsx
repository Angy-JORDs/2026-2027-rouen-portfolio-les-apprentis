import { motion } from 'framer-motion'
import { ExternalIcon, GithubIcon, LinkedinIcon } from '../components/icons'
import { Source } from '../components/ui/States'
import { WithCandidat } from './shared'

const RESEAUX = {
  linkedin: { label: 'LinkedIn', detail: 'Parcours, recommandations, messages', Icon: LinkedinIcon },
  github: { label: 'GitHub', detail: 'Code des projets et notebooks', Icon: GithubIcon },
}

export default function ContactSection() {
  return (
    <WithCandidat>
      {({ candidat }) => {
        const liens = Object.entries(candidat.liens || {}).filter(([, url]) => url)
        return (
          <div className="section-narrow contact">
            <p className="contact-lead">
              Ouvert aux échanges autour de la <em>data</em>, de la <em>business intelligence</em> et de l’
              <em>intelligence artificielle</em> appliquées à la supply chain et à la finance.
            </p>
            <ul className="contact-links">
              {liens.map(([cle, url], i) => {
                const reseau = RESEAUX[cle] || { label: cle, detail: url, Icon: ExternalIcon }
                return (
                  <motion.li
                    key={cle}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 + i * 0.1 }}
                  >
                    <a className="contact-link" href={url} target="_blank" rel="noreferrer">
                      <reseau.Icon className="contact-icon" />
                      <span className="contact-body">
                        <span className="contact-label">{reseau.label}</span>
                        <span className="contact-detail">{reseau.detail}</span>
                      </span>
                      <ExternalIcon className="contact-arrow" />
                    </a>
                  </motion.li>
                )
              })}
            </ul>
            <Source>MongoDB · GET /api/candidats/{candidat.candidat_slug} (R1, champ liens)</Source>
          </div>
        )
      }}
    </WithCandidat>
  )
}
