import { useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { SECTIONS, SECTION_BY_ID } from '../../content/sections'
import { useCandidat } from '../../context/CandidatContext'
import { useMediaQuery } from '../../hooks/useMediaQuery'
import { useT } from '../../i18n/LangContext'
import { ArrowRightIcon, ContactIcon } from '../icons'
import RecruiterSearch from '../search/RecruiterSearch'
import Backdrop from './Backdrop'
import Bust from './Bust'
import SceneObject from './SceneObject'

const EASE = [0.22, 1, 0.36, 1]

const TEXTES = {
  fr: {
    nom: 'Joël DIANGON',
    titre: 'Ingénieur Data · BI · IA',
    ecrire: 'M’écrire',
    ecrireA: 'M’écrire à {email}',
    parcours: 'Mon parcours',
    accroche: 'Chaque expérience façonne la suite.',
    chronologie: 'Voir la chronologie complète',
    indiceTactile: 'Touchez un élément pour l’explorer',
    indiceSouris: 'Survolez les éléments, cliquez pour explorer',
  },
  en: {
    nom: 'Joël DIANGON',
    titre: 'Data · BI · AI Engineer',
    ecrire: 'Email me',
    ecrireA: 'Email me at {email}',
    parcours: 'My journey',
    accroche: 'Every experience shapes what comes next.',
    chronologie: 'View the full timeline',
    indiceTactile: 'Tap an item to explore it',
    indiceSouris: 'Hover over the items, click to explore',
  },
}

/**
 * Écran d'accueil : le personnage, vu de dos, face au couloir et aux éléments de son parcours.
 * Quand une section s'ouvre, la scène « plonge » vers l'élément choisi (zoom centré sur lui).
 */
export default function Scene({ activeId, onOpen }) {
  const isMobile = useMediaQuery('(max-width: 760px)')
  const [hovered, setHovered] = useState(null)
  const { candidat } = useCandidat()
  const t = useT(TEXTES)

  // Point de zoom : l'élément ouvert (on garde le dernier pendant l'animation de fermeture).
  const lastFocus = useRef({ x: 50, y: 45 })
  const active = activeId ? SECTION_BY_ID[activeId] : null
  if (active) lastFocus.current = active.pos || { x: 50, y: 45 }

  const focus = hovered ? SECTION_BY_ID[hovered] : null
  const lookAt = focus?.pos ? (focus.pos.x - 50) / 34 : 0
  const accroche = candidat?.titre?.split(',')[0]
  const email = candidat?.liens?.email

  return (
    <motion.main
      className="scene"
      inert={activeId ? true : undefined}
      animate={active ? { scale: 1.24, opacity: 0.32 } : { scale: 1, opacity: 1 }}
      style={{ transformOrigin: `${lastFocus.current.x}% ${lastFocus.current.y}%` }}
      transition={{ duration: 1, ease: EASE }}
    >
      <Backdrop showJourney={!isMobile} highlight={hovered} />

      <motion.p
        className="scene-brand"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.2, delay: 0.2 }}
      >
        <span className="scene-brand-name">{candidat ? `${candidat.prenom} ${candidat.nom}` : t('nom')}</span>
        <span className="scene-brand-role">{accroche || t('titre')}</span>
        {/* E-mail sous le titre : adresse complète, ou « M'écrire » sur téléphone (choix en CSS) */}
        {email && (
          <a className="scene-brand-mail" href={`mailto:${email}`} aria-label={t('ecrireA', { email })}>
            <ContactIcon />
            <span className="scene-brand-mail-full">{email}</span>
            <span className="scene-brand-mail-short">{t('ecrire')}</span>
          </a>
        )}
      </motion.p>

      <motion.header
        className="scene-intro"
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1.1, delay: 0.45, ease: EASE }}
      >
        <h1 className="scene-title">{t('parcours')}</h1>
        <p className="scene-subtitle">{t('accroche')}</p>
        <button type="button" className="scene-link" onClick={() => onOpen('portfolio')}>
          {t('chronologie')} <ArrowRightIcon />
        </button>
      </motion.header>

      <div className={`scene-objects scene-objects--${isMobile ? 'grid' : 'free'}`}>
        {SECTIONS.map((section, index) => (
          <SceneObject
            key={section.id}
            section={section}
            index={index}
            layout={isMobile ? 'grid' : 'free'}
            dimmed={Boolean(hovered && hovered !== section.id)}
            onOpen={onOpen}
            onHover={setHovered}
          />
        ))}
      </div>

      <motion.div
        className="bust-stage"
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1.6, delay: 0.1, ease: EASE }}
      >
        <Bust lookAt={lookAt} />
      </motion.div>

      <motion.div
        className="scene-search"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, delay: 1.8, ease: EASE }}
      >
        <RecruiterSearch onNavigate={onOpen} />
      </motion.div>

      <motion.p
        className="scene-hint"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 2.2 }}
      >
        <span className="scene-hint-dot" aria-hidden="true" />
        {isMobile ? t('indiceTactile') : t('indiceSouris')}
      </motion.p>
    </motion.main>
  )
}
