import { motion } from 'framer-motion'
import { api } from '../api/client'
import { ArrowLeftIcon, ArrowRightIcon, ExternalIcon, GithubIcon } from '../components/icons'
import Tags from '../components/ui/Tags'
import { ErrorState, Loader, Source } from '../components/ui/States'
import { useCandidat } from '../context/CandidatContext'
import { useAsync } from '../hooks/useAsync'
import { formatPeriod, humanizeKey } from '../lib/format'
import { skillTags } from './shared'

/**
 * Fiche d'un projet (R8) + projets similaires (R4).
 * Portfolio personnel : les similaires sont limités à mes propres projets (R2).
 */
export default function ProjetDetail({ slug, navigate }) {
  const { skillName } = useCandidat()
  const projet = useAsync(`projet:${slug}`, () => api.projet(slug))
  const similaires = useAsync(`similaires:${slug}`, () => api.similaires(slug, 8))
  const mesProjets = useAsync('projets:', () => api.projets())

  const retour = (
    <button type="button" className="link-back" onClick={() => navigate('projets')}>
      <ArrowLeftIcon /> Tous les projets
    </button>
  )

  if (projet.error) {
    return (
      <div>
        {retour}
        <ErrorState error={projet.error} onRetry={projet.error.status === 404 ? undefined : projet.reload} />
      </div>
    )
  }
  if (!projet.data) return <Loader label="Chargement du projet…" />

  const p = projet.data
  const miens = new Set((mesProjets.data?.items || []).map((x) => x.projet_slug))
  const proches = (similaires.data?.similaires || []).filter((s) => miens.has(s.projet_slug)).slice(0, 4)
  const metriques = Object.entries(p.metriques || {})
  const periode = formatPeriod(p.date_debut, p.date_fin)

  return (
    <motion.article
      key={p.projet_slug}
      className="projet-detail"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
    >
      {retour}
      <header className="projet-head">
        <p className="eyebrow">{p.contexte}</p>
        <h3 className="projet-title">{p.titre}</h3>
        {periode && <p className="projet-period">{periode}</p>}
      </header>

      <div className="section-grid">
        <div>
          <p className="projet-desc">{p.description}</p>

          {metriques.length > 0 && (
            <dl className="metrics">
              {metriques.map(([cle, valeur]) => (
                <div key={cle} className="metric">
                  <dt>{humanizeKey(cle)}</dt>
                  <dd>{String(valeur)}</dd>
                </div>
              ))}
            </dl>
          )}

          <p className="eyebrow">Compétences mobilisées</p>
          <Tags
            items={skillTags(p.competences, skillName)}
            onSelect={(s) => navigate(`projets?competence=${encodeURIComponent(s)}`)}
          />

          {p.liens?.github && (
            <a className="btn btn--ghost" href={p.liens.github} target="_blank" rel="noreferrer">
              <GithubIcon /> Voir le code sur GitHub <ExternalIcon />
            </a>
          )}
          <Source>MongoDB · GET /api/projets/{p.projet_slug} (R8)</Source>
        </div>

        <aside>
          <p className="eyebrow">Projets similaires</p>
          {similaires.loading && <Loader label="Recherche dans le graphe…" />}
          {similaires.error && <ErrorState error={similaires.error} onRetry={similaires.reload} />}
          {!similaires.loading && !similaires.error && proches.length === 0 && (
            <p className="empty">Aucun projet ne partage de compétence avec celui-ci.</p>
          )}
          <ul className="similar-list">
            {proches.map((s, i) => (
              <motion.li
                key={s.projet_slug}
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 + i * 0.08 }}
              >
                <button type="button" className="similar" onClick={() => navigate(`projets/${s.projet_slug}`)}>
                  <span className="similar-score" aria-label={`${s.competences_communes} compétences communes`}>
                    {s.competences_communes}
                  </span>
                  <span className="similar-body">
                    <span className="similar-title">{s.titre}</span>
                    <span className="similar-skills">{s.competences.map(skillName).join(' · ')}</span>
                  </span>
                  <ArrowRightIcon className="similar-arrow" />
                </button>
              </motion.li>
            ))}
          </ul>
          <Source>Neo4j · GET /api/graph/projets/{p.projet_slug}/similaires (R4)</Source>
        </aside>
      </div>
    </motion.article>
  )
}
