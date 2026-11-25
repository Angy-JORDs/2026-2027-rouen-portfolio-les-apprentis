import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { LANGS, localizer } from './content'

/**
 * Langue du site (fr / en), partagée par toute l'application.
 *
 * Choix initial : paramètre d'adresse ?lang=en (lien à envoyer à un recruteur anglophone), sinon le dernier
 * choix mémorisé, sinon la langue du navigateur (anglais -> en), sinon le français.
 *
 *   const { lang, setLang, toggle, L } = useLang()   // L : traducteur des données (voir content.js)
 *   const t = useT(TEXTES)                           // textes d'interface colocalisés dans chaque composant
 */
const CLE = 'portfolio-lang'
const TITRES = { fr: 'Joël DIANGON · Mon parcours', en: 'Joël DIANGON · My journey' }

function langueInitiale() {
  try {
    const p = new URLSearchParams(window.location.search).get('lang')
    if (LANGS.includes(p)) return p
  } catch {
    /* adresse illisible : on passe à la suite */
  }
  try {
    const s = window.localStorage.getItem(CLE)
    if (LANGS.includes(s)) return s
  } catch {
    /* stockage indisponible (navigation privée…) */
  }
  try {
    if (/^en\b/i.test(window.navigator.language || '')) return 'en'
  } catch {
    /* navigateur sans langue déclarée */
  }
  return 'fr'
}

const LangContext = createContext({ lang: 'fr', setLang: () => {}, toggle: () => {}, L: localizer('fr') })

export function LangProvider({ children }) {
  const [lang, setLangState] = useState(langueInitiale)

  const setLang = useCallback((next) => {
    if (!LANGS.includes(next)) return
    setLangState(next)
    try {
      window.localStorage.setItem(CLE, next)
    } catch {
      /* stockage indisponible : le choix vaut pour cette visite */
    }
    // Si l'adresse contient ?lang=…, on la garde cohérente (un rechargement conserve la langue choisie)
    try {
      const url = new URL(window.location.href)
      if (url.searchParams.has('lang')) {
        url.searchParams.set('lang', next)
        window.history.replaceState(window.history.state, '', url)
      }
    } catch {
      /* adresse non modifiable : sans conséquence */
    }
  }, [])

  useEffect(() => {
    document.documentElement.lang = lang
    document.title = TITRES[lang] || TITRES.fr
  }, [lang])

  const value = useMemo(
    () => ({ lang, setLang, toggle: () => setLang(lang === 'fr' ? 'en' : 'fr'), L: localizer(lang) }),
    [lang, setLang],
  )

  return <LangContext.Provider value={value}>{children}</LangContext.Provider>
}

export function useLang() {
  return useContext(LangContext)
}

/**
 * Textes d'interface d'un composant, dans les deux langues :
 *   const TEXTES = { fr: { voir: 'Voir {n} projets' }, en: { voir: 'See {n} projects' } }
 *   const t = useT(TEXTES) ; t('voir', { n: 3 })
 * Une valeur peut aussi être une fonction (pluriels) : n => `${n} projet${n > 1 ? 's' : ''}`.
 * Clé absente en anglais -> texte français ; absente partout -> la clé elle-même (repérable).
 */
export function useT(textes) {
  const { lang } = useLang()
  return useCallback(
    (cle, vars) => {
      const v = textes?.[lang]?.[cle] ?? textes?.fr?.[cle] ?? cle
      if (typeof v === 'function') return v(vars ?? {})
      if (!vars) return v
      return String(v).replace(/\{(\w+)\}/g, (_, k) => (vars[k] ?? `{${k}}`))
    },
    [textes, lang],
  )
}
