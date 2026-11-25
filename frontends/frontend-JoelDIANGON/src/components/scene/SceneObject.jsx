import { motion } from 'framer-motion'
import { sectionText } from '../../content/sections'
import { useLang, useT } from '../../i18n/LangContext'

// Nom du bouton pour les lecteurs d'écran (espace avant les deux-points en français seulement)
const TEXTES = {
  fr: { nom: '{label} : {tagline}' },
  en: { nom: '{label}: {tagline}' },
}

/**
 * Un élément flottant du parcours. Survol : léger halo + nom de la section ; clic : ouverture.
 * layout "free" (ordinateur/tablette) : placé sur l'arc ; layout "grid" (mobile) : dans une grille.
 */
export default function SceneObject({ section, index, layout, dimmed, onOpen, onHover }) {
  const { lang } = useLang()
  const t = useT(TEXTES)
  const { label, tagline } = sectionText(section, lang)
  const { Icon } = section
  const style = layout === 'free' ? { left: `${section.pos.x}%`, top: `${section.pos.y}%` } : undefined

  return (
    <motion.div
      className={`orb-wrap orb-wrap--${layout}${section.hero ? ' is-hero' : ''}`}
      style={style}
      initial={{ opacity: 0, scale: 0.55 }}
      animate={{ opacity: dimmed ? 0.6 : 1, scale: 1 }}
      transition={{
        opacity: { duration: 0.5 },
        scale: { delay: 0.7 + index * 0.13, duration: 0.9, ease: [0.22, 1, 0.36, 1] },
        default: { delay: 0.7 + index * 0.13 },
      }}
    >
      <div className="orb-center">
        <motion.div
          className="orb-float"
          animate={{ y: layout === 'free' ? [0, -7, 0] : [0, -2.5, 0] }}
          transition={{ duration: 5.4 + (index % 3) * 0.9, repeat: Infinity, ease: 'easeInOut', delay: index * 0.45 }}
        >
          <motion.button
            type="button"
            className="orb"
            aria-label={t('nom', { label, tagline })}
            whileHover={{ scale: 1.09 }}
            whileTap={{ scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 260, damping: 18 }}
            onMouseEnter={() => onHover(section.id)}
            onMouseLeave={() => onHover(null)}
            onFocus={() => onHover(section.id)}
            onBlur={() => onHover(null)}
            onClick={() => onOpen(section.id)}
          >
            <span className="orb-halo" aria-hidden="true" />
            <span className="orb-ring" aria-hidden="true" />
            <Icon className="orb-icon" />
          </motion.button>
          <span className="orb-label" aria-hidden="true">
            <span className="orb-label-title">{label}</span>
            <span className="orb-label-sub">{tagline}</span>
          </span>
        </motion.div>
      </div>
    </motion.div>
  )
}
