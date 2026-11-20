import { useCallback, useEffect, useRef, useState } from 'react'

/**
 * Charge une donnée asynchrone identifiée par `key`, avec cache mémoire partagé :
 * rouvrir une section n'appelle pas l'API une seconde fois, et deux composants qui
 * demandent la même clé partagent la même requête.
 */
const cache = new Map() // key -> données
const inflight = new Map() // key -> Promise en cours

function load(key, fn) {
  if (!inflight.has(key)) {
    const promise = fn()
      .then((data) => {
        cache.set(key, data)
        return data
      })
      .finally(() => inflight.delete(key))
    inflight.set(key, promise)
  }
  return inflight.get(key)
}

export function useAsync(key, fn) {
  const fnRef = useRef(fn)
  fnRef.current = fn
  const [version, setVersion] = useState(0)
  const [state, setState] = useState(() =>
    cache.has(key) ? { data: cache.get(key), error: null, loading: false } : { data: null, error: null, loading: true },
  )

  useEffect(() => {
    if (key == null) return undefined
    if (cache.has(key)) {
      setState({ data: cache.get(key), error: null, loading: false })
      return undefined
    }
    let alive = true
    setState((s) => ({ ...s, loading: true, error: null }))
    load(key, () => fnRef.current())
      .then((data) => alive && setState({ data, error: null, loading: false }))
      .catch((error) => alive && setState({ data: null, error, loading: false }))
    return () => {
      alive = false
    }
  }, [key, version])

  const reload = useCallback(() => {
    cache.delete(key)
    setVersion((v) => v + 1)
  }, [key])

  return { ...state, reload }
}
