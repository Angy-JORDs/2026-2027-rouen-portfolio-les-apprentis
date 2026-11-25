import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { SECTIONS, sectionText } from '../../content/sections'
import { useMediaQuery } from '../../hooks/useMediaQuery'
import { useLang, useT } from '../../i18n/LangContext'
import { CloseIcon, MenuIcon } from '../icons'
import TopActions from './TopActions'

const TEXTES = {
  fr: { scene: 'Scène', parcours: 'Parcours', sections: 'Sections du portfolio', menu: 'Menu', fermer: 'Fermer' },
  en: { scene: 'Home', parcours: 'Journey', sections: 'Portfolio sections', menu: 'Menu', fermer: 'Close' },
}

// La liste complète n'apparaît que si elle tient à côté du nom (en haut à gauche) : avec le choix de la langue
// et le bouton CV, il lui faut environ 1 360 px de large. En dessous : bouton « Menu » et feuille plein écran.
const NAV_COMPACTE = '(max-width: 1360px)'

// « Parcours » ouvre la version classique (page qui défile).
function menuItems(t, lang) {
  return [
    { id: '', label: t('scene') },
    { id: 'portfolio', label: t('parcours') },
    ...SECTIONS.map((s) => ({ id: s.id, label: sectionText(s, lang).label })),
  ]
}

/**
 * Navigation alternative, discrète : accès direct aux sections sans passer par les objets.
 * Grand écran : liste fine en haut à droite. Portable, tablette et mobile : bouton « Menu » et feuille plein écran.
 */
export default function Nav({ current, onNavigate }) {
  const isMobile = useMediaQuery(NAV_COMPACTE)
  const [open, setOpen] = useState(false)
  const { lang } = useLang()
  const t = useT(TEXTES)
  const items = menuItems(t, lang)
  const toggleLabel = open ? t('fermer') : t('menu')

  useEffect(() => setOpen(false), [current, isMobile])

  const go = (id) => {
    setOpen(false)
    onNavigate(id)
  }

  if (!isMobile) {
    return (
      <motion.nav
        className="nav"
        aria-label={t('sections')}
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.9, delay: 1.6 }}
      >
        <ul>
          {items.map((item) => {
            const isCurrent = (current || '') === item.id
            return (
              <li key={item.id || 'scene'}>
                <button
                  type="button"
                  className={`nav-link${isCurrent ? ' is-current' : ''}`}
                  aria-current={isCurrent ? 'page' : undefined}
                  onClick={() => go(item.id)}
                >
                  {item.label}
                </button>
              </li>
            )
          })}
        </ul>
        <TopActions />
      </motion.nav>
    )
  }

  return (
    <>
      <div className="nav-mobile-bar">
        <TopActions />
        {/* aria-label : sur téléphone, seul le pictogramme reste visible (texte masqué en CSS) */}
        <button
          type="button"
          className="nav-toggle"
          aria-expanded={open}
          aria-controls="nav-sheet"
          aria-label={toggleLabel}
          onClick={() => setOpen((o) => !o)}
        >
          {open ? <CloseIcon /> : <MenuIcon />}
          <span className="nav-toggle-label">{toggleLabel}</span>
        </button>
      </div>
      <AnimatePresence>
        {open && (
          <motion.nav
            id="nav-sheet"
            className="nav-sheet"
            aria-label={t('sections')}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <ul>
              {items.map((item, i) => (
                <motion.li
                  key={item.id || 'scene'}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.05 * i }}
                >
                  <button
                    type="button"
                    className={`nav-sheet-link${(current || '') === item.id ? ' is-current' : ''}`}
                    onClick={() => go(item.id)}
                  >
                    {item.label}
                  </button>
                </motion.li>
              ))}
            </ul>
          </motion.nav>
        )}
      </AnimatePresence>
    </>
  )
}
