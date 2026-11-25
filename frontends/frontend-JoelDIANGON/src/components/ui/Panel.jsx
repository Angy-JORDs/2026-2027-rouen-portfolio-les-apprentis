import { useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { sectionText } from '../../content/sections'
import { useLang, useT } from '../../i18n/LangContext'
import { ArrowLeftIcon, CloseIcon } from '../icons'

const EASE = [0.22, 1, 0.36, 1]

const TEXTES = {
  fr: { retour: 'Retour à la scène', fermer: 'Fermer et revenir à la scène' },
  en: { retour: 'Back to the scene', fermer: 'Close and return to the scene' },
}

/**
 * Panneau d'une section, ouvert par-dessus la scène (qui plonge vers l'élément choisi).
 * Fermeture : bouton « Retour à la scène », croix, clic hors du panneau ou touche Échap.
 */
export default function Panel({ section, onClose, children }) {
  const panelRef = useRef(null)
  const onCloseRef = useRef(onClose)
  onCloseRef.current = onClose
  const { lang } = useLang()
  const t = useT(TEXTES)

  useEffect(() => {
    const previous = document.activeElement
    panelRef.current?.focus({ preventScroll: true })
    const onKey = (event) => {
      if (event.key === 'Escape') onCloseRef.current()
    }
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('keydown', onKey)
      if (previous && typeof previous.focus === 'function' && document.contains(previous)) previous.focus()
    }
  }, [])

  const { Icon } = section
  const { label, tagline } = sectionText(section, lang)

  return (
    <motion.div
      className="panel-layer"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.45, delay: 0.1 } }}
      transition={{ duration: 0.5 }}
    >
      <div className="panel-scrim" onClick={() => onClose()} />
      <motion.section
        ref={panelRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby="panel-title"
        className="panel"
        initial={{ opacity: 0, y: 30, scale: 0.965 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 18, scale: 0.98 }}
        transition={{ duration: 0.7, delay: 0.18, ease: EASE }}
      >
        <header className="panel-head">
          {/* aria-label : sur téléphone, seule la flèche reste visible (texte masqué en CSS) */}
          <button type="button" className="panel-back" aria-label={t('retour')} onClick={() => onClose()}>
            <ArrowLeftIcon />
            <span>{t('retour')}</span>
          </button>
          <div className="panel-title-wrap">
            {Icon && (
              <span className="panel-icon" aria-hidden="true">
                <Icon />
              </span>
            )}
            <div>
              <p className="panel-kicker">{tagline}</p>
              <h2 id="panel-title" className="panel-title">
                {label}
              </h2>
            </div>
          </div>
          <button type="button" className="panel-close" aria-label={t('fermer')} onClick={() => onClose()}>
            <CloseIcon />
          </button>
        </header>
        <div className="panel-body">{children}</div>
      </motion.section>
    </motion.div>
  )
}
