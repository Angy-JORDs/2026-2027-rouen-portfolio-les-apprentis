import { motion } from 'framer-motion'
import { LANGUES } from '../content/static'
import { useLang, useT } from '../i18n/LangContext'
import { WithCandidat } from './shared'

const TEXTES = {
  fr: {
    note: 'Le français pour concevoir et convaincre, l’anglais pour la documentation technique et les échanges internationaux.',
  },
  en: {
    note: 'French to design and persuade, English for technical documentation and international exchanges.',
  },
}

export default function LanguesSection() {
  const t = useT(TEXTES)
  const { L } = useLang()

  return (
    <WithCandidat>
      {({ candidat, candidatFr }) => {
        // Donnée d'origine (en français) pour des clés stables d'une langue à l'autre ; traduction au rendu
        const langues = (candidatFr || candidat).langues || LANGUES
        return (
          <div className="section-narrow">
            <ul className="langues">
              {langues.map((origine, i) => {
                const l = L.langue(origine)
                return (
                  <motion.li
                    key={origine.langue}
                    className="langue"
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 + i * 0.12 }}
                  >
                    <div className="langue-head">
                      <h3 className="langue-name">{l.langue}</h3>
                      <p className="langue-level">{l.niveau}</p>
                    </div>
                  </motion.li>
                )
              })}
            </ul>
            <p className="note">{t('note')}</p>
          </div>
        )
      }}
    </WithCandidat>
  )
}
