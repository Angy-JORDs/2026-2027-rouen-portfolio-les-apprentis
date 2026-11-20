import { motion } from 'framer-motion'
import { api } from '../api/client'
import { ErrorState, Loader, Source } from '../components/ui/States'
import { useCandidat } from '../context/CandidatContext'
import { useAsync } from '../hooks/useAsync'
import SkillGraph from './SkillGraph'

/** Graphe de compétences (R5, Neo4j) + compétences les plus mobilisées (R3, agrégation MongoDB). */
export default function CompetencesSection({ navigate }) {
  const { candidat } = useCandidat()
  const graphe = useAsync('graphe', () => api.graphe())
  const stats = useAsync('stats', () => api.stats())
  const slug = candidat?.candidat_slug || '…'

  return (
    <div className="competences-layout">
      <div className="graph-card">
        <div className="graph-legend" aria-hidden="true">
          <span>
            <i className="dot dot--projet" /> Projet
          </span>
          <span>
            <i className="dot dot--competence" /> Compétence
          </span>
          <span className="graph-legend-hint">Survolez un nœud · cliquez pour explorer</span>
        </div>
        {graphe.error && <ErrorState error={graphe.error} onRetry={graphe.reload} />}
        {!graphe.error && !graphe.data && <Loader label="Construction du graphe…" />}
        {graphe.data && (
          <SkillGraph
            data={graphe.data}
            onSelectSkill={(s) => navigate(`projets?competence=${encodeURIComponent(s)}`)}
            onSelectProjet={(p) => navigate(`projets/${p}`)}
          />
        )}
        <Source>Neo4j · GET /api/graph/competences/{slug} (R5)</Source>
      </div>

      <aside className="stats-card">
        <p className="eyebrow">Les plus mobilisées</p>
        {stats.error && <ErrorState error={stats.error} onRetry={stats.reload} />}
        {!stats.error && !stats.data && <Loader />}
        {stats.data && <StatsList stats={stats.data} navigate={navigate} />}
        <Source>MongoDB · agrégation · GET /api/candidats/{slug}/stats (R3)</Source>
      </aside>
    </div>
  )
}

function StatsList({ stats, navigate }) {
  const top = stats.competences.slice(0, 12)
  const max = Math.max(1, ...top.map((c) => c.nombre_projets))
  return (
    <>
      <p className="stats-total">
        <strong>{stats.total_projets}</strong> projets · <strong>{stats.competences.length}</strong> compétences
      </p>
      <ol className="stats-list">
        {top.map((c, i) => (
          <li key={c.skill_slug}>
            <button
              type="button"
              className="stat"
              onClick={() => navigate(`projets?competence=${encodeURIComponent(c.skill_slug)}`)}
            >
              <span className="stat-head">
                <span className="stat-name">{c.nom}</span>
                <span className="stat-count">
                  {c.nombre_projets} projet{c.nombre_projets > 1 ? 's' : ''}
                </span>
              </span>
              <span className="stat-bar">
                <motion.span
                  className="stat-fill"
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: c.nombre_projets / max }}
                  transition={{ duration: 0.9, delay: 0.3 + i * 0.05, ease: [0.22, 1, 0.36, 1] }}
                />
              </span>
              {typeof c.niveau === 'number' && (
                <span className="stat-level" aria-label={`Niveau ${c.niveau} sur 5`}>
                  {[1, 2, 3, 4, 5].map((n) => (
                    <i key={n} className={n <= c.niveau ? 'on' : ''} />
                  ))}
                </span>
              )}
            </button>
          </li>
        ))}
      </ol>
    </>
  )
}
