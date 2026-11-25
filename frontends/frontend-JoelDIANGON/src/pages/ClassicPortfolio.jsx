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
import { useLang, useT } from '../i18n/LangContext'
import { sortByDateDesc } from '../lib/format'
import { skillTags } from '../sections/shared'

/**
 * Textes de la page en français et en anglais. Les ancres (« ancre_… ») s'affichent en capitales (CSS).
 * {nom} et {email} sont remplacés à l'affichage.
 */
const TEXTES = {
  fr: {
    chargement: 'Chargement du portfolio…',
    retourScene: 'Retour à la scène',
    versionImmersive: 'Version immersive',
    sections: 'Sections',
    ancre_experiences: 'Expériences',
    ancre_formation: 'Formation',
    ancre_projets: 'Projets',
    ancre_competences: 'Compétences',
    ancre_engagement: 'Engagement',
    ancre_langues: 'Langues',
    ancre_contact: 'Contact',
    surtitre: 'Portfolio',
    ecrire: 'Écrire à {nom} : {email}',
    portrait: 'Portrait de {nom}',
    experiences: 'Expériences professionnelles',
    formation: 'Formation',
    certifications: 'Certifications',
    projets: 'Projets',
    voirCode: 'Voir le code',
    competences: 'Compétences',
    engagement: 'Engagement associatif',
    langues: 'Langues',
    contact: 'Contact',
    contactTexte: 'Ouvert aux échanges autour de la data, de la BI et de l’IA.',
    retourImmersif: 'Revenir à la version immersive',
  },
  en: {
    chargement: 'Loading the portfolio…',
    retourScene: 'Back to the scene',
    versionImmersive: 'Immersive version',
    sections: 'Sections',
    ancre_experiences: 'Experience',
    ancre_formation: 'Education',
    ancre_projets: 'Projects',
    ancre_competences: 'Skills',
    ancre_engagement: 'Involvement',
    ancre_langues: 'Languages',
    ancre_contact: 'Contact',
    surtitre: 'Portfolio',
    ecrire: 'Email {nom}: {email}',
    portrait: 'Portrait of {nom}',
    experiences: 'Professional experience',
    formation: 'Education',
    certifications: 'Certifications',
    projets: 'Projects',
    voirCode: 'View the code',
    competences: 'Skills',
    engagement: 'Community involvement',
    langues: 'Languages',
    contact: 'Contact',
    contactTexte: 'Open to conversations about data, BI and AI.',
    retourImmersif: 'Back to the immersive version',
  },
}

/** Ancres de la barre du haut, dans l'ordre de la page (identifiants des sections « cp-… »). */
const ANCRES = ['experiences', 'formation', 'projets', 'competences', 'engagement', 'langues', 'contact']

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
 * Ouverte depuis « Voir la chronologie complète » (#/portfolio). Affichée dans la langue du site (fr / en).
 */
export default function ClassicPortfolio({ navigate }) {
  const { candidat, candidatFr, loading, error, reload, skillName } = useCandidat()
  const { L } = useLang()
  const t = useT(TEXTES)
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

  if (loading && !candidat) return <div className="cp"><Loader label={t('chargement')} /></div>
  if (error && !candidat) {
    return (
      <div className="cp">
        <div className="cp-inner">
          <ErrorState error={error} onRetry={reload}>
            <button type="button" className="btn" onClick={() => navigate('')}>
              {t('retourScene')}
            </button>
          </ErrorState>
        </div>
      </div>
    )
  }

  // Tri pro / associatif sur la donnée française : isAssociatif reconnaît des noms français
  // (« Club informatique ESIGELEC »), que la version anglaise remplace (« ESIGELEC Computer Club »).
  const experiencesFr = candidatFr?.experiences || candidat.experiences || []
  const pros = sortByDateDesc(experiencesFr.filter((e) => !isAssociatif(e)))
  const assos = sortByDateDesc(experiencesFr.filter(isAssociatif))
  const formations = sortByDateDesc(candidat.formations || [])
  // Les projets arrivent de l'API en français : traduits ici, à l'affichage
  const projets = [...(projetsQ.data?.items || [])]
    .sort((a, b) =>
      String(b.date_fin || b.date_debut || '9999').localeCompare(String(a.date_fin || a.date_debut || '9999')),
    )
    .map(L.projet)
  const langues = candidat.langues || LANGUES.map(L.langue)
  const certifications = candidat.certifications || CERTIFICATIONS.map(L.certification)
  const liens = candidat.liens || {}
  const nomComplet = [candidat.prenom, candidat.nom].filter(Boolean).join(' ')

  /** Expérience (donnée française) -> élément de frise, dans la langue du site. */
  const versFrise = (experienceFr, i) => {
    const e = L.experience(experienceFr)
    return {
      // Clé tirée du français : identique dans les deux langues (pas de nouvelle animation au changement)
      key: `${experienceFr.entreprise}-${i}`,
      period: L.period(e.debut, e.fin),
      title: e.poste,
      org: e.entreprise,
      description: e.description,
      tags: skillTags(e.competences, skillName),
    }
  }

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
        {/* aria-label : sur téléphone le texte est masqué, le bouton garde un nom pour les lecteurs d'écran */}
        <button type="button" className="cp-back" onClick={() => navigate('')} aria-label={t('versionImmersive')}>
          <ArrowLeftIcon /> <span>{t('versionImmersive')}</span>
        </button>
        <nav className="cp-anchors" aria-label={t('sections')}>
          {ANCRES.map((id) => (
            <button key={id} type="button" onClick={() => goTo(id)}>
              {t(`ancre_${id}`)}
            </button>
          ))}
        </nav>
        <TopActions />
      </header>

      <div className="cp-inner">
        <section className="cp-hero">
          <div className="cp-hero-text">
            <p className="eyebrow">{t('surtitre')}</p>
            <h1 className="cp-name">
              {candidat.prenom} {candidat.nom}
            </h1>
            <p className="cp-role">{candidat.titre}</p>
            {/* E-mail juste sous le titre : le moyen le plus direct de joindre Joël */}
            {liens.email && (
              <a
                className="cp-email"
                href={`mailto:${liens.email}`}
                aria-label={t('ecrire', { nom: nomComplet, email: liens.email })}
              >
                <ContactIcon />
                <span>{liens.email}</span>
              </a>
            )}
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
              alt={t('portrait', { nom: nomComplet })}
              width="640"
              height="640"
              decoding="async"
            />
          </figure>
        </section>

        <Section id="experiences" title={t('experiences')}>
          <Timeline items={pros.map(versFrise)} />
        </Section>

        <Section id="formation" title={t('formation')}>
          <Timeline
            items={formations.map((f, i) => ({
              key: `${f.ecole}-${i}`,
              period: L.period(f.debut, f.fin),
              title: f.diplome,
              org: f.ecole,
            }))}
          />
          <h3 className="cp-h3">{t('certifications')}</h3>
          <ul className="cp-list">
            {certifications.map((c) => (
              <li key={c.nom}>
                <span>{c.nom}</span> <span className="cp-muted">({c.statut})</span>
              </li>
            ))}
          </ul>
        </Section>

        <Section id="projets" title={t('projets')}>
          {projetsQ.error && <ErrorState error={projetsQ.error} onRetry={projetsQ.reload} />}
          {!projetsQ.data && !projetsQ.error && <Loader />}
          <div className="cp-projects">
            {projets.map((p) => {
              const periode = L.period(p.date_debut, p.date_fin)
              return (
                <article key={p.projet_slug} className="cp-project">
                  <p className="card-kicker">{p.contexte}</p>
                  <h3 className="cp-project-title">{p.titre}</h3>
                  {periode && <p className="card-period">{periode}</p>}
                  <p className="cp-project-desc">{p.description}</p>
                  {Object.keys(p.metriques || {}).length > 0 && (
                    <ul className="cp-metrics">
                      {Object.entries(p.metriques).map(([k, v]) => (
                        <li key={k}>
                          <strong>{String(v)}</strong> {L.metricLabel(k)}
                        </li>
                      ))}
                    </ul>
                  )}
                  <Tags items={skillTags(p.competences, skillName)} />
                  {p.liens?.github && (
                    <a className="cp-link" href={p.liens.github} target="_blank" rel="noreferrer">
                      {t('voirCode')} <ExternalIcon />
                    </a>
                  )}
                </article>
              )
            })}
          </div>
        </Section>

        <Section id="competences" title={t('competences')}>
          <div className="cp-skills">
            {parDomaine.map(([domaine, liste]) => (
              <div key={domaine} className="cp-skill-group">
                <h3 className="cp-h3">{L.domain(domaine)}</h3>
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
          <Section id="engagement" title={t('engagement')}>
            <Timeline items={assos.map(versFrise)} />
          </Section>
        )}

        <Section id="langues" title={t('langues')}>
          <ul className="cp-langues">
            {langues.map((l) => (
              <li key={l.langue}>
                <strong>{l.langue}</strong> <span className="cp-muted">{l.niveau}</span>
              </li>
            ))}
          </ul>
        </Section>

        <Section id="contact" title={t('contact')}>
          <p className="cp-bio">{t('contactTexte')}</p>
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
            <ArrowLeftIcon /> {t('retourImmersif')}
          </button>
        </footer>
      </div>
    </motion.div>
  )
}
