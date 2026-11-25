import { motion } from 'framer-motion'
import { api } from '../api/client'
import { ErrorState, Loader } from '../components/ui/States'
import { useCandidat } from '../context/CandidatContext'
import { useAsync } from '../hooks/useAsync'
import { useLang, useT } from '../i18n/LangContext'
import SkillGraph from './SkillGraph'

const TEXTES = {
  fr: {
    projet: 'Projet',
    competence: 'Compétence',
    aide: 'Survolez un nœud · cliquez pour explorer',
    construction: 'Construction du graphe…',
    plusMobilisees: 'Les plus mobilisées',
    // Totaux : le nombre est affiché à part (en gras), seul le mot s'accorde
    motProjets: ({ n }) => (n > 1 ? 'projets' : 'projet'),
    motCompetences: ({ n }) => (n > 1 ? 'compétences' : 'compétence'),
    nbProjets: ({ n }) => `${n} projet${n > 1 ? 's' : ''}`,
  },
  en: {
    projet: 'Project',
    competence: 'Skill',
    aide: 'Hover over a node · click to explore',
    construction: 'Building the graph…',
    plusMobilisees: 'Most used',
    motProjets: ({ n }) => (n === 1 ? 'project' : 'projects'),
    motCompetences: ({ n }) => (n === 1 ? 'skill' : 'skills'),
    nbProjets: ({ n }) => `${n} project${n === 1 ? '' : 's'}`,
  },
}

/** Graphe de compétences (R5, Neo4j) + compétences les plus mobilisées (R3, agrégation MongoDB). */
export default function CompetencesSection({ navigate }) {
  const { candidat } = useCandidat()
  const t = useT(TEXTES)
  const graphe = useAsync('graphe', () => api.graphe())
  const stats = useAsync('stats', () => api.stats())
  const slug = candidat?.candidat_slug || '…'

  return (
    <div className="competences-layout">
      <div className="graph-card">
        <div className="graph-legend" aria-hidden="true">
          <span>
            <i className="dot dot--projet" /> {t('projet')}
          </span>
          <span>
            <i className="dot dot--competence" /> {t('competence')}
          </span>
          <span className="graph-legend-hint">{t('aide')}</span>
        </div>
        {graphe.error && <ErrorState error={graphe.error} onRetry={graphe.reload} />}
        {!graphe.error && !graphe.data && <Loader label={t('construction')} />}
        {graphe.data && (
          <SkillGraph
            data={graphe.data}
            onSelectSkill={(s) => navigate(`projets?competence=${encodeURIComponent(s)}`)}
            onSelectProjet={(p) => navigate(`projets/${p}`)}
          />
        )}
      </div>

      <aside className="stats-card">
        <p className="eyebrow">{t('plusMobilisees')}</p>
        {stats.error && <ErrorState error={stats.error} onRetry={stats.reload} />}
        {!stats.error && !stats.data && <Loader />}
        {stats.data && <StatsList stats={stats.data} navigate={navigate} />}
      </aside>
    </div>
  )
}

function StatsList({ stats, navigate }) {
  const t = useT(TEXTES)
  const { L } = useLang()
  const top = stats.competences.slice(0, 12)
  const max = Math.max(1, ...top.map((c) => c.nombre_projets))
  const nbProjets = stats.total_projets
  const nbCompetences = stats.competences.length
  return (
    <>
      <p className="stats-total">
        <strong>{nbProjets}</strong> {t('motProjets', { n: nbProjets })} · <strong>{nbCompetences}</strong>{' '}
        {t('motCompetences', { n: nbCompetences })}
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
                <span className="stat-name">{L.skill(c.skill_slug, c.nom)}</span>
                <span className="stat-count">{t('nbProjets', { n: c.nombre_projets })}</span>
              </span>
              <span className="stat-bar">
                <motion.span
                  className="stat-fill"
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: c.nombre_projets / max }}
                  transition={{ duration: 0.9, delay: 0.3 + i * 0.05, ease: [0.22, 1, 0.36, 1] }}
                />
              </span>
            </button>
          </li>
        ))}
      </ol>
    </>
  )
}
