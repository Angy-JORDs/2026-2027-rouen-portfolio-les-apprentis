import { motion } from 'framer-motion'
import { api } from '../api/client'
import { ArrowLeftIcon, ArrowRightIcon, ExternalIcon, GithubIcon } from '../components/icons'
import Tags from '../components/ui/Tags'
import { ErrorState, Loader } from '../components/ui/States'
import { useCandidat } from '../context/CandidatContext'
import { useAsync } from '../hooks/useAsync'
import { useLang, useT } from '../i18n/LangContext'
import { skillTags } from './shared'

const TEXTES = {
  fr: {
    retour: 'Tous les projets',
    chargement: 'Chargement du projet…',
    competences: 'Compétences mobilisées',
    github: 'Voir le code sur GitHub',
    similaires: 'Projets similaires',
    recherche: 'Recherche dans le graphe…',
    aucunSimilaire: 'Aucun projet ne partage de compétence avec celui-ci.',
    communes: ({ n }) => `${n} compétence${n > 1 ? 's' : ''} commune${n > 1 ? 's' : ''}`,
  },
  en: {
    retour: 'All projects',
    chargement: 'Loading project…',
    competences: 'Skills used',
    github: 'View the code on GitHub',
    similaires: 'Similar projects',
    recherche: 'Searching the graph…',
    aucunSimilaire: 'No other project shares a skill with this one.',
    communes: ({ n }) => `${n} skill${n === 1 ? '' : 's'} in common`,
  },
}

/**
 * Fiche d'un projet (R8) + projets similaires (R4).
 * Portfolio personnel : les similaires sont limités à mes propres projets (R2).
 */
export default function ProjetDetail({ slug, navigate }) {
  const { skillName } = useCandidat()
  const t = useT(TEXTES)
  const { L } = useLang()
  const projet = useAsync(`projet:${slug}`, () => api.projet(slug))
  const similaires = useAsync(`similaires:${slug}`, () => api.similaires(slug, 8))
  const mesProjets = useAsync('projets:', () => api.projets())

  const retour = (
    <button type="button" className="link-back" onClick={() => navigate('projets')}>
      <ArrowLeftIcon /> {t('retour')}
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
  if (!projet.data) return <Loader label={t('chargement')} />

  // Projet de l'API (en français) -> langue du site : titre, contexte, description, valeurs des métriques
  const p = L.projet(projet.data)
  const miens = new Set((mesProjets.data?.items || []).map((x) => x.projet_slug))
  const proches = (similaires.data?.similaires || []).filter((s) => miens.has(s.projet_slug)).slice(0, 4)
  const metriques = Object.entries(p.metriques || {})
  const periode = L.period(p.date_debut, p.date_fin)

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
                  <dt>{L.metricLabel(cle)}</dt>
                  <dd>{String(valeur)}</dd>
                </div>
              ))}
            </dl>
          )}

          <p className="eyebrow">{t('competences')}</p>
          <Tags
            items={skillTags(p.competences, skillName)}
            onSelect={(s) => navigate(`projets?competence=${encodeURIComponent(s)}`)}
          />

          {p.liens?.github && (
            <a className="btn btn--ghost" href={p.liens.github} target="_blank" rel="noreferrer">
              <GithubIcon /> {t('github')} <ExternalIcon />
            </a>
          )}
        </div>

        <aside>
          <p className="eyebrow">{t('similaires')}</p>
          {similaires.loading && <Loader label={t('recherche')} />}
          {similaires.error && <ErrorState error={similaires.error} onRetry={similaires.reload} />}
          {!similaires.loading && !similaires.error && proches.length === 0 && (
            <p className="empty">{t('aucunSimilaire')}</p>
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
                  <span className="similar-score" aria-label={t('communes', { n: s.competences_communes })}>
                    {s.competences_communes}
                  </span>
                  <span className="similar-body">
                    <span className="similar-title">{L.projetTitre(s.projet_slug, s.titre)}</span>
                    <span className="similar-skills">{s.competences.map((c) => skillName(c)).join(' · ')}</span>
                  </span>
                  <ArrowRightIcon className="similar-arrow" />
                </button>
              </motion.li>
            ))}
          </ul>
        </aside>
      </div>
    </motion.article>
  )
}
