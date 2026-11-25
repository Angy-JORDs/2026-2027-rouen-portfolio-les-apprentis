import { useEffect, useState } from 'react'
import { CV_URL } from '../../content/static'
import { useT } from '../../i18n/LangContext'
import { useCvViewer } from '../cv/CvViewer'
import { CvIcon } from '../icons'
import LangToggle from './LangToggle'

const TEXTES = {
  fr: { cv: 'Mon CV' },
  en: { cv: 'My CV' },
}

/**
 * Le CV est-il en ligne ? (fichier public/cv-joel-diangon.pdf). Le bouton n'apparaît que s'il existe :
 * il suffit de déposer le PDF dans le dossier public/, sans toucher au code.
 */
let cvPresence = null
function checkCv() {
  if (!cvPresence) {
    cvPresence = fetch(CV_URL, { method: 'HEAD' })
      .then((r) => r.ok && (r.headers.get('content-type') || '').includes('pdf'))
      .catch(() => false)
  }
  return cvPresence
}

export function useCvAvailable() {
  const [available, setAvailable] = useState(false)
  useEffect(() => {
    let alive = true
    checkCv().then((ok) => alive && setAvailable(ok))
    return () => {
      alive = false
    }
  }, [])
  return available
}

/**
 * Ouvre le CV dans la page (lecteur intégré, avec l'option « Télécharger »).
 * aria-label : sur petit écran, la barre du haut n'affiche que l'icône (le texte est masqué en CSS).
 */
export function CvButton({ className = '' }) {
  const available = useCvAvailable()
  const { openCv } = useCvViewer()
  const t = useT(TEXTES)
  if (!available) return null
  return (
    <button
      type="button"
      className={`action-btn action-btn--cv ${className}`}
      onClick={openCv}
      aria-haspopup="dialog"
      aria-label={t('cv')}
    >
      <CvIcon />
      <span className="action-btn-label">{t('cv')}</span>
    </button>
  )
}

/** Actions en haut à droite : choix de la langue (FR | EN), puis le bouton CV. */
export default function TopActions({ className = '' }) {
  return (
    <div className={`top-actions ${className}`}>
      <LangToggle />
      <CvButton />
    </div>
  )
}
