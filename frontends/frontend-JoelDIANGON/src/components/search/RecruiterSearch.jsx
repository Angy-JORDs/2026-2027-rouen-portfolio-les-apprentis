import { useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { api } from '../../api/client'
import { CERTIFICATIONS, LANGUES, isAssociatif } from '../../content/static'
import { useCandidat } from '../../context/CandidatContext'
import { useAsync } from '../../hooks/useAsync'
import { useLang, useT } from '../../i18n/LangContext'
import { answer, libelleQuestion, questionsDisponibles } from '../../lib/qa'
import { useCvViewer } from '../cv/CvViewer'
import { ArrowLeftIcon, ArrowRightIcon, ChevronUpIcon, CloseIcon, ExternalIcon, FaqIcon } from '../icons'
import { useCvAvailable } from '../ui/TopActions'

const TEXTES = {
  fr: {
    ouvrir: 'Questions fréquentes sur mon profil',
    titre: 'Questions fréquentes',
    toutes: 'Toutes les questions',
    fermer: 'Fermer',
    chargement: 'Chargement du profil…',
  },
  en: {
    ouvrir: 'Frequently asked questions',
    titre: 'Frequently asked questions',
    toutes: 'All questions',
    fermer: 'Close',
    chargement: 'Loading the profile…',
  },
}

/**
 * Questions fréquentes du recruteur : il choisit une question (années d'expérience, Python,
 * intelligence artificielle, langues…) et obtient la réponse, calculée à partir des données de l'API.
 * Pas de saisie libre : seules les questions auxquelles le profil permet de répondre sont proposées.
 *
 * Bilingue : le moteur (lib/qa.js) détecte l'intention sur la question française (sa clé) et les
 * données françaises (candidatFr, projets bruts), puis rédige la réponse dans la langue du site.
 * On ne garde que la clé de la question ouverte : la réponse est recalculée si la langue change.
 */
export default function RecruiterSearch({ onNavigate }) {
  const { candidatFr, skillName, skillNameFr } = useCandidat()
  const { lang, L } = useLang()
  const t = useT(TEXTES)
  const projets = useAsync('projets:', () => api.projets())
  const cvAvailable = useCvAvailable()
  const { openCv } = useCvViewer()
  const [open, setOpen] = useState(false)
  const [question, setQuestion] = useState(null) // clé (française) de la question affichée
  const rootRef = useRef(null)

  const ctx = useMemo(
    () => ({
      lang,
      L,
      candidat: candidatFr,
      projets: projets.data?.items || [],
      skillName: skillNameFr, // noms français : détection des compétences dans la question
      skillLabel: skillName, // noms affichés, dans la langue du site
      langues: candidatFr?.langues || LANGUES,
      certifications: candidatFr?.certifications || CERTIFICATIONS,
      cvAvailable,
      isAssociatif,
    }),
    [lang, L, candidatFr, projets.data, skillName, skillNameFr, cvAvailable],
  )

  const faq = useMemo(() => questionsDisponibles(ctx), [ctx])
  const result = useMemo(() => (question ? answer(question, ctx) : null), [question, ctx])

  const close = () => {
    setOpen(false)
    setQuestion(null)
  }

  const ask = (cle) => {
    setOpen(true)
    setQuestion(cle)
  }

  // Fermer avec Échap ou un clic en dehors
  useEffect(() => {
    if (!open) return undefined
    const onKey = (e) => e.key === 'Escape' && close()
    const onClick = (e) => rootRef.current && !rootRef.current.contains(e.target) && close()
    window.addEventListener('keydown', onKey)
    window.addEventListener('pointerdown', onClick)
    return () => {
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('pointerdown', onClick)
    }
  }, [open])

  const openItem = (item) => {
    if (item.ask) return ask(item.ask)
    if (item.cv) {
      close()
      return openCv()
    }
    if (item.href) {
      // E-mail : la messagerie s'ouvre directement, sans laisser d'onglet vide
      if (item.href.startsWith('mailto:')) {
        window.location.href = item.href
        return undefined
      }
      return window.open(item.href, '_blank', 'noopener')
    }
    if (item.to) {
      close()
      onNavigate(item.to)
    }
    return undefined
  }

  return (
    <div className="recruiter-search" ref={rootRef}>
      <AnimatePresence>
        {open && (
          <motion.div
            id="faq-card"
            className="rs-card"
            initial={{ opacity: 0, y: 10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            transition={{ type: 'spring', bounce: 0, duration: 0.3 }}
          >
            <div className="rs-answer-head">
              {result ? (
                <button type="button" className="rs-back" onClick={() => setQuestion(null)}>
                  <ArrowLeftIcon /> {t('toutes')}
                </button>
              ) : (
                <p className="rs-examples-title">{t('titre')}</p>
              )}
              <button type="button" className="rs-close" aria-label={t('fermer')} onClick={close}>
                <CloseIcon />
              </button>
            </div>

            {result ? (
              <div className="rs-answer" aria-live="polite">
                <p className="rs-question">{libelleQuestion(question, lang)}</p>
                <h3 className="rs-title">{result.title}</h3>
                {result.text && <p className="rs-text">{result.text}</p>}
                {result.items?.length > 0 && (
                  <ul className="rs-items">
                    {result.items.map((item, i) => (
                      <li key={`${item.label}-${i}`}>
                        <button type="button" className="rs-item" onClick={() => openItem(item)}>
                          <span className="rs-item-body">
                            <span className="rs-item-label">{item.label}</span>
                            {item.sub && <span className={`rs-item-sub${item.wrap ? ' is-wrap' : ''}`}>{item.sub}</span>}
                          </span>
                          {item.href ? <ExternalIcon /> : <ArrowRightIcon />}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ) : (
              <div className="rs-faq">
                {faq.length === 0 && <p className="rs-text">{t('chargement')}</p>}
                {faq.map((groupe) => (
                  <section key={groupe.id} className="rs-theme">
                    <h3 className="rs-theme-title">{groupe.theme}</h3>
                    <div className="rs-chips">
                      {groupe.questions.map((q) => (
                        <button key={q.key} type="button" className="rs-chip" onClick={() => ask(q.key)}>
                          {q.label}
                        </button>
                      ))}
                    </div>
                  </section>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <button
        type="button"
        className="rs-trigger"
        aria-expanded={open}
        aria-controls="faq-card"
        onClick={() => (open ? close() : setOpen(true))}
      >
        <FaqIcon className="rs-icon" />
        <span className="rs-trigger-label">{t('ouvrir')}</span>
        <ChevronUpIcon className={`rs-chevron${open ? ' is-open' : ''}`} />
      </button>
    </div>
  )
}
