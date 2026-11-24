import { useEffect, useState } from 'react'
import { CV_URL } from '../../content/static'
import { useCvViewer } from '../cv/CvViewer'
import { CvIcon } from '../icons'

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

/** Ouvre le CV dans la page (lecteur intégré, avec l'option « Télécharger »). */
export function CvButton({ className = '' }) {
  const available = useCvAvailable()
  const { openCv } = useCvViewer()
  if (!available) return null
  return (
    <button type="button" className={`action-btn action-btn--cv ${className}`} onClick={openCv} aria-haspopup="dialog">
      <CvIcon />
      <span>Mon CV</span>
    </button>
  )
}

/** Actions en haut à droite (le bouton CV). */
export default function TopActions({ className = '' }) {
  return (
    <div className={`top-actions ${className}`}>
      <CvButton />
    </div>
  )
}
