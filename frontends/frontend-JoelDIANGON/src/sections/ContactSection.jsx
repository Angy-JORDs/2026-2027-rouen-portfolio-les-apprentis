import { motion } from 'framer-motion'
import { useCvViewer } from '../components/cv/CvViewer'
import { ArrowRightIcon, ContactIcon, CvIcon, ExternalIcon, GithubIcon, LinkedinIcon } from '../components/icons'
import { useCvAvailable } from '../components/ui/TopActions'
import { WithCandidat } from './shared'

const RESEAUX = {
  linkedin: { label: 'LinkedIn', detail: 'Parcours, recommandations, messages', Icon: LinkedinIcon },
  github: { label: 'GitHub', detail: 'Code des projets et notebooks', Icon: GithubIcon },
}

export default function ContactSection() {
  // Le CV apparaît en tête des contacts dès que public/cv-joel-diangon.pdf existe.
  const cvAvailable = useCvAvailable()
  const { openCv } = useCvViewer()

  return (
    <WithCandidat>
      {({ candidat }) => {
        const liens = Object.entries(candidat.liens || {})
          .filter(([, url]) => url)
          .map(([cle, url]) =>
            cle === 'email'
              ? { cle, url: `mailto:${url}`, label: 'E-mail', detail: url, Icon: ContactIcon, interne: true }
              : { cle, url, ...(RESEAUX[cle] || { label: cle, detail: url, Icon: ExternalIcon }) },
          )
          // L'e-mail en premier : c'est le moyen de contact le plus direct pour un recruteur
          .sort((a, b) => (b.cle === 'email') - (a.cle === 'email'))
        if (cvAvailable) {
          liens.unshift({ cle: 'cv', label: 'Mon CV', detail: 'Voir le CV complet (PDF)', Icon: CvIcon })
        }
        return (
          <div className="section-narrow contact">
            <p className="contact-lead">
              Ouvert aux échanges autour de la <em>data</em>, de la <em>business intelligence</em> et de l’
              <em>intelligence artificielle</em>.
            </p>
            <ul className="contact-links">
              {liens.map((lien, i) => (
                <motion.li
                  key={lien.cle}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 + i * 0.1 }}
                >
                  {lien.cle === 'cv' ? (
                    <button type="button" className="contact-link" onClick={openCv} aria-haspopup="dialog">
                      <lien.Icon className="contact-icon" />
                      <span className="contact-body">
                        <span className="contact-label">{lien.label}</span>
                        <span className="contact-detail">{lien.detail}</span>
                      </span>
                      <ArrowRightIcon className="contact-arrow" />
                    </button>
                  ) : (
                    <a
                      className="contact-link"
                      href={lien.url}
                      {...(lien.interne ? {} : { target: '_blank', rel: 'noreferrer' })}
                    >
                      <lien.Icon className="contact-icon" />
                      <span className="contact-body">
                        <span className="contact-label">{lien.label}</span>
                        <span className="contact-detail">{lien.detail}</span>
                      </span>
                      {lien.interne ? <ArrowRightIcon className="contact-arrow" /> : <ExternalIcon className="contact-arrow" />}
                    </a>
                  )}
                </motion.li>
              ))}
            </ul>
          </div>
        )
      }}
    </WithCandidat>
  )
}
