import { useMemo, useRef } from 'react'
import { motion } from 'framer-motion'
import { api } from '../api/client'
import { ArrowLeftIcon, ContactIcon, ExternalIcon, GithubIcon, LinkedinIcon } from '../components/icons'
import Timeline from '../components/Timeline'
import Tags from '../components/ui/Tags'
import TopActions, { CvButton } from '../components/ui/TopActions'
import { ErrorState, Loader } from '../components/ui/States'
import { CERTIFICATIONS, LANGUES, isAssociatif } from '../content/static'
import { useCandidat } from '../context/CandidatContext'
import { useAsync } from '../hooks/useAsync'
import { formatPeriod, humanizeKey, sortByDateDesc } from '../lib/format'
import { skillTags } from '../sections/shared'

const ANCRES = [
  { id: 'experiences', label: 'Expériences' },
  { id: 'formation', label: 'Formation' },
  { id: 'projets', label: 'Projets' },
  { id: 'competences', label: 'Compétences' },
  { id: 'engagement', label: 'Engagement' },
  { id: 'langues', label: 'Langues' },
  { id: 'contact', label: 'Contact' },
]

const DOMAINES = {
  langages: 'Langages',
  bi: 'BI & data visualisation',
  'data-ia': 'Data & IA',
  'data-engineering': 'Data engineering',
  frameworks: 'Bibliothèques & frameworks',
  'bases-de-donnees': 'Bases de données',
  'developpement-web': 'Développement web',
  outils: 'Outils',
  'gestion-de-projet': 'Gestion de projet',
}

function Section({ id, title, children }) {
  return (
    <motion.section
      id={`cp-${id}`}
      className="cp-section"
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.12 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
    >
      <h2 className="cp-h2">{title}</h2>
      {children}
    </motion.section>
  )
}

/**
 * Version « classique » du portfolio : une seule page qui défile, du plus récent au plus ancien.
 * Ouverte depuis « Voir la chronologie complète » (#/portfolio).
 */
export default function ClassicPortfolio({ navigate }) {
  const { candidat, loading, error, reload, skillName } = useCandidat()
  const projetsQ = useAsync('projets:', () => api.projets())
  const scrollRef = useRef(null)

  const goTo = (id) => {
    const el = scrollRef.current?.querySelector(`#cp-${id}`)
    el?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const parDomaine = useMemo(() => {
    const groupes = new Map()
    for (const c of candidat?.competences || []) {
      const d = c.domaine || 'autres'
      if (!groupes.has(d)) groupes.set(d, [])
      groupes.get(d).push(c)
    }
    for (const liste of groupes.values()) liste.sort((a, b) => (b.niveau || 0) - (a.niveau || 0))
    return [...groupes.entries()]
  }, [candidat])

  if (loading && !candidat) return <div className="cp"><Loader label="Chargement du portfolio…" /></div>
  if (error && !candidat) {
    return (
      <div className="cp">
        <div className="cp-inner">
          <ErrorState error={error} onRetry={reload}>
            <button type="button" className="btn" onClick={() => navigate('')}>
              Retour à la scène
            </button>
          </ErrorState>
        </div>
      </div>
    )
  }

  const experiences = candidat.experiences || []
  const pros = sortByDateDesc(experiences.filter((e) => !isAssociatif(e)))
  const assos = sortByDateDesc(experiences.filter(isAssociatif))
  const formations = sortByDateDesc(candidat.formations || [])
  const projets = [...(projetsQ.data?.items || [])].sort((a, b) =>
    String(b.date_fin || b.date_debut || '9999').localeCompare(String(a.date_fin || a.date_debut || '9999')),
  )
  const langues = candidat.langues || LANGUES
  const certifications = candidat.certifications || CERTIFICATIONS
  const liens = candidat.liens || {}

  return (
    <motion.div
      className="cp"
      ref={scrollRef}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
    >
      <header className="cp-bar">
        <button type="button" className="cp-back" onClick={() => navigate('')}>
          <ArrowLeftIcon /> <span>Version immersive</span>
        </button>
        <nav className="cp-anchors" aria-label="Sections">
          {ANCRES.map((a) => (
            <button key={a.id} type="button" onClick={() => goTo(a.id)}>
              {a.label}
            </button>
          ))}
        </nav>
        <TopActions />
      </header>

      <div className="cp-inner">
        <section className="cp-hero">
          <div className="cp-hero-text">
            <p className="eyebrow">Portfolio</p>
            <h1 className="cp-name">
              {candidat.prenom} {candidat.nom}
            </h1>
            <p className="cp-role">{candidat.titre}</p>
            {candidat.bio && <p className="cp-bio">{candidat.bio}</p>}
            <div className="cp-hero-actions">
              <CvButton className="action-btn--large" />
              {liens.linkedin && (
                <a className="btn" href={liens.linkedin} target="_blank" rel="noreferrer">
                  <LinkedinIcon /> LinkedIn
                </a>
              )}
              {liens.github && (
                <a className="btn" href={liens.github} target="_blank" rel="noreferrer">
                  <GithubIcon /> GitHub
                </a>
              )}
            </div>
          </div>
          <figure className="cp-portrait">
            <img
              src="/portrait-joel-diangon.webp"
              alt={`Portrait de ${candidat.prenom} ${candidat.nom}`}
              width="640"
              height="640"
              decoding="async"
            />
          </figure>
        </section>

        <Section id="experiences" title="Expériences professionnelles">
          <Timeline
            items={pros.map((e, i) => ({
              key: `${e.entreprise}-${i}`,
              period: formatPeriod(e.debut, e.fin),
              title: e.poste,
              org: e.entreprise,
              description: e.description,
              tags: skillTags(e.competences, skillName),
            }))}
          />
        </Section>

        <Section id="formation" title="Formation">
          <Timeline
            items={formations.map((f, i) => ({
              key: `${f.ecole}-${i}`,
              period: formatPeriod(f.debut, f.fin),
              title: f.diplome,
              org: f.ecole,
            }))}
          />
          <h3 className="cp-h3">Certifications</h3>
          <ul className="cp-list">
            {certifications.map((c) => (
              <li key={c.nom}>
                <span>{c.nom}</span> <span className="cp-muted">({c.statut})</span>
              </li>
            ))}
          </ul>
        </Section>

        <Section id="projets" title="Projets">
          {projetsQ.error && <ErrorState error={projetsQ.error} onRetry={projetsQ.reload} />}
          {!projetsQ.data && !projetsQ.error && <Loader />}
          <div className="cp-projects">
            {projets.map((p) => (
              <article key={p.projet_slug} className="cp-project">
                <p className="card-kicker">{p.contexte}</p>
                <h3 className="cp-project-title">{p.titre}</h3>
                {formatPeriod(p.date_debut, p.date_fin) && (
                  <p className="card-period">{formatPeriod(p.date_debut, p.date_fin)}</p>
                )}
                <p className="cp-project-desc">{p.description}</p>
                {Object.keys(p.metriques || {}).length > 0 && (
                  <ul className="cp-metrics">
                    {Object.entries(p.metriques).map(([k, v]) => (
                      <li key={k}>
                        <strong>{String(v)}</strong> {humanizeKey(k)}
                      </li>
                    ))}
                  </ul>
                )}
                <Tags items={skillTags(p.competences, skillName)} />
                {p.liens?.github && (
                  <a className="cp-link" href={p.liens.github} target="_blank" rel="noreferrer">
                    Voir le code <ExternalIcon />
                  </a>
                )}
              </article>
            ))}
          </div>
        </Section>

        <Section id="competences" title="Compétences">
          <div className="cp-skills">
            {parDomaine.map(([domaine, liste]) => (
              <div key={domaine} className="cp-skill-group">
                <h3 className="cp-h3">{DOMAINES[domaine] || domaine}</h3>
                <ul className="tags">
                  {liste.map((c) => (
                    <li key={c.skill_slug}>
                      <span className="tag">{c.nom}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </Section>

        {assos.length > 0 && (
          <Section id="engagement" title="Engagement associatif">
            <Timeline
              items={assos.map((e, i) => ({
                key: `${e.entreprise}-${i}`,
                period: formatPeriod(e.debut, e.fin),
                title: e.poste,
                org: e.entreprise,
                description: e.description,
                tags: skillTags(e.competences, skillName),
              }))}
            />
          </Section>
        )}

        <Section id="langues" title="Langues">
          <ul className="cp-langues">
            {langues.map((l) => (
              <li key={l.langue}>
                <strong>{l.langue}</strong> <span className="cp-muted">{l.niveau}</span>
              </li>
            ))}
          </ul>
        </Section>

        <Section id="contact" title="Contact">
          <p className="cp-bio">
            Ouvert aux échanges autour de la data, de la BI et de l’IA.
          </p>
          <div className="cp-hero-actions">
            <CvButton className="action-btn--large" />
            {liens.email && (
              <a className="btn" href={`mailto:${liens.email}`}>
                <ContactIcon /> {liens.email}
              </a>
            )}
            {liens.linkedin && (
              <a className="btn" href={liens.linkedin} target="_blank" rel="noreferrer">
                <LinkedinIcon /> LinkedIn
              </a>
            )}
            {liens.github && (
              <a className="btn" href={liens.github} target="_blank" rel="noreferrer">
                <GithubIcon /> GitHub
              </a>
            )}
          </div>
        </Section>

        <footer className="cp-footer">
          <button type="button" className="btn" onClick={() => navigate('')}>
            <ArrowLeftIcon /> Revenir à la version immersive
          </button>
        </footer>
      </div>
    </motion.div>
  )
}
