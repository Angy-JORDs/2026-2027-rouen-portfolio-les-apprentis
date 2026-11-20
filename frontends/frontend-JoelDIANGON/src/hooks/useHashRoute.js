import { useCallback, useEffect, useState } from 'react'

/**
 * Navigation par l'URL (#/section/param?cle=valeur) : le bouton Retour du navigateur
 * et les liens directs fonctionnent (#/projets/edi-de-rijke, #/projets?competence=python).
 */
function parse() {
  const raw = window.location.hash.replace(/^#\/?/, '')
  const [path, queryString = ''] = raw.split('?')
  const [section = '', param = ''] = path.split('/').map((part) => decodeURIComponent(part || ''))
  return { section, param, query: Object.fromEntries(new URLSearchParams(queryString)) }
}

export function useHashRoute() {
  const [route, setRoute] = useState(parse)

  useEffect(() => {
    const onChange = () => setRoute(parse())
    window.addEventListener('hashchange', onChange)
    return () => window.removeEventListener('hashchange', onChange)
  }, [])

  /** navigate('') = scène ; navigate('projets/slug') ; navigate('projets?competence=python') */
  const navigate = useCallback((to = '') => {
    window.location.hash = `/${to}`
  }, [])

  return [route, navigate]
}
