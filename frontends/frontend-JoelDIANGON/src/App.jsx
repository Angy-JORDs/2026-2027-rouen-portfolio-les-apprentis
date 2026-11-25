import { useCallback } from 'react'
import { AnimatePresence, MotionConfig, motion } from 'framer-motion'
import { CvViewerProvider } from './components/cv/CvViewer'
import Scene from './components/scene/Scene'
import Nav from './components/ui/Nav'
import Panel from './components/ui/Panel'
import { useErrorMessage } from './components/ui/States'
import { SECTION_BY_ID } from './content/sections'
import { CandidatProvider, useCandidat } from './context/CandidatContext'
import { useHashRoute } from './hooks/useHashRoute'
import { LangProvider, useT } from './i18n/LangContext'
import ClassicPortfolio from './pages/ClassicPortfolio'
import { SECTION_COMPONENTS } from './sections'

export default function App() {
  return (
    // reducedMotion="user" : animations réduites si le système le demande (accessibilité)
    <MotionConfig reducedMotion="user">
      {/* La langue enveloppe tout : le profil (CandidatProvider) est servi dans la langue choisie */}
      <LangProvider>
        <CandidatProvider>
          <CvViewerProvider>
            <Portfolio />
          </CvViewerProvider>
        </CandidatProvider>
      </LangProvider>
    </MotionConfig>
  )
}

function Portfolio() {
  const [route, navigate] = useHashRoute()
  const classique = route.section === 'portfolio'
  const activeId = !classique && SECTION_BY_ID[route.section] ? route.section : null
  const Section = activeId ? SECTION_COMPONENTS[activeId] : null
  const closePanel = useCallback(() => navigate(''), [navigate])

  return (
    <div className="app">
      <AnimatePresence mode="wait">
        {classique ? (
          <ClassicPortfolio key="classique" navigate={navigate} />
        ) : (
          <motion.div key="immersif" className="immersive" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <Scene activeId={activeId} onOpen={navigate} />
            <Nav current={activeId} onNavigate={navigate} />
            <AnimatePresence mode="wait">
              {activeId && (
                <Panel key={activeId} section={SECTION_BY_ID[activeId]} onClose={closePanel}>
                  <Section route={route} navigate={navigate} />
                </Panel>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
      <ApiBanner />
    </div>
  )
}

const TEXTES_BANDEAU = {
  fr: { reessayer: 'Réessayer' },
  en: { reessayer: 'Try again' },
}

/**
 * Petit bandeau en haut si l'API d'équipe ne répond pas (le reste de la page reste utilisable).
 * Le message est traduit à l'affichage, d'après le code de l'erreur (voir ui/States.jsx).
 */
function ApiBanner() {
  const { error, reload } = useCandidat()
  const t = useT(TEXTES_BANDEAU)
  const message = useErrorMessage()
  return (
    <AnimatePresence>
      {error && (
        <motion.div
          className="api-banner"
          role="status"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
        >
          <span>{message(error)}</span>
          <button type="button" className="btn btn--small" onClick={reload}>
            {t('reessayer')}
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
