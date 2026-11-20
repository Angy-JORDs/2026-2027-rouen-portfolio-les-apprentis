import { useCallback } from 'react'
import { AnimatePresence, MotionConfig, motion } from 'framer-motion'
import Scene from './components/scene/Scene'
import Nav from './components/ui/Nav'
import Panel from './components/ui/Panel'
import { SECTION_BY_ID } from './content/sections'
import { CandidatProvider, useCandidat } from './context/CandidatContext'
import { useHashRoute } from './hooks/useHashRoute'
import { SECTION_COMPONENTS } from './sections'

export default function App() {
  return (
    // reducedMotion="user" : animations réduites si le système le demande (accessibilité)
    <MotionConfig reducedMotion="user">
      <CandidatProvider>
        <Portfolio />
      </CandidatProvider>
    </MotionConfig>
  )
}

function Portfolio() {
  const [route, navigate] = useHashRoute()
  const activeId = SECTION_BY_ID[route.section] ? route.section : null
  const Section = activeId ? SECTION_COMPONENTS[activeId] : null
  const closePanel = useCallback(() => navigate(''), [navigate])

  return (
    <div className="app">
      <Scene activeId={activeId} onOpen={navigate} />
      <Nav current={activeId} onNavigate={navigate} />
      <AnimatePresence mode="wait">
        {activeId && (
          <Panel key={activeId} section={SECTION_BY_ID[activeId]} onClose={closePanel}>
            <Section route={route} navigate={navigate} />
          </Panel>
        )}
      </AnimatePresence>
      <ApiBanner />
    </div>
  )
}

/** Bandeau discret si l'API d'équipe ne répond pas (la scène reste visible). */
function ApiBanner() {
  const { error, reload } = useCandidat()
  return (
    <AnimatePresence>
      {error && (
        <motion.div
          className="api-banner"
          role="status"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 16 }}
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
