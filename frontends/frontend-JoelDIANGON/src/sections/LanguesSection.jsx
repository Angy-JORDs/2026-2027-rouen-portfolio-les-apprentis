import { motion } from 'framer-motion'
import { LANGUES, scoreLangue } from '../content/static'
import { WithCandidat } from './shared'

export default function LanguesSection() {
  return (
    <WithCandidat>
      {({ candidat }) => {
        const langues = candidat.langues || LANGUES
        return (
          <div className="section-narrow">
            <ul className="langues">
              {langues.map((l, i) => {
                const score = scoreLangue(l)
                return (
                  <motion.li
                    key={l.langue}
                    className="langue"
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 + i * 0.12 }}
                  >
                    <div className="langue-head">
                      <h3 className="langue-name">{l.langue}</h3>
                      <p className="langue-level">{l.niveau}</p>
                    </div>
                    <div className="langue-meter" aria-label={`${l.langue} : ${l.niveau}`}>
                      {[1, 2, 3, 4, 5].map((n) => (
                        <motion.span
                          key={n}
                          className={`langue-seg${n <= Math.round(score) ? ' on' : ''}`}
                          initial={{ scaleY: 0.3, opacity: 0 }}
                          animate={{ scaleY: 1, opacity: 1 }}
                          transition={{ delay: 0.45 + i * 0.12 + n * 0.06 }}
                        />
                      ))}
                    </div>
                  </motion.li>
                )
              })}
            </ul>
            <p className="note">
              Le français pour concevoir et convaincre, l’anglais pour la documentation technique et les échanges
              internationaux.
            </p>
          </div>
        )
      }}
    </WithCandidat>
  )
}
