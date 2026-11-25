import { createContext, useContext, useMemo } from 'react'
import { api } from '../api/client'
import { CERTIFICATIONS, LANGUES } from '../content/static'
import { useAsync } from '../hooks/useAsync'
import { useLang } from '../i18n/LangContext'

/**
 * Profil du candidat (R1) chargé une fois et partagé par la scène et toutes les sections.
 *
 * `candidat` est déjà dans la langue du site (titre, bio, expériences, formations, langues, certifications,
 * noms des compétences) ; `candidatFr` est la donnée d'origine, en français (utile aux calculs qui
 * reconnaissent des mots français, comme le moteur de FAQ). Langues et certifications : l'API ne les
 * renvoie pas encore, on complète avec src/content/static.js.
 */
const CandidatContext = createContext(null)

export function CandidatProvider({ children }) {
  const query = useAsync('candidat', () => api.candidat())
  const { data, error, loading, reload } = query
  const { L } = useLang()

  const value = useMemo(() => {
    const candidatFr = data
      ? { ...data, langues: data.langues || LANGUES, certifications: data.certifications || CERTIFICATIONS }
      : data
    const skills = new Map((data?.competences || []).map((c) => [c.skill_slug, c]))
    const skillNameFr = (slug) => skills.get(slug)?.nom || slug
    return {
      candidat: L.candidat(candidatFr),
      candidatFr,
      error,
      loading,
      reload,
      /** "power-bi" -> "Power BI" ; "statistiques" -> "Analyse statistique" / "Statistical analysis". */
      skillName: (slug) => L.skill(slug, skillNameFr(slug)),
      /** Nom français d'origine (pour les calculs). */
      skillNameFr,
    }
  }, [data, error, loading, reload, L])

  return <CandidatContext.Provider value={value}>{children}</CandidatContext.Provider>
}

export function useCandidat() {
  return useContext(CandidatContext)
}
