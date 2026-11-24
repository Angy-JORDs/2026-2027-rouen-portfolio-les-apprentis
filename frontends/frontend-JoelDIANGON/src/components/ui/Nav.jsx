import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { SECTIONS } from '../../content/sections'
import { useMediaQuery } from '../../hooks/useMediaQuery'
import { CloseIcon, MenuIcon } from '../icons'
import TopActions from './TopActions'

// « Parcours » ouvre la version classique (page qui défile).
const ITEMS = [{ id: '', label: 'Scène' }, { id: 'portfolio', label: 'Parcours' }, ...SECTIONS]

/**
 * Navigation alternative, discrète : accès direct aux sections sans passer par les objets.
 * Grand écran : liste fine en haut à droite. Tablette et mobile : bouton « Menu » et feuille plein écran.
 */
export default function Nav({ current, onNavigate }) {
  const isMobile = useMediaQuery('(max-width: 1100px)')
  const [open, setOpen] = useState(false)

  useEffect(() => setOpen(false), [current, isMobile])

  const go = (id) => {
    setOpen(false)
    onNavigate(id)
  }

  if (!isMobile) {
    return (
      <motion.nav
        className="nav"
        aria-label="Sections du portfolio"
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.9, delay: 1.6 }}
      >
        <ul>
          {ITEMS.map((item) => {
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
        <button
          type="button"
          className="nav-toggle"
          aria-expanded={open}
          aria-controls="nav-sheet"
          onClick={() => setOpen((o) => !o)}
        >
          {open ? <CloseIcon /> : <MenuIcon />}
          <span>{open ? 'Fermer' : 'Menu'}</span>
        </button>
      </div>
      <AnimatePresence>
        {open && (
          <motion.nav
            id="nav-sheet"
            className="nav-sheet"
            aria-label="Sections du portfolio"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <ul>
              {ITEMS.map((item, i) => (
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
