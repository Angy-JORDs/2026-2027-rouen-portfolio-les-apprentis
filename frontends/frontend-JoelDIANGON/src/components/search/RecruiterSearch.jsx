import { useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { api } from '../../api/client'
import { CERTIFICATIONS, LANGUES, isAssociatif } from '../../content/static'
import { useCandidat } from '../../context/CandidatContext'
import { useAsync } from '../../hooks/useAsync'
import { answer, questionsDisponibles } from '../../lib/qa'
import { useCvViewer } from '../cv/CvViewer'
import { ArrowLeftIcon, ArrowRightIcon, ChevronUpIcon, CloseIcon, ExternalIcon, FaqIcon } from '../icons'
import { useCvAvailable } from '../ui/TopActions'

/**
 * Questions fréquentes du recruteur : il choisit une question (années d'expérience, projets en Python,
 * projets d'IA, langues…) et obtient la réponse, calculée à partir des données de l'API.
 * Pas de saisie libre : seules les questions auxquelles le profil permet de répondre sont proposées.
 */
export default function RecruiterSearch({ onNavigate }) {
  const { candidat, skillName } = useCandidat()
  const projets = useAsync('projets:', () => api.projets())
  const cvAvailable = useCvAvailable()
  const { openCv } = useCvViewer()
  const [open, setOpen] = useState(false)
  const [result, setResult] = useState(null)
  const rootRef = useRef(null)

  const ctx = useMemo(
    () => ({
      candidat,
      projets: projets.data?.items || [],
      langues: candidat?.langues || LANGUES,
      certifications: candidat?.certifications || CERTIFICATIONS,
      cvAvailable,
      skillName,
      isAssociatif,
    }),
    [candidat, projets.data, cvAvailable, skillName],
  )

  const faq = useMemo(() => questionsDisponibles(ctx), [ctx])

  const close = () => {
    setOpen(false)
    setResult(null)
  }

  const ask = (question) => {
    setOpen(true)
    setResult({ question, ...answer(question, ctx) })
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
    if (item.href) return window.open(item.href, '_blank', 'noopener')
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
                <button type="button" className="rs-back" onClick={() => setResult(null)}>
                  <ArrowLeftIcon /> Toutes les questions
                </button>
              ) : (
                <p className="rs-examples-title">Questions fréquentes</p>
              )}
              <button type="button" className="rs-close" aria-label="Fermer" onClick={close}>
                <CloseIcon />
              </button>
            </div>

            {result ? (
              <div className="rs-answer" aria-live="polite">
                <p className="rs-question">{result.question}</p>
                <h3 className="rs-title">{result.title}</h3>
                {result.text && <p className="rs-text">{result.text}</p>}
                {result.items?.length > 0 && (
                  <ul className="rs-items">
                    {result.items.map((item, i) => (
                      <li key={`${item.label}-${i}`}>
                        <button type="button" className="rs-item" onClick={() => openItem(item)}>
                          <span className="rs-item-body">
                            <span className="rs-item-label">{item.label}</span>
                            {item.sub && <span className="rs-item-sub">{item.sub}</span>}
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
                {faq.length === 0 && <p className="rs-text">Chargement du profil…</p>}
                {faq.map((groupe) => (
                  <section key={groupe.theme} className="rs-theme">
                    <h3 className="rs-theme-title">{groupe.theme}</h3>
                    <div className="rs-chips">
                      {groupe.questions.map((q) => (
                        <button key={q} type="button" className="rs-chip" onClick={() => ask(q)}>
                          {q}
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
        <span className="rs-trigger-label">Questions fréquentes sur mon profil</span>
        <ChevronUpIcon className={`rs-chevron${open ? ' is-open' : ''}`} />
      </button>
    </div>
  )
}
