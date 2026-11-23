import { useCallback } from 'react'
import { AnimatePresence, MotionConfig, motion } from 'framer-motion'
import { CvViewerProvider } from './components/cv/CvViewer'
import Scene from './components/scene/Scene'
import Nav from './components/ui/Nav'
import Panel from './components/ui/Panel'
import { SECTION_BY_ID } from './content/sections'
import { CandidatProvider, useCandidat } from './context/CandidatContext'
import { useHashRoute } from './hooks/useHashRoute'
import ClassicPortfolio from './pages/ClassicPortfolio'
import { SECTION_COMPONENTS } from './sections'

export default function App() {
  return (
    // reducedMotion="user" : animations réduites si le système le demande (accessibilité)
    <MotionConfig reducedMotion="user">
      <CandidatProvider>
        <CvViewerProvider>
          <Portfolio />
        </CvViewerProvider>
      </CandidatProvider>
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

/** Petit bandeau en haut si l'API d'équipe ne répond pas (le reste de la page reste utilisable). */
function ApiBanner() {
  const { error, reload } = useCandidat()
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
          <span>{error.message}</span>
          <button type="button" className="btn btn--small" onClick={reload}>
            Réessayer
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
