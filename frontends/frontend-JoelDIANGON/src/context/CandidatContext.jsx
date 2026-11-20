import { createContext, useContext, useMemo } from 'react'
import { api } from '../api/client'
import { useAsync } from '../hooks/useAsync'

/** Profil du candidat (R1) chargé une fois et partagé par la scène et toutes les sections. */
const CandidatContext = createContext(null)

export function CandidatProvider({ children }) {
  const query = useAsync('candidat', () => api.candidat())
  const { data, error, loading, reload } = query

  const value = useMemo(() => {
    const skills = new Map((data?.competences || []).map((c) => [c.skill_slug, c]))
    return {
      candidat: data,
      error,
      loading,
      reload,
      /** "power-bi" -> "Power BI" (nom déclaré par le candidat, sinon le slug). */
      skillName: (slug) => skills.get(slug)?.nom || slug,
    }
  }, [data, error, loading, reload])

  return <CandidatContext.Provider value={value}>{children}</CandidatContext.Provider>
}

export function useCandidat() {
  return useContext(CandidatContext)
}
