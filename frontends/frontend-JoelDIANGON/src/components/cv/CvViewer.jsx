import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { CV_URL } from '../../content/static'
import { useMediaQuery } from '../../hooks/useMediaQuery'
import { useT } from '../../i18n/LangContext'
import { CloseIcon, CvIcon, DownloadIcon, ExternalIcon } from '../icons'

const TEXTES = {
  fr: {
    titre: 'Mon CV',
    telecharger: 'Télécharger',
    nouvelOnglet: 'Ouvrir le CV dans un nouvel onglet',
    fermer: 'Fermer le CV',
    lecteur: 'Le CV s’ouvre dans le lecteur PDF de votre appareil.',
    ouvrir: 'Ouvrir le CV',
    document: 'CV de Joël DIANGON',
  },
  en: {
    titre: 'My CV',
    telecharger: 'Download',
    nouvelOnglet: 'Open the CV in a new tab',
    fermer: 'Close the CV',
    lecteur: "The CV opens in your device's PDF viewer.",
    ouvrir: 'Open the CV',
    document: "Joël DIANGON's CV",
  },
}

const CvViewerContext = createContext({ openCv: () => {} })

/** Accès au lecteur de CV depuis n'importe quel bouton : `const { openCv } = useCvViewer()`. */
export function useCvViewer() {
  return useContext(CvViewerContext)
}

/** Fournit le lecteur de CV à toute l'application (une seule fenêtre, ouverte par-dessus la page). */
export function CvViewerProvider({ children }) {
  const [open, setOpen] = useState(false)
  const openCv = useCallback(() => setOpen(true), [])

  return (
    <CvViewerContext.Provider value={{ openCv }}>
      {children}
      <AnimatePresence>{open && <CvModal onClose={() => setOpen(false)} />}</AnimatePresence>
    </CvViewerContext.Provider>
  )
}

const FICHIER = 'CV-Joel-DIANGON.pdf'

/**
 * Le CV s'affiche dans la page (lecteur PDF du navigateur), avec « Télécharger » et « Ouvrir dans un onglet ».
 * Sur téléphone, les navigateurs n'affichent pas un PDF intégré de façon fiable (Android : rien, iOS : 1re page) :
 * on propose alors de l'ouvrir en plein écran dans le lecteur du téléphone.
 */
function CvModal({ onClose }) {
  const isTouch = useMediaQuery('(pointer: coarse)')
  const t = useT(TEXTES)
  const dialogRef = useRef(null)
  const onCloseRef = useRef(onClose)
  onCloseRef.current = onClose

  useEffect(() => {
    const previous = document.activeElement
    dialogRef.current?.focus({ preventScroll: true })
    const onKey = (e) => e.key === 'Escape' && onCloseRef.current()
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('keydown', onKey)
      if (previous && typeof previous.focus === 'function' && document.contains(previous)) previous.focus()
    }
  }, [])

  const fallback = (
    <div className="cv-fallback">
      <CvIcon className="cv-fallback-icon" />
      <p>{t('lecteur')}</p>
      <a className="btn" href={CV_URL} target="_blank" rel="noreferrer">
        <ExternalIcon /> {t('ouvrir')}
      </a>
    </div>
  )

  return (
    <motion.div
      className="cv-layer"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
    >
      <div className="cv-scrim" onClick={onClose} />
      <motion.section
        ref={dialogRef}
        className="cv-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="cv-title"
        tabIndex={-1}
        initial={{ opacity: 0, y: 16, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 8, scale: 0.98, transition: { duration: 0.15 } }}
        transition={{ type: 'spring', bounce: 0, duration: 0.35 }}
      >
        <header className="cv-head">
          <h2 id="cv-title" className="cv-title">
            <CvIcon /> {t('titre')}
          </h2>
          <div className="cv-actions">
            <a className="btn cv-download" href={CV_URL} download={FICHIER}>
              <DownloadIcon /> {t('telecharger')}
            </a>
            {!isTouch && (
              <a
                className="btn cv-icon-btn"
                href={CV_URL}
                target="_blank"
                rel="noreferrer"
                aria-label={t('nouvelOnglet')}
                title={t('nouvelOnglet')}
              >
                <ExternalIcon />
              </a>
            )}
            <button type="button" className="cv-close" aria-label={t('fermer')} onClick={onClose}>
              <CloseIcon />
            </button>
          </div>
        </header>
        <div className="cv-body">
          {isTouch ? (
            fallback
          ) : (
            <object className="cv-frame" data={`${CV_URL}#view=FitH`} type="application/pdf" aria-label={t('document')}>
              {fallback}
            </object>
          )}
        </div>
      </motion.section>
    </motion.div>
  )
}
