import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { forceCollide, forceLink, forceManyBody, forceSimulation, forceX, forceY } from 'd3-force'

/**
 * Graphe Candidat → Projets → Compétences (R5), mis en page par simulation de forces (d3-force),
 * calculée une seule fois puis figée : pas de tremblement, rendu SVG net à toutes les tailles.
 * Survol : le nœud et ses voisins s'éclairent. Clic : compétence -> projets filtrés, projet -> fiche.
 */
function computeLayout(graph) {
  const nodes = graph.nodes.map((n) => ({ ...n }))
  const links = graph.links.map((l) => ({ ...l }))

  const degree = {}
  for (const l of links) {
    degree[l.source] = (degree[l.source] || 0) + 1
    degree[l.target] = (degree[l.target] || 0) + 1
  }
  for (const n of nodes) {
    n.degree = degree[n.id] || 0
    n.r = n.type === 'candidat' ? 17 : n.type === 'projet' ? 9 : 4 + Math.min(n.degree, 6) * 1.4
  }
  const centre = nodes.find((n) => n.type === 'candidat')
  if (centre) {
    centre.fx = 0
    centre.fy = 0
  }

  const simulation = forceSimulation(nodes)
    .force(
      'link',
      forceLink(links)
        .id((d) => d.id)
        .distance((l) => (l.type === 'REALISE' ? 120 : 58))
        .strength((l) => (l.type === 'REALISE' ? 0.8 : 0.45)),
    )
    .force('charge', forceManyBody().strength((d) => (d.type === 'projet' ? -280 : d.type === 'candidat' ? -400 : -95)))
    .force('collide', forceCollide((d) => d.r + (d.type === 'competence' ? 16 : 12)))
    .force('x', forceX(0).strength(0.035))
    .force('y', forceY(0).strength(0.055))
    .stop()
  for (let i = 0; i < 360; i += 1) simulation.tick()

  const margin = 46
  const xs = nodes.map((n) => n.x)
  const ys = nodes.map((n) => n.y)
  const minX = Math.min(...xs) - margin
  const minY = Math.min(...ys) - margin
  const viewBox = `${minX} ${minY} ${Math.max(...xs) - minX + margin} ${Math.max(...ys) - minY + margin}`

  const neighbours = new Map(nodes.map((n) => [n.id, new Set([n.id])]))
  for (const l of links) {
    neighbours.get(l.source.id).add(l.target.id)
    neighbours.get(l.target.id).add(l.source.id)
  }
  return { nodes, links, viewBox, neighbours }
}

export default function SkillGraph({ data, onSelectSkill, onSelectProjet }) {
  const layout = useMemo(() => (data?.nodes?.length ? computeLayout(data) : null), [data])
  const [hovered, setHovered] = useState(null)

  if (!layout) return <p className="empty">Le graphe est vide pour le moment.</p>
  const lit = hovered ? layout.neighbours.get(hovered) : null

  const activate = (node) => {
    if (node.type === 'competence') onSelectSkill(node.slug)
    else if (node.type === 'projet') onSelectProjet(node.slug)
  }

  return (
    <svg
      className="skill-graph"
      viewBox={layout.viewBox}
      role="img"
      aria-label="Graphe de mes compétences : chaque projet est relié aux compétences qu'il mobilise"
    >
      <g className="sg-links">
        {layout.links.map((l, i) => {
          const on = lit && lit.has(l.source.id) && lit.has(l.target.id) && (l.source.id === hovered || l.target.id === hovered)
          return (
            <motion.line
              key={`${l.source.id}-${l.target.id}`}
              x1={l.source.x}
              y1={l.source.y}
              x2={l.target.x}
              y2={l.target.y}
              className={`sg-link sg-link--${l.type.toLowerCase()}${on ? ' is-lit' : ''}${lit && !on ? ' is-dim' : ''}`}
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.3 + Math.min(i, 40) * 0.012 }}
            />
          )
        })}
      </g>
      <g className="sg-nodes">
        {layout.nodes.map((n, i) => {
          const dim = lit && !lit.has(n.id)
          const interactive = n.type !== 'candidat'
          const showLabel = n.type !== 'projet' || hovered === n.id || (lit && lit.has(n.id))
          return (
            <motion.g
              key={n.id}
              className={`sg-node sg-node--${n.type}${dim ? ' is-dim' : ''}${hovered === n.id ? ' is-hovered' : ''}`}
              transform={`translate(${n.x} ${n.y})`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.15 + Math.min(i, 40) * 0.015 }}
              onMouseEnter={() => setHovered(n.id)}
              onMouseLeave={() => setHovered(null)}
              onFocus={() => setHovered(n.id)}
              onBlur={() => setHovered(null)}
              onClick={interactive ? () => activate(n) : undefined}
              onKeyDown={
                interactive
                  ? (e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        activate(n)
                      }
                    }
                  : undefined
              }
              tabIndex={interactive ? 0 : undefined}
              role={interactive ? 'button' : undefined}
              aria-label={
                n.type === 'competence'
                  ? `${n.label} : voir les projets`
                  : n.type === 'projet'
                    ? `Projet ${n.label} : voir la fiche`
                    : undefined
              }
            >
              {n.type === 'candidat' && <circle r={n.r + 9} className="sg-aura" />}
              <circle r={n.r} />
              {showLabel && (
                <text
                  className="sg-label"
                  y={n.type === 'candidat' ? n.r + 18 : n.r + 13}
                  textAnchor="middle"
                >
                  {n.type === 'candidat' ? n.label.split(' ')[0] : n.label}
                </text>
              )}
            </motion.g>
          )
        })}
      </g>
    </svg>
  )
}
