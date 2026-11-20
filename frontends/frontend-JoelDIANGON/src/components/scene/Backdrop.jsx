import { useMemo, useRef } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { SECTIONS } from '../../content/sections'
import { useElementSize } from '../../hooks/useMediaQuery'
import { seededRandom, smoothPath } from '../../lib/geometry'

/** Sol en perspective : quelques lignes fines qui fuient vers l'horizon. */
function FloorGrid() {
  const vanishing = { x: 50, y: 62 }
  const rays = []
  for (let x = -70; x <= 170; x += 12) rays.push(x)
  const rows = [0.06, 0.15, 0.27, 0.42, 0.6, 0.8, 1].map((t) => vanishing.y + (100 - vanishing.y) * t * t)

  return (
    <svg className="floor-grid" viewBox="0 0 100 100" preserveAspectRatio="none">
      {rays.map((x) => (
        <line key={`r${x}`} x1={vanishing.x} y1={vanishing.y} x2={x} y2={100} vectorEffect="non-scaling-stroke" />
      ))}
      {rows.map((y) => (
        <line key={`h${y}`} x1={-10} y1={y} x2={110} y2={y} vectorEffect="non-scaling-stroke" />
      ))}
    </svg>
  )
}

/** Quelques particules lentes et discrètes (positions fixes, générées une seule fois). */
function Particles({ count = 26 }) {
  const dots = useMemo(() => {
    const rand = seededRandom(7)
    return Array.from({ length: count }, (_, i) => ({
      id: i,
      left: rand() * 100,
      top: rand() * 70,
      size: 1 + rand() * 1.8,
      delay: rand() * -14,
      duration: 12 + rand() * 12,
      hue: rand() > 0.5 ? 'var(--blue-soft)' : 'var(--green)',
    }))
  }, [count])

  return (
    <div className="particles">
      {dots.map((d) => (
        <span
          key={d.id}
          className="particle"
          style={{
            left: `${d.left}%`,
            top: `${d.top}%`,
            width: d.size,
            height: d.size,
            background: d.hue,
            animationDelay: `${d.delay}s`,
            animationDuration: `${d.duration}s`,
          }}
        />
      ))}
    </div>
  )
}

/**
 * L'arc du parcours : une ligne lumineuse qui relie les éléments de gauche à droite,
 * et un fil discret entre le garçon et l'élément survolé. Dessiné en pixels réels
 * (ResizeObserver) pour ne pas être déformé.
 */
function JourneyPath({ highlight }) {
  const ref = useRef(null)
  const { width: w, height: h } = useElementSize(ref)
  const points = SECTIONS.map((s) => ({ x: (s.pos.x / 100) * w, y: (s.pos.y / 100) * h }))
  const d = w ? smoothPath(points) : ''
  const target = SECTIONS.find((s) => s.id === highlight)
  const origin = { x: w / 2, y: h * 0.6 }

  return (
    <svg ref={ref} className="journey" width="100%" height="100%">
      <defs>
        <linearGradient id="journey-gradient" x1="0" x2="1" y1="0" y2="0">
          <stop offset="0" stopColor="#6fa8c9" stopOpacity="0" />
          <stop offset="0.18" stopColor="#6fa8c9" stopOpacity="0.55" />
          <stop offset="0.82" stopColor="#8cc5a8" stopOpacity="0.55" />
          <stop offset="1" stopColor="#8cc5a8" stopOpacity="0" />
        </linearGradient>
      </defs>
      {d && (
        <>
          <motion.path
            d={d}
            className="journey-line"
            stroke="url(#journey-gradient)"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 2.6, delay: 0.5, ease: [0.65, 0, 0.35, 1] }}
          />
          <path d={d} className="journey-dash" stroke="url(#journey-gradient)" />
        </>
      )}
      <AnimatePresence>
        {target && w > 0 && (
          <motion.line
            key={target.id}
            className="journey-thread"
            x1={origin.x}
            y1={origin.y}
            x2={(target.pos.x / 100) * w}
            y2={(target.pos.y / 100) * h}
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
          />
        )}
      </AnimatePresence>
    </svg>
  )
}

export default function Backdrop({ showJourney, highlight }) {
  return (
    <div className="backdrop" aria-hidden="true">
      <div className="bg-glow" />
      <div className="bg-horizon" />
      <FloorGrid />
      <div className="bg-orbit" />
      <div className="bg-orbit bg-orbit--inner" />
      <span className="bg-shape bg-shape--a" />
      <span className="bg-shape bg-shape--b" />
      <Particles />
      {showJourney && <JourneyPath highlight={highlight} />}
    </div>
  )
}
