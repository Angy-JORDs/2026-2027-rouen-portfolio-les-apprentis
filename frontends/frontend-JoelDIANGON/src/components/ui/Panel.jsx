import { useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { ArrowLeftIcon, CloseIcon } from '../icons'

const EASE = [0.22, 1, 0.36, 1]

/**
 * Panneau d'une section, ouvert par-dessus la scène (qui plonge vers l'élément choisi).
 * Fermeture : bouton « Retour à la scène », croix, clic hors du panneau ou touche Échap.
 */
export default function Panel({ section, onClose, children }) {
  const panelRef = useRef(null)
  const onCloseRef = useRef(onClose)
  onCloseRef.current = onClose

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
          <button type="button" className="panel-back" onClick={() => onClose()}>
            <ArrowLeftIcon />
            <span>Retour à la scène</span>
          </button>
          <div className="panel-title-wrap">
            {Icon && (
              <span className="panel-icon" aria-hidden="true">
                <Icon />
              </span>
            )}
            <div>
              <p className="panel-kicker">{section.tagline}</p>
              <h2 id="panel-title" className="panel-title">
                {section.label}
              </h2>
            </div>
          </div>
          <button type="button" className="panel-close" aria-label="Fermer et revenir à la scène" onClick={() => onClose()}>
            <CloseIcon />
          </button>
        </header>
        <div className="panel-body">{children}</div>
      </motion.section>
    </motion.div>
  )
}
