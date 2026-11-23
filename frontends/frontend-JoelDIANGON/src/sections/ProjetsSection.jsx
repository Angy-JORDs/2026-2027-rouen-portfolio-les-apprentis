import { useMemo } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { api } from '../api/client'
import Tags from '../components/ui/Tags'
import { ErrorState, Loader } from '../components/ui/States'
import { useCandidat } from '../context/CandidatContext'
import { useAsync } from '../hooks/useAsync'
import { formatPeriod, humanizeKey, truncate } from '../lib/format'
import ProjetDetail from './ProjetDetail'
import { skillTags } from './shared'

/** Galerie des projets (R2, filtrable par compétence) ou fiche détaillée (#/projets/<slug>). */
export default function ProjetsSection({ route, navigate }) {
  if (route.param) return <ProjetDetail slug={route.param} navigate={navigate} />
  return <ProjetsGallery competence={route.query.competence} navigate={navigate} />
}

function ProjetsGallery({ competence, navigate }) {
  const { skillName, candidat } = useCandidat()
  const tous = useAsync('projets:', () => api.projets())
  const filtres = useAsync(`projets:${competence || ''}`, () => api.projets({ competence }))

  // Filtres proposés : les compétences les plus utilisées dans mes projets
  const filtresDisponibles = useMemo(() => {
    const compte = new Map()
    for (const p of tous.data?.items || []) for (const s of p.competences) compte.set(s, (compte.get(s) || 0) + 1)
    return [...compte.entries()]
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .slice(0, 12)
      .map(([slug]) => ({ slug, label: skillName(slug) }))
  }, [tous.data, skillName])

  const selection = (slug) => navigate(slug === competence ? 'projets' : `projets?competence=${encodeURIComponent(slug)}`)

  if (tous.error) return <ErrorState error={tous.error} onRetry={tous.reload} />
  if (!tous.data) return <Loader label="Chargement des projets…" />

  const projets = filtres.data?.items || []

  return (
    <div>
      <div className="filters">
        <p className="eyebrow">Filtrer par compétence</p>
        <Tags items={filtresDisponibles} onSelect={selection} active={competence} />
      </div>

      {filtres.error ? (
        <ErrorState error={filtres.error} onRetry={filtres.reload} />
      ) : (
        <motion.div className="cards" layout>
          <AnimatePresence mode="popLayout">
            {projets.map((p, i) => {
              const metrique = Object.entries(p.metriques || {})[0]
              return (
                <motion.button
                  layout
                  key={p.projet_slug}
                  type="button"
                  className="card projet-card"
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.96 }}
                  transition={{ delay: Math.min(i, 8) * 0.05, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                  onClick={() => navigate(`projets/${p.projet_slug}`)}
                >
                  <p className="card-kicker">{p.contexte}</p>
                  <h3 className="card-title">{p.titre}</h3>
                  {formatPeriod(p.date_debut, p.date_fin) && (
                    <p className="card-period">{formatPeriod(p.date_debut, p.date_fin)}</p>
                  )}
                  <p className="card-desc">{truncate(p.description, 150)}</p>
                  {metrique && (
                    <p className="card-metric">
                      <strong>{String(metrique[1])}</strong> {humanizeKey(metrique[0])}
                    </p>
                  )}
                  <Tags items={skillTags(p.competences, skillName)} max={4} />
                </motion.button>
              )
            })}
          </AnimatePresence>
        </motion.div>
      )}
      {!filtres.loading && !filtres.error && projets.length === 0 && (
        <p className="empty">Aucun projet n’utilise cette compétence.</p>
      )}
    </div>
  )
}
